import io
import torch
import uvicorn
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File
from torchvision import models, transforms
from PIL import Image

# -------------------- Config & Globals -------------------- #

EMOTIONS = ["Neutral", "Happiness", "Surprise", "Sadness", "Anger", "Disgust", "Fear", "Contempt"]
MODEL_PATH = "../EmotionRecognition/best_model.pth"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

TRANSFORM = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

# -------------------- Load Model -------------------- #

def load_model():
    model = models.resnet18(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, len(EMOTIONS))
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True))
    model.to(DEVICE)
    model.eval()
    return model

model = load_model()

# -------------------- Load Face Detector -------------------- #

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# -------------------- Face Extraction -------------------- #

def extract_face(image_pil: Image.Image) -> Image.Image:
    """Detect and crop face. Fallback to grayscale image if none found."""
    image_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        return image_pil.convert("L")  # fallback if no face detected

    x, y, w, h = faces[0]
    face = image_cv[y:y + h, x:x + w]
    face_pil = Image.fromarray(cv2.cvtColor(face, cv2.COLOR_BGR2RGB)).convert("L")
    return face_pil

# -------------------- FastAPI App -------------------- #

app = FastAPI()

@app.post("/predict_file/")
async def predict_emotion_file(file: UploadFile = File(...)):
    try:
        image = Image.open(file.file).convert("RGB")
        face = extract_face(image)
        tensor = TRANSFORM(face).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(tensor)
            _, predicted = torch.max(outputs, 1)

        return {"emotion": EMOTIONS[predicted.item()]}

    except Exception as e:
        return {"error": str(e)}

# -------------------- Run -------------------- #

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
