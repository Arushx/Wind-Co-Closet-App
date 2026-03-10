from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from transformers import SegformerImageProcessor, AutoModelForSemanticSegmentation
from PIL import Image
import torch
import torch.nn as nn
import io
import base64
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading Segformer Model (mattmdjaga/segformer_b2_clothes)...")
processor = SegformerImageProcessor.from_pretrained("mattmdjaga/segformer_b2_clothes")
model = AutoModelForSemanticSegmentation.from_pretrained("mattmdjaga/segformer_b2_clothes")
print("Model loaded successfully.")

# Map model labels to our app categories
CATEGORY_MAPPING = {
    'tops': [4, 7],         # Upper-clothes, Dress
    'bottoms': [5, 6],      # Skirt, Pants
    'shoes': [9, 10],      # Left-shoe, Right-shoe
    'accessories': [1, 3, 8, 16, 17] # Hat, Sunglasses, Belt, Bag, Scarf
}

def crop_and_encode(image: Image.Image, mask: np.ndarray, label_indices: list, padding: int = 20):
    """
    Finds bounding box for given labels, crops the image, computes dominant color, and returns a dict with base64 string and color.
    Returns None if the labels are not found in the mask or if the detected area is too small (noise).
    """
    # Create a boolean mask where True matches any of our target labels
    target_mask = np.isin(mask, label_indices)
    
    if not np.any(target_mask):
        return None
        
    # Find bounding box
    rows = np.any(target_mask, axis=1)
    cols = np.any(target_mask, axis=0)
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    
    # Calculate dimensions and area
    target_width = cmax - cmin
    target_height = rmax - rmin
    target_area = target_width * target_height
    
    img_width, img_height = image.size
    total_img_area = img_width * img_height
    
    # Noise filter: If the detected bounding box covers less than 0.5% of the total image,
    # it's likely just an AI hallucination/noise, so we ignore it.
    area_ratio = target_area / total_img_area
    if area_ratio < 0.005:
        print(f"Ignored tiny detection (ratio: {area_ratio:.4f})")
        return None
    
    # Add padding
    rmin = max(0, rmin - padding)
    rmax = min(mask.shape[0], rmax + padding)
    cmin = max(0, cmin - padding)
    cmax = min(mask.shape[1], cmax + padding)
    
    # Crop original image
    cropped_img = image.crop((cmin, rmin, cmax, rmax))
    
    # Convert to base64
    buffered = io.BytesIO()
    cropped_img.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    # Calculate average color
    img_array = np.array(image)
    avg_color = img_array[target_mask].mean(axis=0).astype(int)
    hex_color = "#{:02x}{:02x}{:02x}".format(avg_color[0], avg_color[1], avg_color[2])
    
    return {
        "image": f"data:image/jpeg;base64,{img_str}",
        "color": hex_color
    }

@app.post("/segment")
async def segment_clothing(file: UploadFile = File(...)):
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Max resolution clamp. Crucial for Render free-tier memory limit. 
        # Large 12+ Megapixel iPhone photos will crash the container RAM limits.
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        
        # Original size for resizing the mask back
        original_size = image.size[::-1] # (height, width)

        # Preprocess and run inference
        inputs = processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get logits and upsample to original size
        logits = outputs.logits.cpu()
        upsampled_logits = nn.functional.interpolate(
            logits,
            size=original_size,
            mode="bilinear",
            align_corners=False,
        )
        
        # Get segmentation mask (argmax over classes)
        pred_seg = upsampled_logits.argmax(dim=1)[0].numpy()
        
        extracted_items = []
        
        # For each category, see if we found it and crop it
        for category, labels in CATEGORY_MAPPING.items():
            result = crop_and_encode(image, pred_seg, labels)
            if result:
                # Determine seasons based on dominant predicted label for this mask
                cat_mask = np.isin(pred_seg, labels)
                unique, counts = np.unique(pred_seg[cat_mask], return_counts=True)
                dominant_label = unique[np.argmax(counts)]
                
                seasons = ['spring', 'summer', 'fall', 'winter'] # Default
                if dominant_label == 7: # Dress
                    seasons = ['spring', 'summer']
                elif dominant_label == 5: # Skirt
                    seasons = ['spring', 'summer', 'fall']
                elif dominant_label == 6: # Pants
                    seasons = ['fall', 'winter', 'spring']
                elif dominant_label == 16: # Scarf
                    seasons = ['fall', 'winter']
                
                extracted_items.append({
                    "category": category,
                    "imageUri": result["image"],
                    "color": result["color"],
                    "seasons": seasons,
                    "name": f"Extracted {category.capitalize()}"
                })
                
        return JSONResponse(content={"items": extracted_items})
        
    except Exception as e:
        print(f"Error during segmentation: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
