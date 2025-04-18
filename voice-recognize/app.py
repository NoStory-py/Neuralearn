# app.py
import os
import whisper
import uvicorn
import time
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from shared import *
import conversation
import speech_training

app = FastAPI()

# Speech training configuration
TARGET_WORDS = ["apple", "ball", "cat", "dog", "egg", "fish", "goat", "hat", "ice", "juice"]

# Configure ffmpeg path (essential for Windows)
AudioSegment.ffmpeg = r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"  # Update this path if needed

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Whisper model with proper configuration
whisper_model = whisper.load_model("small", device="cpu")

def transcribe_with_whisper(wav_path: str) -> str:
    try:
        result = whisper_model.transcribe(
            wav_path,
            fp16=False,  # CPU mode
            language="en",
            temperature=0.2  # Better for single-word recognition
        )
        return result["text"].strip().lower()
    except Exception as e:
        raise HTTPException(500, detail=f"Whisper error: {str(e)}")

@app.get("/questions/{set_id}")
async def get_question_set(set_id: str):
    return JSONResponse([q["question"] for q in conversation.QUESTION_SETS.get(set_id, [])])

@app.get("/api/speech-training/words")
async def get_speech_words():
    return JSONResponse({"words": TARGET_WORDS})

@app.post("/analyze")
async def analyze(
    session_id: str = Form(...),
    mode: str = Form("conversation"),
    question: str = Form(""),
    audio: UploadFile = File(None),
    text_response: str = Form(None)
):
    try:
        session_last_used[session_id] = time.time()
        
        # Audio processing with enhanced error handling
        response_text = ""
        if audio:
            try:
                audio_path, wav_path = await process_audio(audio)
                response_text = transcribe_with_whisper(wav_path)
                print(f"\n[DEBUG] Speech-to-Text Output: '{response_text}'\n")
            finally:
                # Ensure cleanup even if transcription fails
                if 'audio_path' in locals() and os.path.exists(audio_path):
                    os.unlink(audio_path)
                if 'wav_path' in locals() and os.path.exists(wav_path):
                    os.unlink(wav_path)
        elif text_response:
            response_text = text_response.strip()

        if not response_text:
            raise HTTPException(400, "No response provided")

        # Route to appropriate handler
        handler = speech_training.handle_speech_training if mode == "speech_training" else conversation.handle_conversation
        result = await handler(session_id, question, response_text)

        return JSONResponse(result)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=9000)