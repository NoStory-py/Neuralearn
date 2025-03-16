# train_emotion_full.py
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments
)

# Function to convert multi-label to single-label
def simplify_labels(example):
    if isinstance(example["labels"], list) and len(example["labels"]) > 0:
        example["labels"] = example["labels"][0]
    else:
        example["labels"] = 0  # Neutral class
    return example

# Load and prepare dataset
print("Loading dataset...")
dataset = load_dataset("go_emotions", "simplified")

# Process datasets
print("Processing data...")
train_dataset = dataset["train"].map(simplify_labels)
val_dataset = dataset["validation"].map(simplify_labels)

# Initialize tokenizer
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# Tokenization function
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

# Model configuration for GTX 1650
print("Initializing model...")
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=28  # Fixed for GoEmotions simplified
)

# Optimized training arguments
training_args = TrainingArguments(
    output_dir="./emotion_model",    # Save directory
    evaluation_strategy="epoch",     # Evaluate after each epoch
    save_strategy="epoch",           # Save checkpoint every epoch
    learning_rate=2e-5,              # Lower learning rate for stability
    per_device_train_batch_size=8,   # Fits in 4GB VRAM
    per_device_eval_batch_size=8,
    num_train_epochs=3,              # Optimal for this setup
    weight_decay=0.01,               # Prevent overfitting
    fp16=True,                       # Enable mixed-precision training
    gradient_accumulation_steps=2,   # Effective batch size = 16
    logging_dir="./logs",            # For training metrics
    load_best_model_at_end=True,     # Keep best performing model
    save_total_limit=1,              # Limit checkpoints to save space
)

# Initialize Trainer
print("Starting training...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_val,
)

# Start training
trainer.train()

# Save final model
print("Saving model...")
model.save_pretrained("./emotion_model")
tokenizer.save_pretrained("./emotion_model")
print("Training complete!")