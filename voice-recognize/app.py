# Ensure tiktoken is installed if needed:
# pip install tiktoken

import os
import re
import tempfile
import time
import threading
import string
from datetime import datetime
import librosa
import numpy as np
import torch
from Levenshtein import ratio as similarity_ratio
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydub import AudioSegment
from speech_recognition import Recognizer, AudioFile, UnknownValueError
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from pymongo import MongoClient
from collections import defaultdict, Counter

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017/")
db = client["speech_therapy"]
conversations_collection = db["conversation_history"]
speech_results_collection = db["speech_results"]

# Session tracking
session_phrase_counters = defaultdict(Counter)
session_last_used = {}
SESSION_TTL = 7200  # 2 hours expiration
session_word_history = defaultdict(list)

# Echolalia constants
ECHOLALIA_THRESHOLD = 0.7
QUESTION_SUGGESTIONS = {
    "What's your name?": "No repeating! Try: My name is Alex",
    "Are you a boy or girl?": "No repeating! Try: I am a boy",
    "How old are you?": "No repeating! Try: I am 8 years old",
    "What's your favorite color?": "No repeating! Try: My favorite is blue",
    "What do you like to eat?": "No repeating! Try: I like pizza",
    "What's your favorite animal?": "No repeating! Try: I love dolphins"
}

def cleanup_sessions():
    now = time.time()
    stale_sessions = [sid for sid, last_used in session_last_used.items() if now - last_used > SESSION_TTL]
    for sid in stale_sessions:
        del session_phrase_counters[sid]
        del session_last_used[sid]
        del session_word_history[sid]
    threading.Timer(3600, cleanup_sessions).start()

cleanup_sessions()

# Configure ffmpeg path (adjust if necessary)
AudioSegment.ffmpeg = r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models using pipelines

# MNLI classifier with enhanced validation
mnli_classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli"
)

# Load emotion model
emotion_tokenizer = AutoTokenizer.from_pretrained("mrm8488/deberta-v3-base-goemotions", use_fast=False)
emotion_model = AutoModelForSequenceClassification.from_pretrained("mrm8488/deberta-v3-base-goemotions")
emotion_classifier = pipeline("text-classification", model=emotion_model, tokenizer=emotion_tokenizer, top_k=None)

QUESTION_SETS = {
    "main": [
        {"question": "What's your name?"},
        {"question": "Are you a boy or girl?"},
        {"question": "How old are you?"},
        {"question": "What's your favorite color?"},
        {"question": "What do you like to eat?"},
        {"question": "What's your favorite animal?"},
        {"question": "How are you feeling today?", "type": "emotion"},
        {"question": "What makes you excited?", "type": "emotion"},
        {"question": "What helps you feel calm?", "type": "emotion"},
        {"question": "What makes you feel proud?", "type": "emotion"}
    ]
}

EMOTION_RESPONSES = {
    "admiration": "That's really admirable! 🌟",
    "amusement": "Glad you're having fun! 😄",
    "anger": "Let's take deep breaths together... 🌬️",
    "annoyance": "Maybe we can find a better solution 💡",
    "approval": "That's great to hear! 👍",
    "caring": "That's very thoughtful of you 💖",
    "confusion": "Let's try to work through this together 🤔",
    "curiosity": "Curiosity is a great learning tool! 🔍",
    "desire": "That sounds exciting to pursue! 🎯",
    "disappointment": "I'm here to help things improve 🌈",
    "disapproval": "Let's talk about how to make it better 📢",
    "disgust": "That sounds unpleasant 😣",
    "embarrassment": "Everyone has moments like that 🤗",
    "excitement": "Wow, that's so exciting! 🎉",
    "fear": "You're safe here with me 🛡️",
    "gratitude": "Thank you for sharing that! 🙏",
    "grief": "I'm here to listen anytime 🕊️",
    "joy": "Your happiness is contagious! 😊",
    "love": "That's so full of warmth! ❤️",
    "nervousness": "Take your time, I'm here 🤝",
    "optimism": "That positive outlook is great! 🌈",
    "pride": "You should be proud! 🏆",
    "realization": "Ah-ha moments are the best! 💡",
    "relief": "Glad things worked out! 😌",
    "remorse": "It's okay to learn from experiences 📖",
    "sadness": "I'm here to help you feel better 🤗",
    "surprise": "Oh! That's interesting! 😯",
    "neutral": "Thanks for sharing how you feel! 💬"
}

EMOTION_LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring", "confusion",
    "curiosity", "desire", "disappointment", "disapproval", "disgust", "embarrassment",
    "excitement", "fear", "gratitude", "grief", "joy", "love", "nervousness", "optimism",
    "pride", "realization", "relief", "remorse", "sadness", "surprise", "neutral"
]

MAX_AUDIO_DURATION = 30
MIN_AUDIO_LENGTH = 0.1
recognizer = Recognizer()

# Enhanced validation configuration
VALIDATION_CONFIG = {
    "What's your name?": {
        "valid": ["provides a personal name", "states their actual name"],
        "invalid": ["avoids name disclosure", "mentions unrelated subject"]
    },
    "What's your favorite color?": {
        "valid": ["names a recognized color", "states a valid color name"],
        "invalid": ["mentions food items", "refers to objects", "uses non-color words"]
    },
    "What do you like to eat?": {
        "valid": ["mentions edible food", "describes consumable items"],
        "invalid": ["talks about inedible objects", "mentions clothing", "refers to non-food items"]
    },
    "What's your favorite animal?": {
        "valid": ["identifies an animal", "describes living creature"],
        "invalid": ["mentions objects", "avoids animal mention"]
    },
    "How old are you?": {
        "valid": ["states numerical age", "provides age information"],
        "invalid": ["avoids age disclosure", "mentions unrelated numbers"]
    }
}

def detect_echolalia(response: str, question: str) -> bool:
    normalized_response = response.lower().strip()
    normalized_question = question.lower().strip()
    
    # Check question similarity
    if similarity_ratio(normalized_response, normalized_question) > ECHOLALIA_THRESHOLD:
        return True
        
    # Check word repetition
    words = normalized_response.split()
    return any(count > 2 for count in Counter(words).values())

@app.get("/questions/{set_id}")
async def get_question_set(set_id: str):
    return JSONResponse([q["question"] for q in QUESTION_SETS.get(set_id, [])])

@app.get("/api/speech-training/words")
async def get_speech_words():
    return JSONResponse({"words": ["apple", "ball", "cat", "dog", "egg", "fish", "goat", "hat", "ice", "juice"]})

@app.post("/analyze")
async def analyze(
    session_id: str = Form(...),
    mode: str = Form("conversation"),
    question: str = Form(""),
    audio: UploadFile = File(None),
    text_response: str = Form(None)
):
    suggestions = []
    response_text = ""
    is_correct = False
    emotion_response = None
    mnli_label = ""
    
    try:
        session_last_used[session_id] = time.time()

        if audio:
            audio_path, wav_path = await process_audio(audio)
            response_text = await transcribe_audio(wav_path)
            os.unlink(audio_path)
            os.unlink(wav_path)
        elif text_response:
            response_text = text_response.strip()
        
        if not response_text:
            raise HTTPException(400, "No response provided")

        # Skip echolalia detection for speech training
        is_echolalia = False
        if mode != "speech_training":
            is_echolalia = detect_echolalia(response_text, question)

        if is_echolalia:
            is_correct = False
            suggestions.append(QUESTION_SUGGESTIONS.get(
                question, 
                "No repeating! Try to answer directly"
            ))
            mnli_label = "echolalia"
        else:
            if mode == "speech_training":
                # Enhanced text normalization
                translator = str.maketrans('', '', string.punctuation)
                normalized_response = response_text.translate(translator).lower().strip()
                normalized_question = question.translate(translator).lower().strip()
                
                is_correct = normalized_response == normalized_question
                confidence = 1.0 if is_correct else similarity_ratio(normalized_response, normalized_question)

                response_data = {
                    "is_correct": is_correct,
                    "confidence": float(confidence),
                    "is_echolalia": is_echolalia,
                    "expected_word": question,
                    "response": response_text,
                    "timestamp": datetime.now().isoformat()
                }

                speech_results_collection.insert_one({
                    "session_id": session_id,
                    **response_data
                })

                return JSONResponse(response_data)

            current_question = next(
                (q for q_set in QUESTION_SETS.values() 
                 for q in q_set if q["question"] == question),
                {"type": "general"}
            )

            if current_question.get("type") == "emotion":
                results = emotion_classifier(response_text)[0]
                filtered = [res for res in results if res["score"] > 0.1]
                if filtered:
                    top_emotion_idx = int(filtered[0]["label"].split("_")[-1])
                    top_emotion = EMOTION_LABELS[top_emotion_idx]
                    confidence = filtered[0]["score"]
                else:
                    top_emotion = "neutral"
                    confidence = 1.0

                emotion_response = EMOTION_RESPONSES.get(top_emotion.lower(), "Thanks for sharing how you feel!")
                
                return JSONResponse({
                    "emotion_response": emotion_response,
                    "emotion": top_emotion,
                    "confidence": round(float(confidence), 4),
                    "all_emotions": {EMOTION_LABELS[int(res["label"].split("_")[-1])]: res["score"] 
                                    for res in filtered}
                })

            # Enhanced model-driven validation
            normalized_response = response_text.lower()
            if question.lower() == "are you a boy or girl?":
                is_correct = any(word in normalized_response for word in ["boy", "girl"])
            elif question in VALIDATION_CONFIG:
                config = VALIDATION_CONFIG[question]
                candidate_labels = config["valid"] + config["invalid"]
                
                # Question-specific hypothesis templates
                hypothesis_template = (
                    "The response specifically names a color: {}." 
                    if question == "What's your favorite color?" else
                    "The response specifically mentions edible food: {}." 
                    if question == "What do you like to eat?" else
                    "The response explicitly states that {}."
                )
                
                result = mnli_classifier(
                    sequences=response_text,
                    candidate_labels=candidate_labels,
                    hypothesis_template=hypothesis_template
                )
                
                # Pure model decision
                top_label = result['labels'][0]
                is_correct = top_label in config["valid"]
                mnli_label = "entailment" if is_correct else "contradiction"
            else:
                is_correct = False
                mnli_label = "contradiction"

            if not is_correct and not is_echolalia:
                suggestions.append("Let's try to form a complete answer that directly addresses the question")

        conversations_collection.insert_one({
            "timestamp": datetime.now(),
            "session_id": session_id,
            "question": question,
            "response": response_text,
            "mnli_label": mnli_label,
            "suggestions": suggestions,
            "is_correct": is_correct
        })

        return JSONResponse({
            "question": question,
            "response": response_text,
            "suggestions": suggestions,
            "mnli_label": mnli_label,
            "is_correct": is_correct,
            "emotion_response": emotion_response
        })

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(500, detail=str(e))

async def process_audio(audio: UploadFile):
    try:
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp_file:
            audio_path = tmp_file.name
            content = await audio.read()
            tmp_file.write(content)
        
        audio_segment = AudioSegment.from_file(audio_path)
        wav_path = audio_path + ".wav"
        audio_segment.export(wav_path, format="wav", parameters=["-ac", "1", "-ar", "16000", "-sample_fmt", "s16"])
        
        if librosa.get_duration(path=wav_path) < MIN_AUDIO_LENGTH:
            raise HTTPException(400, "Audio too short")
            
        return audio_path, wav_path
    except Exception as e:
        raise HTTPException(500, detail=f"Audio processing error: {str(e)}")

async def transcribe_audio(wav_path: str):
    try:
        with AudioFile(wav_path) as source:
            recognizer.adjust_for_ambient_noise(source)
            audio_data = recognizer.record(source, duration=MAX_AUDIO_DURATION)
            return recognizer.recognize_google(audio_data)
    except UnknownValueError:
        raise HTTPException(400, "Speech recognition failed")
    except Exception as e:
        raise HTTPException(500, detail=f"Transcription error: {str(e)}")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=9000)
