# train_mnli_full_t4_optimized.py
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments

# Load dataset
print("Loading MNLI dataset...")
dataset = load_dataset("multi_nli")

# Initialize tokenizer
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

# Tokenization function optimized for GPU
def tokenize_function(examples):
    return tokenizer(
        examples["premise"],
        examples["hypothesis"],
        truncation=True,
        padding="max_length",
        max_length=128,
        return_tensors="pt"
    )

# Process datasets
print("Tokenizing data...")
tokenized_train = dataset["train"].map(tokenize_function, batched=True, batch_size=1000)
tokenized_val = dataset["validation_matched"].map(tokenize_function, batched=True, batch_size=1000)

# Model configuration
print("Initializing model...")
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=3
)

# T4-optimized training arguments
training_args = TrainingArguments(
    output_dir="./mnli_model",
    evaluation_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,  # Fits perfectly in T4's 16GB VRAM
    per_device_eval_batch_size=32,
    num_train_epochs=3,
    weight_decay=0.01,
    fp16=True,  # Mixed precision for faster training
    gradient_accumulation_steps=2,
    logging_steps=100,
    save_total_limit=1,
    load_best_model_at_end=True,
    report_to="none"
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

# Save model
print("Saving model...")
model.save_pretrained("./mnli_model")
tokenizer.save_pretrained("./mnli_model")
print("Training complete!")