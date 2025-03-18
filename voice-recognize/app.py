# Add this FIRST to ensure FFmpeg path is recognized
import os
os.environ['PATH'] += r';C:\ffmpeg\bin'

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from speech_recognition import Recognizer, AudioFile, UnknownValueError
import librosa
import numpy as np
import torch
import tempfile
import time
from Levenshtein import ratio as similarity_ratio
from pydub import AudioSegment
import mimetypes

# Explicit FFmpeg configuration
AudioSegment.ffmpeg = r"C:\ffmpeg\bin\ffmpeg.exe"

app = Flask(__name__)
CORS(app)  # Enable CORS to allow requests from your React frontend

# Add MIME type for webm files
mimetypes.add_type('audio/webm', '.webm')

# Configuration
MODEL_PATHS = {
    'emotion': './emotion_model',
    'mnli': './mnli_model'
}
MAX_AUDIO_DURATION = 30  # seconds
MIN_AUDIO_LENGTH = 0.5   # Minimum valid audio length in seconds
SILENCE_THRESHOLD = 0.01  # RMS threshold for considering audio as silent

# Load models and label mappings
emotion_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATHS['emotion'])
emotion_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS['emotion'])
mnli_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATHS['mnli'])
mnli_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATHS['mnli'])

# Define human-readable labels
EMOTION_LABELS = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
    'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
    'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
    'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
    'relief', 'remorse', 'sadness', 'surprise', 'neutral'
]

MNLI_LABELS = ['entailment', 'neutral', 'contradiction']

# Update model label mappings
emotion_model.config.id2label = {i: label for i, label in enumerate(EMOTION_LABELS)}
mnli_model.config.id2label = {0: 'entailment', 1: 'neutral', 2: 'contradiction'}

recognizer = Recognizer()

# Global storage for previous phrases (for progress & echolalia detection)
previous_phrases = []

def is_silent(audio_path: str) -> bool:
    """Check if audio is silent using RMS energy"""
    y, sr = librosa.load(audio_path, sr=None)
    rms = librosa.feature.rms(y=y)
    return np.max(rms) < SILENCE_THRESHOLD

@app.route('/analyze', methods=['POST'])
def analyze():
    mode = request.form.get('mode', 'speech_accuracy')
    suggestions = []  # list to accumulate suggestions
    result = {}
    
    # ----- Practice Mode (Text Input) -----
    if mode == 'practice':
        practice_text = request.form.get('practice_text', '').strip()
        if not practice_text:
            return jsonify({'error': 'No practice text provided'}), 400
        result['text'] = practice_text

        # Emotion analysis on practice text
        inputs = emotion_tokenizer(practice_text, return_tensors="pt", truncation=True)
        with torch.no_grad():
            outputs = emotion_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        result['emotion'] = emotion_model.config.id2label[probs.argmax().item()]
        result['confidence'] = round(probs.max().item(), 4)

        # Echolalia check: compare with previous practice entries
        echolalia_detected = any(similarity_ratio(practice_text.lower(), prev.lower()) > 0.8 for prev in previous_phrases)
        if echolalia_detected:
            suggestions.append("Echolalia detected. Try to express new ideas rather than repeating phrases.")
        previous_phrases.append(practice_text)
        result['suggestions'] = suggestions
        return jsonify(result)
    
    # ----- Audio-based Modes (Speech Accuracy & Conversation) -----
    audio_path = None
    wav_path = None
    start_time = time.time()
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp_file:
            audio_path = tmp_file.name
            audio_file.save(audio_path)

        # Convert to WAV using pydub
        audio = AudioSegment.from_file(audio_path)
        wav_path = audio_path + ".wav"
        audio.export(wav_path, format="wav")

        # Check for silence
        if is_silent(wav_path):
            return jsonify({'error': 'No voice detected'}), 400

        # Check audio duration
        duration = librosa.get_duration(filename=wav_path)
        if duration < MIN_AUDIO_LENGTH:
            return jsonify({'error': 'Audio too short (minimum 0.5 seconds)'}), 400

        # Load audio data
        y, sr = librosa.load(wav_path, sr=None)

        # Speech recognition using Google Speech Recognition
        with AudioFile(wav_path) as source:
            try:
                audio_data = recognizer.record(source, duration=MAX_AUDIO_DURATION)
                text = recognizer.recognize_google(audio_data, show_all=False)
            except UnknownValueError:
                return jsonify({'error': 'No speech detected'}), 400

        result['text'] = text

        # Audio feature extraction: pitch and MFCC analysis
        pitches = librosa.yin(y, fmin=50, fmax=2000)
        pitch_mean = np.mean(pitches)
        pitch_std = np.std(pitches)
        audio_features = {
            'duration': duration,
            'pitch_mean': pitch_mean,
            'pitch_std': pitch_std,
            'mfcc': np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13), axis=1).tolist()
        }
        result['audio_features'] = audio_features

        # Echolalia detection: compare recognized text with previous phrases
        echolalia_detected = any(similarity_ratio(text.lower(), prev.lower()) > 0.8 for prev in previous_phrases)
        if echolalia_detected:
            suggestions.append("Echolalia detected. Try to express new ideas instead of repeating phrases.")
        previous_phrases.append(text)

        # Monotone detection: low pitch variation suggests monotone speech
        if pitch_std < 20:
            suggestions.append("Monotone speech detected. Try varying your tone and pitch for more expressive speech.")

        # ----- Mode-specific processing -----
        if mode == 'speech_accuracy':
            target = request.form.get('target', '')
            acc = similarity_ratio(text.lower(), target.lower()) * 100
            result['accuracy'] = round(acc, 2)
            inputs = emotion_tokenizer(text, return_tensors="pt", truncation=True)
            with torch.no_grad():
                outputs = emotion_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            result['emotion'] = emotion_model.config.id2label[probs.argmax().item()]
            result['confidence'] = round(probs.max().item(), 4)
            if acc < 70:
                suggestions.append("Pronunciation might need improvement. Practice articulating each word clearly.")

        elif mode == 'conversation':
            question = request.form.get('question', '')
            inputs = mnli_tokenizer(question, text, return_tensors="pt", truncation=True)
            with torch.no_grad():
                outputs = mnli_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            relevance = mnli_model.config.id2label[probs.argmax().item()]
            result['relevance'] = relevance
            result['confidence'] = round(probs.max().item(), 4)
            response_time = time.time() - start_time
            result['response_time'] = round(response_time, 2)
            if relevance in ['neutral', 'contradiction']:
                suggestions.append("Response seems off-topic. Try to answer more directly and relevantly.")

        result['suggestions'] = suggestions
        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({'error': 'Server processing error'}), 500

    finally:
        # Clean up temporary files
        for path in [audio_path, wav_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
