# speech_training.py
from shared import *
from fastapi import HTTPException
from rapidfuzz import fuzz

def detect_echolalia(response: str, question: str) -> bool:
    # Allow exact matches
    if response.strip().lower() == question.strip().lower():
        return False
    
    normalized_response = response.lower().strip()
    normalized_question = question.lower().strip()
    
    # Use fuzzywuzzy ratio (0-100 → 0.0-1.0)
    if fuzz.ratio(normalized_response, normalized_question) / 100 > ECHOLALIA_THRESHOLD:
        return True
        
    words = normalized_response.split()
    return any(count > 2 for count in Counter(words).values())

async def handle_speech_training(session_id, question, response_text):
    translator = str.maketrans('', '', string.punctuation)
    normalized_response = response_text.translate(translator).lower().strip()
    normalized_question = question.translate(translator).lower().strip()
    
    # Track attempts
    session_phrase_counters[session_id][question] += 1
    attempts = session_phrase_counters[session_id][question]
    
    # Dynamic threshold
    dynamic_threshold = 0.6 if attempts < 3 else 0.5
    
    # Calculate similarity using fuzzywuzzy
    confidence = fuzz.ratio(normalized_response, normalized_question) / 100
    is_correct = confidence >= dynamic_threshold
    is_echolalia = detect_echolalia(response_text, question)

    response_data = {
        "is_correct": is_correct,
        "confidence": float(confidence),
        "is_echolalia": is_echolalia,
        "expected_word": question,
        "response": response_text,
        "timestamp": datetime.now().isoformat(),
        "attempts": attempts
    }

    speech_results_collection.insert_one({
        "session_id": session_id,
        **response_data
    })

    return response_data