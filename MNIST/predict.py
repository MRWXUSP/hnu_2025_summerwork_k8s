import os
import torch
from PIL import Image
from torchvision import transforms
import torch.nn as nn

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
# Predictor 类
# -----------------------------
class MNISTPredictor:
    def __init__(self, model_path="./model/mnist_cnn.pth", device=None):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file {model_path} not found.")

        self.model = SimpleCNN().to(self.device)
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()

        self.transform = transforms.Compose([transforms.Resize((28,28)), transforms.ToTensor()])

    def predict(self, image_path):
        """传入单张图片路径，返回预测标签"""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file {image_path} not found.")
        image = Image.open(image_path).convert("L")
        image = self.transform(image).unsqueeze(0).to(self.device)  # batch_size=1
        with torch.no_grad():
            output = self.model(image)
            pred = output.argmax(dim=1).item()
        return pred

# -----------------------------
# 示例
# -----------------------------
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="MNIST 图片预测")
    parser.add_argument('--model', type=str, default="./model/mnist_cnn.pth", help="模型文件路径")
    parser.add_argument('--image', type=str, required=True, help="待预测图片路径")
    args = parser.parse_args()

    try:
        predictor = MNISTPredictor(model_path=args.model)
        pred = predictor.predict(args.image)
        print(f"预测结果: {pred}")
    except Exception as e:
        print(f"预测失败: {e}")
    
