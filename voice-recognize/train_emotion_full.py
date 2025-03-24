# train_emotion_full_colab.py
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments
)
from collections import Counter
import numpy as np
import evaluate
import torch

# Install required packages
#!pip install -q transformers datasets accelerate evaluate scikit-learn

# Check GPU availability
print(f"GPU available: {torch.cuda.is_available()}")
print(f"GPU name: {torch.cuda.get_device_name(0)}")

# Improved label processing
def simplify_labels(example):
    if isinstance(example["labels"], list):
        if len(example["labels"]) > 0:
            example["labels"] = example["labels"][0]
        else:
            example["labels"] = -100  # Invalid marker
    return example

# Load dataset
print("Loading dataset...")
dataset = load_dataset("go_emotions", "simplified")

# Process datasets
print("Processing data...")
train_dataset = dataset["train"].map(simplify_labels).filter(lambda x: x["labels"] != -100)
val_dataset = dataset["validation"].map(simplify_labels).filter(lambda x: x["labels"] != -100)

# Label distribution check
label_counts = Counter(train_dataset["labels"])
print("Label distribution:", label_counts.most_common())

# Tokenizer setup
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        padding="max_length",
        max_length=128,
    )

# Tokenize datasets
print("Tokenizing data...")
tokenized_train = train_dataset.map(tokenize_function, batched=True)
tokenized_val = val_dataset.map(tokenize_function, batched=True)

# Metric computation
def compute_metrics(eval_pred):
    accuracy_metric = evaluate.load("accuracy")
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    return accuracy_metric.compute(predictions=predictions, references=labels)

# Model setup
EMOTION_LABELS = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
    'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
    'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
    'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
    'relief', 'remorse', 'sadness', 'surprise', 'neutral'
]

print("Initializing model...")
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=28,
    id2label={i: label for i, label in enumerate(EMOTION_LABELS)},
    label2id={label: i for i, label in enumerate(EMOTION_LABELS)}
).to("cuda")

# Training arguments
training_args = TrainingArguments(
    output_dir="./emotion_model",
    evaluation_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=32,
    per_device_eval_batch_size=64,
    num_train_epochs=3,
    weight_decay=0.01,
    fp16=True,
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    greater_is_better=True,
    logging_steps=100,
    save_total_limit=2,
    report_to="none"
)

# Initialize Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_val,
    compute_metrics=compute_metrics
)

# Start training
print("Starting training...")
trainer.train()

# Save model
model.save_pretrained("./emotion_model")
tokenizer.save_pretrained("./emotion_model")
print("Training complete!")