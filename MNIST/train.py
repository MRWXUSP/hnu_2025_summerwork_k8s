import os
import argparse
from PIL import Image
from tqdm import tqdm
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import datetime

# -----------------------------
# Dataset
# -----------------------------
class MNISTDataset(Dataset):
    def __init__(self, data_dir, train=True, transform=None):
        self.data_dir = data_dir
        self.transform = transform
        self.train = train
        self.samples = []

        for filename in os.listdir(data_dir):
            if train and filename.startswith("training_"):
                label = int(filename.split("_")[-1].split(".")[0])
                self.samples.append((filename, label))
            elif not train and filename.startswith("test_"):
                label = int(filename.split("_")[-1].split(".")[0])
                self.samples.append((filename, label))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        filename, label = self.samples[idx]
        path = os.path.join(self.data_dir, filename)
        image = Image.open(path).convert("L")
        if self.transform:
            image = self.transform(image)
        return image, label

# -----------------------------
# Model
# -----------------------------
class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, 1)
        self.conv2 = nn.Conv2d(32, 64, 3, 1)
        self.fc1 = nn.Linear(9216, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.conv1(x)
        x = nn.functional.relu(x)
        x = self.conv2(x)
        x = nn.functional.relu(x)
        x = torch.nn.functional.max_pool2d(x, 2)
        x = torch.flatten(x, 1)
        x = self.fc1(x)
        x = nn.functional.relu(x)
        x = self.fc2(x)
        return x

# -----------------------------
# Train & Test
# -----------------------------
def train(model, device, train_loader, optimizer, criterion, epoch, log_file):
    model.train()
    total_loss = 0
    for data, target in tqdm(train_loader, desc=f"Epoch {epoch}"):
        data, target = data.to(device), target.to(device)
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    avg_loss = total_loss / len(train_loader)
    print(f"Epoch {epoch} average loss: {avg_loss:.4f}")
    log_file.write(f"Epoch {epoch} - train_loss: {avg_loss:.4f}\n")
    return avg_loss

def test(model, device, test_loader, log_file):
    model.eval()
    correct = 0
    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
    acc = correct / len(test_loader.dataset)
    print(f"Test Accuracy: {acc*100:.2f}%")
    log_file.write(f"test_accuracy: {acc*100:.2f}%\n")
    return acc

# -----------------------------
# Main
# -----------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--resume", action="store_true", help="Resume training from last checkpoint")
    args = parser.parse_args()

    # GPU优先，如果没有GPU则使用CPU
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    transform = transforms.Compose([transforms.Resize((28,28)), transforms.ToTensor()])

    train_dataset = MNISTDataset("./mnist_jpg", train=True, transform=transform)
    test_dataset = MNISTDataset("./mnist_jpg", train=False, transform=transform)
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False)

    model = SimpleCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)

    # 创建模型和日志目录
    os.makedirs("./model", exist_ok=True)
    os.makedirs("./log", exist_ok=True)
    model_path = "./model/mnist_cnn.pth"
    log_path = f"./log/train_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    # 若重新开始训练，则删除旧日志和模型
    if not args.resume:
        if os.path.exists(model_path):
            os.remove(model_path)
        if os.path.exists(log_path):
            os.remove(log_path)

    with open(log_path, "a") as log_file:

        start_epoch = 1
        if args.resume and os.path.exists(model_path):
            print("Resuming training from last checkpoint...")
            checkpoint = torch.load(model_path, map_location=device)
            model.load_state_dict(checkpoint['model_state_dict'])
            optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
            start_epoch = checkpoint['epoch'] + 1
            print(f"Starting from epoch {start_epoch}")
            log_file.write(f"Resuming from epoch {start_epoch}\n")

        for epoch in range(start_epoch, args.epochs + 1):
            loss = train(model, device, train_loader, optimizer, criterion, epoch, log_file)
            acc = test(model, device, test_loader, log_file)

            # 保存模型
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict()
            }, model_path)
            log_file.write("\n")  # 每个epoch分隔

    print(f"Training complete. Logs saved to {log_path}")

if __name__ == "__main__":
    main()
