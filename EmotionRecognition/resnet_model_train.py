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
        
    # Assigning processor
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🟡 Using Device: {device}")

    # Loading training, validation and testing data
    base_folder = "Datasets/FERPlus-master/data"
    label_file_name = "label.csv"
    parameters = Parameters()

    train_reader = FERPlusReader.create(base_folder, ["FER2013Train"], label_file_name, parameters)
    valid_reader = FERPlusReader.create(base_folder, ["FER2013Valid"], label_file_name, parameters)
    test_reader = FERPlusReader.create(base_folder, ["FER2013Test"], label_file_name, parameters)

    print(f"🟡 Loaded {train_reader.size(), valid_reader.size(), test_reader.size()} images for training.")

    # Define transformations (ResNet-18 expects 224x224 images normalized)
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

    # Creating dataset instances after Converting the loaded data into pytorch dataset using FERPlusDataset
    train_dataset = FERPlusDataset(train_reader, transform=train_transform)
    valid_dataset = FERPlusDataset(valid_reader, transform=eval_transform)
    test_dataset = FERPlusDataset(test_reader, transform=eval_transform)

    print(f"🟡 Training dataset size: {len(train_dataset)}")
    print(f"🟡 Validation dataset size: {len(valid_dataset)}")
    print(f"🟡 Test dataset size: {len(test_dataset)}")

    # Create DataLoaders
    batch_size = 64

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True)
    valid_loader = DataLoader(valid_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)

    print("🟡 DataLoaders created successfully")

    # Load Pretrained ResNet-18
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)  

    for param in model.parameters(): # Freeze all layers
        param.requires_grad = False
    print("🟡 Froze all layers")

    for param in model.layer2.parameters():
        param.requires_grad = True

    # Unfreeze the third residual block (layer3)
    for param in model.layer3.parameters():
        param.requires_grad = True

    # Unfreeze the fourth residual block (layer4)
    for param in model.layer4.parameters():
        param.requires_grad = True

    # Unfreeze the fully connected layer (fc)
    for param in model.fc.parameters():
        param.requires_grad = True
    print("🟡 UnFroze layers 2,3,4,fc")

    num_features= model.fc.in_features # Get the number of input features for the final layer 
    model.fc = nn.Linear(num_features, 8) # Replace the last fully connected layer (for 8 emotions)
 
    model.to(device)    
    
    print("🟡 ResNet-18 Model Loaded & Modified for FERPlus")

    # Define Loss Function (Cross-Entropy for classification) and Define Optimizer (Adam for adaptive learning)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = StepLR(optimizer, step_size=5, gamma=0.1)

    print("🟡 Loss Function & Optimizer Defined")

    # Train Function to train the model
    # train_model(model, train_loader, valid_loader, test_loader, criterion, optimizer, scheduler, num_epochs=10, device=device)

    # External Test
    model.load_state_dict(torch.load("best_model.pth", weights_only=True))
    print(test_model(model, test_loader, criterion, device))

# Model Training Function
def train_model(model, train_loader, val_loader, test_loader, criterion, optimizer, scheduler, num_epochs=10, device="cpu"):
    
    best_val_loss = float("inf")
    patience = 5  # Number of epochs to wait for improvement
    patience_counter = 0

    for epoch in range(num_epochs):
        model.train() 
        running_loss = 0.0
        correct = 0
        total = 0

        # Training loop
        for batch in train_loader:
            images = batch['image']  
            labels = batch['emotion'] 
            labels = labels.argmax(dim=1)
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()  # Reset gradients
            outputs = model(images)  # Forward pass
            loss = criterion(outputs, labels)  # Compute loss
            loss.backward()  # Backpropagation
            optimizer.step()  # Update weights

            running_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        train_loss = running_loss / len(train_loader)
        train_acc = 100 * correct / total

        # Run Validation
        val_loss, val_acc = validate_model(model, val_loader, criterion, device)

        # Save Best Model
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

    # Load Best Model and Run Testing
    model.load_state_dict(torch.load("best_model.pth", weights_only=True))
    print(test_model(model, test_loader, criterion, device))


def validate_model(model, val_loader, criterion, device="cpu"):
    model.eval()  # Set model to evaluation mode
    val_loss = 0.0
    val_correct = 0
    val_total = 0

    with torch.no_grad():  # No need to compute gradients
        for batch in val_loader:
            images = batch['image']  
            labels = batch['emotion'] 
            labels = labels.argmax(dim=1)
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

# To ensure script is ran correctly for multiprocessing
if __name__ == "__main__":
    main()
    
    
