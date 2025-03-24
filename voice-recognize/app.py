import os
import tempfile
import time
import mimetypes
import numpy as np
import torch
import librosa
from Levenshtein import ratio as similarity_ratio
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from pydub import AudioSegment
from speech_recognition import Recognizer, AudioFile, UnknownValueError
from transformers import AutoModelForSequenceClassification, AutoTokenizer

# Set up FFmpeg paths (update as needed)
os.environ['PATH'] += r'C:\ProgramData\chocolatey\bin'
AudioSegment.ffmpeg = r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"

# Add MIME type for webm files
mimetypes.add_type('audio/webm', '.webm')

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Configure CORS (update origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_PATHS = {
    'emotion': './emotion_model',
    'mnli': './mnli_model'
}
MAX_AUDIO_DURATION = 30  # seconds
MIN_AUDIO_LENGTH = 0.1   # seconds
SILENCE_THRESHOLD = 0.005  # adjusted RMS threshold

# Load models and tokenizers
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

# Update label mappings
emotion_model.config.id2label = {i: label for i, label in enumerate(EMOTION_LABELS)}
mnli_model.config.id2label = {0: 'entailment', 1: 'neutral', 2: 'contradiction'}

recognizer = Recognizer()
previous_phrases = []

def is_silent(audio_path: str) -> bool:
    """Check if audio is silent using RMS energy."""
    try:
        y, sr = librosa.load(audio_path, sr=None)
        rms = librosa.feature.rms(y=y)
        max_rms = np.max(rms)
        print(f"Max RMS value: {max_rms}")  # Debug print to monitor RMS values
        return max_rms < SILENCE_THRESHOLD
    except Exception as e:
        print(f"Silence detection error: {e}")
        return True

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    # Render a template if needed; otherwise you can remove this endpoint.
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/analyze")
async def analyze(
    request: Request,
    mode: str = Form("speech_accuracy"),
    practice_text: str = Form(None),
    target: str = Form(""),
    question: str = Form(""),
    audio: UploadFile = File(None)
):
    suggestions = []
    result = {}
    start_time = time.time()

    # ----- Practice Mode (Text Input) -----
    if mode == 'practice':
        if not practice_text or practice_text.strip() == "":
            raise HTTPException(status_code=400, detail="No practice text provided")
        result['text'] = practice_text

        # Emotion analysis on practice text
        inputs = emotion_tokenizer(practice_text, return_tensors="pt", truncation=True)
        with torch.no_grad():
            outputs = emotion_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        result['emotion'] = emotion_model.config.id2label[probs.argmax().item()]
        result['confidence'] = round(probs.max().item(), 4)

        # Echolalia check
        if any(similarity_ratio(practice_text.lower(), prev.lower()) > 0.8 for prev in previous_phrases):
            suggestions.append("Echolalia detected. Try to express new ideas rather than repeating phrases.")
        previous_phrases.append(practice_text)
        result['suggestions'] = suggestions
        return JSONResponse(result)

    # ----- Audio-based Modes (Speech Accuracy & Conversation) -----
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")

    audio_path = None
    wav_path = None

    try:
        # Save the uploaded audio file as WebM (or another format)
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp_file:
            audio_path = tmp_file.name
            content = await audio.read()
            tmp_file.write(content)

        # Check file extension (optional, if needed)
        ext = os.path.splitext(audio.filename)[1].lower()
        if ext not in ['.webm', '.wav']:
            print(f"Unexpected file extension: {ext}. Attempting to process anyway.")

        # Convert file to WAV using pydub
        try:
            # Let pydub auto-detect the format if possible
            audio_segment = AudioSegment.from_file(audio_path)
        except Exception as e:
            print(f"Error reading audio file: {e}")
            raise HTTPException(status_code=400, detail="Invalid audio format")
        wav_path = audio_path + ".wav"
        try:
            # Force conversion to mono and 16kHz for better consistency
            audio_segment.export(wav_path, format="wav", parameters=["-ac", "1", "-ar", "16000"])
        except Exception as e:
            print(f"Error exporting WAV file: {e}")
            raise HTTPException(status_code=500, detail="Audio conversion failed")

        # Check for silence
        if is_silent(wav_path):
            raise HTTPException(status_code=400, detail="No voice detected")

        # Check audio duration
        duration = librosa.get_duration(filename=wav_path)
        if duration < MIN_AUDIO_LENGTH:
            raise HTTPException(status_code=400, detail="Audio too short (minimum 0.5 seconds)")
        result['audio_features'] = {'duration': duration}

        # Load audio data for feature extraction
        y, sr = librosa.load(wav_path, sr=None)

        # Speech recognition using Google Speech Recognition with ambient noise calibration
        with AudioFile(wav_path) as source:
            try:
                recognizer.adjust_for_ambient_noise(source)
                audio_data = recognizer.record(source, duration=MAX_AUDIO_DURATION)
                text = recognizer.recognize_google(audio_data, show_all=False)
            except UnknownValueError:
                raise HTTPException(status_code=400, detail="No speech detected")
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

        # Echolalia detection
        if any(similarity_ratio(text.lower(), prev.lower()) > 0.8 for prev in previous_phrases):
            suggestions.append("Echolalia detected. Try to express new ideas instead of repeating phrases.")
        previous_phrases.append(text)

        # Monotone detection
        if pitch_std < 20:
            suggestions.append("Monotone speech detected. Try varying your tone and pitch for more expressive speech.")

        # ----- Mode-specific processing -----
        if mode == 'speech_accuracy':
            if target:
                acc = similarity_ratio(text.lower(), target.lower()) * 100
                result['accuracy'] = round(acc, 2)
            inputs = emotion_tokenizer(text, return_tensors="pt", truncation=True)
            with torch.no_grad():
                outputs = emotion_model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            result['emotion'] = emotion_model.config.id2label[probs.argmax().item()]
            result['confidence'] = round(probs.max().item(), 4)
            if target and (acc < 70):
                suggestions.append("Pronunciation might need improvement. Practice articulating each word clearly.")

        elif mode == 'conversation':
            if not question:
                raise HTTPException(status_code=400, detail="No question provided for conversation mode")
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
        return JSONResponse(result)

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Server processing error: {e}")
        raise HTTPException(status_code=500, detail="Server processing error")
    finally:
        # Clean up temporary files
        for path in [audio_path, wav_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
