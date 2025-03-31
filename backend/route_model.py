from fastapi import APIRouter, UploadFile, File, HTTPException
import io
import torch
import cv2
import numpy as np
from torchvision import models, transforms
from PIL import Image

# -------------------- Config -------------------- #
EMOTIONS = ["Neutral", "Happiness", "Surprise", "Sadness", "Anger", "Disgust", "Fear", "Contempt"]
MODEL_PATH = "../EmotionRecognition/best_model.pth"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

TRANSFORM = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load Model
def load_model():
    model = models.resnet18(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, len(EMOTIONS))
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True))
    model.to(DEVICE)
    model.eval()
    return model

model = load_model()

# Load Face Detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Extract Face
def extract_face(image_pil: Image.Image) -> Image.Image:
    image_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        return image_pil.convert("L")

    x, y, w, h = faces[0]
    face = image_cv[y:y + h, x:x + w]
    return Image.fromarray(cv2.cvtColor(face, cv2.COLOR_BGR2RGB)).convert("L")

# -------------------- FastAPI Route -------------------- #

model_router = APIRouter()

@model_router.post("/predict-emotion")
async def predict_emotion(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No image uploaded")

    try:
        image = Image.open(io.BytesIO(await file.read())).convert("RGB")
        face = extract_face(image)
        tensor = TRANSFORM(face).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(tensor)
            _, predicted = torch.max(outputs, 1)

        return {"emotion": EMOTIONS[predicted.item()]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
