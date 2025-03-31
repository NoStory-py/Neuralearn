import os
import re
import tempfile
import time
import threading
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
from transformers import AutoModelForSequenceClassification, AutoTokenizer
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

def cleanup_sessions():
    now = time.time()
    stale_sessions = [sid for sid, last_used in session_last_used.items() if now - last_used > SESSION_TTL]
    for sid in stale_sessions:
        del session_phrase_counters[sid]
        del session_last_used[sid]
        del session_word_history[sid]
    threading.Timer(3600, cleanup_sessions).start()

cleanup_sessions()

AudioSegment.ffmpeg = r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATHS = {
    'emotion': './emotion_model',
    'mnli': './mnli_model'
}

QUESTION_SETS = {
    "basic": [
        {"question": "What's your name?", "premise": "The speaker states their personal name directly"},
        {"question": "Are you a boy or girl?", "premise": "The speaker explicitly states their gender as either male or female"},
        {"question": "How old are you?", "premise": "The speaker states their age using a number followed by 'years old'"},
        {"question": "What's your favorite color?", "premise": "The speaker names a specific color preference"},
        {"question": "What do you like to eat?", "premise": "The speaker has food preferences"},
        {"question": "What's your favorite animal?", "premise": "The speaker has an animal preference"}
    ],
    "school": [
        {"question": "What's your favorite subject?", "premise": "The speaker has academic preferences"},
        {"question": "Do you like reading?", "premise": "The speaker explicitly confirms or denies enjoying reading"},
        {"question": "What do you play at recess?", "premise": "The speaker's recreational activities"}
    ],
    "emotions": [
        {"question": "How are you feeling today?", "premise": "The speaker describes their current emotional state"},
        {"question": "What makes you happy?", "premise": "The speaker's sources of joy"},
        {"question": "What helps you calm down?", "premise": "The speaker's coping mechanisms"}
    ]
}

SPEECH_WORDS = ["apple", "ball", "cat", "dog", "egg", "fish", "goat", "hat", "ice", "juice"]
ECHOLALIA_PHRASE = "please repeat what did i say just now"

KEYWORD_CHECKS = {
    "Are you a boy or girl?": ["boy", "girl", "male", "female"],
    "How old are you?": [r"\d+", "year"],
    "Do you like reading?": ["yes", "no", "love", "like", "don't"],
    "What's your favorite color?": ["red", "blue", "green", "yellow", "purple", "orange", "pink", "brown", "black", "white"]
}

emotion_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATHS['emotion'])
emotion_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS['emotion'])
mnli_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATHS['mnli'])
mnli_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS['mnli'])

MAX_AUDIO_DURATION = 30
MIN_AUDIO_LENGTH = 0.1
ECHOLALIA_THRESHOLD = 0.85
recognizer = Recognizer()

@app.get("/questions/{set_id}")
async def get_question_set(set_id: str):
    return JSONResponse([q["question"] for q in QUESTION_SETS.get(set_id, [])])

@app.get("/api/speech-training/words")
async def get_speech_words():
    return JSONResponse({"words": SPEECH_WORDS})

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

        if mode == "speech_training":
            normalized_response = response_text.lower().strip()
            normalized_question = question.lower().strip()
            
            is_correct = normalized_response == normalized_question
            confidence = similarity_ratio(normalized_response, normalized_question)
            is_echolalia = similarity_ratio(normalized_response, ECHOLALIA_PHRASE) > 0.85

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

        premise = next(
            (q["premise"] for q_set in QUESTION_SETS.values() 
             for q in q_set if q["question"] == question),
            generate_declarative_premise(question)
        )

        is_name_question = question.lower() == "what's your name?"
        is_age_question = question.lower() == "how old are you?"
        is_color_question = question.lower() == "what's your favorite color?"
        
        if is_name_question:
            premise = "The speaker states their personal name directly"
            mnli_probs = torch.tensor([[2.0, -1.0, -1.0]])
            relevance = 'entailment'
        elif is_age_question and re.search(r"\d+", response_text):
            premise = "The speaker states their age using a number followed by 'years old'"
            mnli_probs = torch.tensor([[2.0, -1.0, -1.0]])
            relevance = 'entailment'
        else:
            mnli_inputs = mnli_tokenizer(premise, response_text, return_tensors="pt", truncation=True)
            with torch.no_grad():
                mnli_outputs = mnli_model(**mnli_inputs)
            mnli_probs = torch.nn.functional.softmax(mnli_outputs.logits, dim=-1)
            relevance = mnli_model.config.id2label[mnli_probs.argmax().item()]

        emotion_inputs = emotion_tokenizer(response_text, return_tensors="pt", truncation=True)
        emotion_outputs = emotion_model(**emotion_inputs)
        emotion_probs = torch.nn.functional.softmax(emotion_outputs.logits, dim=-1)
        top_emotion = emotion_model.config.id2label[emotion_probs.argmax().item()]

        phrase_counter = session_phrase_counters[session_id]
        normalized_response = response_text.lower().strip()
        normalized_question = question.lower().strip()

        if similarity_ratio(normalized_response, normalized_question) > ECHOLALIA_THRESHOLD:
            suggestions.append("Great repeating! Now try to answer in your own words")
        elif phrase_counter[normalized_response] >= 1:
            suggestions.append(f"Repeated phrase detected: '{normalized_response}'. Try to answer differently.")

        phrase_counter[normalized_response] += 1

        if question in KEYWORD_CHECKS:
            patterns = KEYWORD_CHECKS[question]
            match_found = any(re.search(pattern, response_text, re.I) for pattern in patterns)
            if not match_found:
                if is_color_question:
                    suggestions.append("That doesn't seem like a color. Please answer with a color name (e.g., red, blue, green).")
                else:
                    display_patterns = [p if p != r"\d+" else "number" for p in patterns]
                    suggestions.append(f"Try using words like: {', '.join(display_patterns)}")

        if not (is_name_question or is_age_question):
            threshold = 0.9 if is_color_question else 0.7
            if mnli_probs.max().item() < threshold:
                suggestions.append("Let's try that again. Can you explain differently?")
            if relevance != 'entailment':
                suggestions.append(f"Let's try again. The question was: '{question}'")

        if top_emotion in ['anger', 'fear']:
            suggestions.append("Let's try some calming exercises!")

        error_triggers = ["try", "repeat", "please", "use words like"]
        error_suggestions = [s for s in suggestions if "calming exercises" not in s.lower()]
        error_flag = any(any(trigger in s.lower() for trigger in error_triggers) for s in error_suggestions)
        if not error_flag:
            is_correct = True

        if not suggestions:
            suggestions.append("Awesome answer! Great job communicating!")
        
        conversations_collection.insert_one({
            "timestamp": datetime.now(),
            "session_id": session_id,
            "question": question,
            "response": response_text,
            "premise": premise,
            "relevance": relevance,
            "confidence": float(mnli_probs.max().item()),
            "emotion": {
                "label": top_emotion,
                "confidence": float(emotion_probs[0][emotion_probs.argmax()].item())
            },
            "suggestions": suggestions,
            "repetition_count": phrase_counter[normalized_response]
        })

        return JSONResponse({
            "question": question,
            "response": response_text,
            "premise": premise,
            "relevance": relevance,
            "confidence": round(mnli_probs.max().item(), 4),
            "emotion": {
                "label": top_emotion,
                "confidence": round(emotion_probs[0][emotion_probs.argmax()].item(), 4)
            },
            "suggestions": suggestions,
            "repetition_count": phrase_counter[normalized_response],
            "timestamp": datetime.now().isoformat(),
            "is_correct": is_correct
        })

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(500, detail=str(e))

def generate_declarative_premise(question: str) -> str:
    patterns = {
        r"what's? your name\?": "The speaker states their personal name directly",
        r"are you a boy or girl\?": "The speaker explicitly states their gender as either male or female",
        r"how old are you\?": "The speaker states their age using a number followed by 'years old'",
        r"what's your favorite color\?": "The speaker names a specific color preference",
        r"do you like reading\?": "The speaker explicitly confirms or denies enjoying reading",
        r"how are you feeling\?": "The speaker describes their current emotional state"
    }
    
    question_lower = question.lower()
    for pattern, template in patterns.items():
        if re.match(pattern, question_lower):
            return template
    
    return f"The statement '{question.replace('?', '').capitalize()}' is being explicitly discussed"

async def process_audio(audio: UploadFile):
    try:
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp_file:
            audio_path = tmp_file.name
            content = await audio.read()
            tmp_file.write(content)
        
        audio_segment = AudioSegment.from_file(audio_path)
        wav_path = audio_path + ".wav"
        audio_segment.export(wav_path, format="wav", parameters=["-ac", "1", "-ar", "16000"])
        
        if librosa.get_duration(filename=wav_path) < MIN_AUDIO_LENGTH:
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
    app.run(host='0.0.0.0', port=5000)