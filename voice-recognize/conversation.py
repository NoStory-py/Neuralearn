# conversation.py
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from shared import *
from fastapi import HTTPException

# Conversation constants
QUESTION_SUGGESTIONS = {
    "What's your name?": "No repeating! Try: My name is Alex",
    "Are you a boy or girl?": "No repeating! Try: I am a boy",
    "How old are you?": "No repeating! Try: I am 8 years old",
    "What's your favorite color?": "No repeating! Try: My favorite is blue",
    "What do you like to eat?": "No repeating! Try: I like pizza",
    "What's your favorite animal?": "No repeating! Try: I love dolphins"
}

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

VALIDATION_CONFIG = {
    "What's your name?": {
        "valid": ["provides a personal name in a complete sentence"],
        "invalid": ["avoids name disclosure", "uses incomplete sentence"],
        "min_words": 3,
        "example": "My name is Alex"
    },
    "What's your favorite color?": {
        "valid": ["states a valid color in a complete sentence"],
        "invalid": ["mentions non-color items", "uses incomplete phrase"],
        "min_words": 4,
        "example": "My favorite color is blue"
    },
    "What do you like to eat?": {
        "valid": ["mentions edible food in a complete sentence"],
        "invalid": ["talks about inedible objects", "uses incomplete phrase"],
        "min_words": 4,
        "example": "I like to eat pizza"
    },
    "What's your favorite animal?": {
        "valid": ["identifies an animal in a complete sentence"],
        "invalid": ["mentions objects", "uses incomplete phrase"],
        "min_words": 4,
        "example": "My favorite animal is a dolphin"
    },
    "How old are you?": {
        "valid": ["states age in a complete sentence with years"],
        "invalid": ["avoids age disclosure", "uses incomplete phrase"],
        "min_words": 5,
        "example": "I am 8 years old"
    }
}

# Initialize models
mnli_classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli"
)

emotion_tokenizer = AutoTokenizer.from_pretrained("mrm8488/deberta-v3-base-goemotions", use_fast=False)
emotion_model = AutoModelForSequenceClassification.from_pretrained("mrm8488/deberta-v3-base-goemotions")
emotion_classifier = pipeline("text-classification", model=emotion_model, tokenizer=emotion_tokenizer, top_k=None)

async def handle_conversation(session_id, question, response_text):
    suggestions = []
    is_correct = False
    emotion_response = None
    mnli_label = ""
    
    is_echolalia = detect_echolalia(response_text, question)
    
    if is_echolalia:
        is_correct = False
        suggestions.append(QUESTION_SUGGESTIONS.get(
            question, 
            "No repeating! Try to answer directly"
        ))
        mnli_label = "echolalia"
    else:
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
            
            return {
                "emotion_response": emotion_response,
                "emotion": top_emotion,
                "confidence": round(float(confidence), 4),
                "all_emotions": {EMOTION_LABELS[int(res["label"].split("_")[-1])]: res["score"] 
                                 for res in filtered}
            }

        normalized_response = response_text.lower()
        if question in VALIDATION_CONFIG:
            config = VALIDATION_CONFIG[question]
            min_words = config.get("min_words", 3)
            
            if len(response_text.split()) < min_words:
                is_correct = False
                suggestions.append(f"Please answer in a complete sentence like: '{config.get('example', '')}'")
                mnli_label = "short_answer"
            else:
                candidate_labels = config["valid"] + config["invalid"]
                hypothesis_template = (
                    "The response is a complete sentence stating a favorite color, like 'My favorite color is blue': {}." 
                    if question == "What's your favorite color?" else
                    "The response is a complete sentence about food preferences, like 'I like to eat pizza': {}." 
                    if question == "What do you like to eat?" else
                    "The response is a complete sentence that explicitly states: {}."
                )
                
                result = mnli_classifier(
                    sequences=response_text,
                    candidate_labels=candidate_labels,
                    hypothesis_template=hypothesis_template
                )
                
                top_label = result['labels'][0]
                is_correct = top_label in config["valid"]
                mnli_label = "entailment" if is_correct else "contradiction"

        elif question.lower() == "are you a boy or girl?":
            if len(response_text.split()) < 3:
                is_correct = False
                suggestions.append("Please answer in a complete sentence like: 'I am a boy' or 'I am a girl'")
                mnli_label = "short_answer"
            else:
                is_correct = any(word in normalized_response for word in ["boy", "girl"])
                mnli_label = "entailment" if is_correct else "contradiction"
        else:
            is_correct = False
            mnli_label = "contradiction"

        if not is_correct and not is_echolalia and mnli_label != "short_answer":
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

    return {
        "question": question,
        "response": response_text,
        "suggestions": suggestions,
        "mnli_label": mnli_label,
        "is_correct": is_correct,
        "emotion_response": emotion_response
    }

def detect_echolalia(response: str, question: str) -> bool:
    normalized_response = response.lower().strip()
    normalized_question = question.lower().strip()
    
    if similarity_ratio(normalized_response, normalized_question) > ECHOLALIA_THRESHOLD:
        return True
        
    words = normalized_response.split()
    return any(count > 2 for count in Counter(words).values())