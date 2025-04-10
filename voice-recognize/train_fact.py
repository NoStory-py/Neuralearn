# Install required libraries
#!pip install -q transformers datasets accelerate evaluate
import torch
import os
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from datasets import load_dataset
from google.colab import drive
import numpy as np
from evaluate import load

# 1. Mount Google Drive
drive.mount('/content/drive')

# 2. Upload dataset
from google.colab import files
print("Upload your training dataset (CSV file)")
uploaded = files.upload()
filename = list(uploaded.keys())[0]

# 3. Load and preprocess data
dataset = load_dataset('csv', data_files=filename)

label2id = {'name':0, 'color':1, 'food':2, 'animal':3, 'invalid':4}
id2label = {v:k for k,v in label2id.items()}

tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')

def tokenize_function(examples):
    return tokenizer(
        [f"{q} [SEP] {r}" for q,r in zip(examples['question'], examples['response'])],
        padding='max_length',
        truncation=True,
        max_length=128
    )

tokenized_dataset = dataset.map(tokenize_function, batched=True)
tokenized_dataset = tokenized_dataset.class_encode_column('label')

# 4. Split dataset
split_dataset = tokenized_dataset['train'].train_test_split(test_size=0.1)

# 5. Add accuracy metric
def compute_metrics(eval_pred):
    accuracy = load("accuracy")
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    return accuracy.compute(predictions=predictions, references=labels)

# 6. Model setup
model = DistilBertForSequenceClassification.from_pretrained(
    'distilbert-base-uncased',
    num_labels=5,
    id2label=id2label,
    label2id=label2id
).to('cuda')

# 7. Training configuration
training_args = TrainingArguments(
    output_dir='/content/drive/MyDrive/factual_model',  # Save to Drive
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    learning_rate=2e-5,
    eval_strategy='epoch',
    fp16=True,
    logging_steps=50,
    report_to='none',
    save_strategy='epoch'
)

# 8. Initialize trainer with metrics
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=split_dataset['train'],
    eval_dataset=split_dataset['test'],
    compute_metrics=compute_metrics
)

# 9. Start training
print("Starting training...")
trainer.train()

# 10. Save final model to Drive
model.save_pretrained('/content/drive/MyDrive/factual_model/final_model')
tokenizer.save_pretrained('/content/drive/MyDrive/factual_model/final_model')

# 11. Verify Drive save
print("\nSaved files in Google Drive:")
!ls -lh '/content/drive/MyDrive/factual_model/final_model'