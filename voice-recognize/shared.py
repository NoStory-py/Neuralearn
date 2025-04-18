# shared.py
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
from fastapi import HTTPException
from pydub import AudioSegment
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

# Constants
ECHOLALIA_THRESHOLD = 0.7
MAX_AUDIO_DURATION = 30
MIN_AUDIO_LENGTH = 0.1

def cleanup_sessions():
    now = time.time()
    stale_sessions = [sid for sid, last_used in session_last_used.items() if now - last_used > SESSION_TTL]
    for sid in stale_sessions:
        del session_phrase_counters[sid]
        del session_last_used[sid]
        del session_word_history[sid]
    threading.Timer(3600, cleanup_sessions).start()

cleanup_sessions()

async def process_audio(audio):
    try:
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp_file:
            audio_path = tmp_file.name
            content = await audio.read()
            tmp_file.write(content)
        
        # Use pydub for reliable audio conversion
        audio_segment = AudioSegment.from_file(audio_path)
        wav_path = audio_path + ".wav"
        audio_segment.export(wav_path, format="wav", parameters=["-ac", "1", "-ar", "16000", "-sample_fmt", "s16"])
        
        if librosa.get_duration(path=wav_path) < MIN_AUDIO_LENGTH:
            raise HTTPException(400, "Audio too short")
            
        return audio_path, wav_path
    except Exception as e:
        raise HTTPException(500, detail=f"Audio processing error: {str(e)}")