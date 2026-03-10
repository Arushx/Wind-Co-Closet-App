# Use official Python runtime as a parent image
FROM python:3.11-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies needed for computer vision
RUN apt-get update --fix-missing && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install dependencies (CPU versions of torch are much smaller and usually fine for this model)
# We override the index to get the CPU-only versions of PyTorch to save significant image size/memory on Render
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# IMPORTANT: Download the model weights during the build rather than at runtime.
# This ensures Render doesn't time out downloading models when the server boots.
RUN python -c "from transformers import SegformerImageProcessor, AutoModelForSemanticSegmentation; SegformerImageProcessor.from_pretrained('mattmdjaga/segformer_b2_clothes'); AutoModelForSemanticSegmentation.from_pretrained('mattmdjaga/segformer_b2_clothes')"

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
