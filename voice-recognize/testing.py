import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import torch.nn.functional as F

# Path to your locally saved model
MODEL_PATH = "./fact_model"  # Change this

# Load tokenizer and model
tokenizer = DistilBertTokenizer.from_pretrained(MODEL_PATH)
model = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval().to('cuda' if torch.cuda.is_available() else 'cpu')

# Label mapping
id2label = {0: 'name', 1: 'color', 2: 'food', 3: 'animal', 4: 'invalid'}

# Function to classify and show top-3 predictions
def predict_fact_class(question, response):
    input_text = f"{question} [SEP] {response}"
    inputs = tokenizer(input_text, return_tensors="pt", truncation=True, padding=True).to(model.device)

    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=1)
        top_probs, top_ids = torch.topk(probs, 3)

    top_predictions = [(id2label[top_ids[0][i].item()], top_probs[0][i].item()) for i in range(3)]
    pred_label, confidence = top_predictions[0]

    return pred_label, confidence, top_predictions

# Test examples
examples = [
    {"question": "What is your favorite color?", "response": "My favourite color is Blue"},
    {"question": "What is your name?", "response": "My name is John"},
    {"question": "What animal do you like?", "response": "I like Dogs the most"},
    {"question": "What's your favorite drink?", "response": "My favorite drink is Coke"}
]

# Run predictions
for ex in examples:
    label, conf, top_preds = predict_fact_class(ex["question"], ex["response"])
    print(f"Q: {ex['question']}\nA: {ex['response']}")
    print(f"→ Predicted: {label} (Confidence: {conf:.2f})")
    print("→ Top 3 predictions:")
    for lbl, prob in top_preds:
        print(f"   - {lbl}: {prob:.2f}")
    print()
