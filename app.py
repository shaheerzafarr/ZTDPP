import streamlit as st
import torch
from torchvision import transforms
from PIL import Image
import sys
import os

from model.model import build_model

# Configure the page
st.set_page_config(page_title="ZTDPP - Deepfake Detector", page_icon="🔍")

st.title("🔍 ZTDPP Deepfake Detector")
st.write("Upload an image to check if it's **REAL** (Camera) or **FAKE** (AI-Generated).")

# 1. Load the model (Cached so it only loads once)
@st.cache_resource
def load_model():
    # Build the architecture
    model = build_model(freeze_backbone=False)
    # Load the trained weights (mapped to CPU since your local machine doesn't have a GPU)
    model.load_state_dict(torch.load("checkpoints/best_model.pth", map_location=torch.device('cpu')))
    model.eval()
    return model

model = load_model()

# 2. Define the exact same image transformations used during validation in dataset.py
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# 3. File uploader UI
uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Read and display the image
    image = Image.open(uploaded_file).convert("RGB")
    st.image(image, caption="Uploaded Image", width=400)
    
    st.write("### Analyzing...")
    
    # 4. Preprocess and predict
    img_tensor = transform(image).unsqueeze(0) # Add batch dimension [1, 3, 224, 224]
    
    with torch.no_grad():
        logits = model(img_tensor)
        prob = torch.sigmoid(logits).item() # Convert logit to probability (0 to 1)
        
    # 5. Display Results (FAKE=0, REAL=1)
    if prob > 0.5:
        st.success(f"✅ Prediction: **REAL**")
        st.info(f"Confidence: **{prob * 100:.2f}%**")
        st.progress(prob)
    else:
        st.error(f"❌ Prediction: **FAKE** (AI-Generated)")
        fake_confidence = (1 - prob) * 100
        st.warning(f"Confidence: **{fake_confidence:.2f}%**")
        st.progress(1 - prob)

st.markdown("---")
st.markdown("*FYP 1 Demonstration — Zero Trust Digital Provenance Protocol (ZTDPP)*")
