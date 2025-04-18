import torch
import numpy as np
import torch.nn as nn
import torch.optim as optim
from resnet_parameters import Parameters
from torch.utils.data import DataLoader
from ferplus import FERPlusReader, FERPlusDataset
from torchvision import transforms, models
from torch.optim.lr_scheduler import StepLR

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🟡 Using Device: {device}")

    # Load FERPlus dataset
    base_folder = "Datasets/FERPlus-master/data"
    label_file_name = "label.csv"
    parameters = Parameters()

    train_reader = FERPlusReader.create(base_folder, ["FER2013Train"], label_file_name, parameters)
    valid_reader = FERPlusReader.create(base_folder, ["FER2013Valid"], label_file_name, parameters)
    test_reader = FERPlusReader.create(base_folder, ["FER2013Test"], label_file_name, parameters)

    print(f"🟡 Loaded {train_reader.size(), valid_reader.size(), test_reader.size()} images.")

    # Define EfficientNet preprocessing (matches EfficientNet's expected input)
    train_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((224, 224)),  
        transforms.RandomHorizontalFlip(p=0.2),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  
    ])

    eval_transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((224, 224)),  
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  
    ])

    # Create PyTorch Datasets
    train_dataset = FERPlusDataset(train_reader, transform=train_transform)
    valid_dataset = FERPlusDataset(valid_reader, transform=eval_transform)
    test_dataset = FERPlusDataset(test_reader, transform=eval_transform)

    print(f"🟡 Training dataset size: {len(train_dataset)}")
    print(f"🟡 Validation dataset size: {len(valid_dataset)}")
    print(f"🟡 Test dataset size: {len(test_dataset)}")

    batch_size = 64
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=True)
    valid_loader = DataLoader(valid_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)

    print("🟡 DataLoaders created successfully")

    # Load Pretrained EfficientNet-B0
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)

    for param in model.parameters():  
        param.requires_grad = False  
    print("🟡 Froze all layers")

    # Unfreeze classifier layer for fine-tuning
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, 8)  
    for param in model.classifier.parameters():
        param.requires_grad = True  

    model.to(device)
    print("🟡 EfficientNet-B0 Model Loaded & Modified for FERPlus")

    # Define Loss Function & Optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
    scheduler = StepLR(optimizer, step_size=3, gamma=0.1)

    print("🟡 Using AdamW Optimizer")

    # Train model
    # train_model(model, train_loader, valid_loader, test_loader, criterion, optimizer, scheduler, num_epochs=10, device=device)
    model.load_state_dict(torch.load("best_model.pth", weights_only=True))
    print(test_model(model, test_loader, criterion, device))

def train_model(model, train_loader, val_loader, test_loader, criterion, optimizer, scheduler, num_epochs=10, device="cpu"):
    best_val_loss = float("inf")
    patience = 5  
    patience_counter = 0
    unfreeze_layers = 0

    for epoch in range(num_epochs):

        if (epoch + 1) % 3 == 0:
            # Get all feature blocks
            feature_blocks = list(model.features.children())
            
            # Calculate how many blocks to unfreeze (capped at total blocks)
            blocks_to_unfreeze = min(unfreeze_layers + 3, len(feature_blocks))
            
            if blocks_to_unfreeze > unfreeze_layers:
                # Unfreeze the deepest N blocks
                for block in feature_blocks[-blocks_to_unfreeze:]:
                    for param in block.parameters():
                        param.requires_grad = True
                
                unfreeze_layers = blocks_to_unfreeze
                print(f"🟢 Unfrozen last {unfreeze_layers} feature blocks at epoch {epoch+1}")

        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for batch in train_loader:
            images = batch['image']
            labels = batch['emotion'].argmax(dim=1)
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        train_loss = running_loss / len(train_loader)
        train_acc = 100 * correct / total

        val_loss, val_acc = validate_model(model, val_loader, criterion, device)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), "best_model.pth")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"🟡 Early stopping at epoch {epoch+1}.")
                break

        scheduler.step()

        print(f"Epoch [{epoch+1}/{num_epochs}] | Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}% | LR: {scheduler.get_last_lr()[0]:.6f}")

    print("Training complete. Best model saved as 'best_model.pth'.")

    model.load_state_dict(torch.load("best_model.pth"))
    print(test_model(model, test_loader, criterion, device))

def validate_model(model, val_loader, criterion, device="cpu"):
    model.eval()
    val_loss = 0.0
    val_correct = 0
    val_total = 0

    with torch.no_grad():
        for batch in val_loader:
            images = batch['image']
            labels = batch['emotion'].argmax(dim=1)
            images, labels = images.to(device), labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)

            val_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            val_total += labels.size(0)
            val_correct += predicted.eq(labels).sum().item()

    val_loss /= len(val_loader)
    val_acc = 100 * val_correct / val_total

    return val_loss, val_acc

def test_model(model, test_loader, criterion, device="cpu"):
    model.eval()  # Set model to evaluation mode
    test_loss = 0.0
    test_correct = 0
    test_total = 0

    with torch.no_grad():
        for batch in test_loader:
            images = batch['image']  
            labels = batch['emotion'] 
            labels = labels.argmax(dim=1)
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            test_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            test_total += labels.size(0)
            test_correct += predicted.eq(labels).sum().item()

    test_loss /= len(test_loader)
    test_acc = 100 * test_correct / test_total

    return f"Final Test Loss: {test_loss:.4f} | Final Test Accuracy: {test_acc:.2f}%"

if __name__ == "__main__":
    main()
