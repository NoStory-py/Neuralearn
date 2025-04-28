import os
import sys
import whisper
import uvicorn
import time
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydub import AudioSegment

# Add backend to path
sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "backend")
    )
)

from shared import *
import conversation
import speech_training
from helper import get_current_user
from models import UserProfile

app = FastAPI()

# Configure ffmpeg path (Windows)
AudioSegment.ffmpeg = r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Whisper model with proper configuration
whisper_model = whisper.load_model("base", device="cpu")

def transcribe_with_whisper(wav_path: str) -> str:
    try:
        result = whisper_model.transcribe(
            wav_path,
            fp16=False,
            language="en",
            temperature=0.2
        )
        return result["text"].strip().lower()
    except Exception as e:
        raise HTTPException(500, detail=f"Whisper error: {e}")

@app.get("/questions/{set_id}")
async def get_question_set(set_id: str, user: dict = Depends(get_current_user)):
    return JSONResponse([q["question"] for q in conversation.QUESTION_SETS.get(set_id, [])])

@app.get("/api/speech-training/words")
async def get_speech_words(user: dict = Depends(get_current_user)):
    """Get personalized speech words from user profile"""
    profile = UserProfile(**user)
    words = [
        profile.username,
        profile.gender,
        str(profile.age) if profile.age else None,
        profile.favoriteColor,
        profile.favoriteFood,
        profile.favoriteAnimal,
        profile.favoriteCartoon
    ]
    return JSONResponse({"words": [w for w in words if w]})

@app.post("/analyze")
async def analyze(
    session_id: str = Form(...),
    mode: str = Form("conversation"),
    question: str = Form(""),
    audio: UploadFile = File(None),
    text_response: str = Form(None),
    user: dict = Depends(get_current_user)
):
    try:
        session_last_used[session_id] = time.time()
        response_text = ""

        # Audio processing
        if audio:
            try:
                audio_path, wav_path = await process_audio(audio)
                response_text = transcribe_with_whisper(wav_path)
            finally:
                for p in (audio_path, wav_path):
                    if p and os.path.exists(p):
                        os.unlink(p)
        elif text_response:
            response_text = text_response.strip()

        if not response_text:
            raise HTTPException(400, "No response provided")

        # Route to appropriate handler
        if mode == "speech_training":
            result = await speech_training.handle_speech_training(
                session_id, question, response_text
            )
        else:
            result = await conversation.handle_conversation(
                session_id, 
                question, 
                response_text, 
                {"profile": user} 
            )

        return JSONResponse(result)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run("app:app", host="0.0.0.0", port=9000, reload=True)