import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import io

class SocialIssueClassifier:
    def __init__(self):
        print("Loading AI model (CLIP)...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
        self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        
        # Define our "Social Issue" labels
        self.labels = [
            "ngập lụt, đường ngập nước",
            "ổ gà, đường hư hỏng, sụt lún",
            "rác thải vứt bừa bãi, ô nhiễm",
            "cây đổ, cành cây gãy nguy hiểm",
            "đèn đường hỏng, mất điện chiếu sáng",
            "nước thải tràn ra đường",
            "biển báo giao thông hư hỏng",
            "không phải vấn đề dân sinh (phong cảnh, chân dung, đồ ăn, thú cưng)"
        ]
        
        # Mapping from labels to system categories
        self.category_mapping = {
            "ngập lụt, đường ngập nước": "flood",
            "ổ gà, đường hư hỏng, sụt lún": "road",
            "rác thải vứt bừa bãi, ô nhiễm": "garbage",
            "cây đổ, cành cây gãy nguy hiểm": "fallen_tree",
            "đèn đường hỏng, mất điện chiếu sáng": "lighting",
            "nước thải tràn ra đường": "sewage",
            "biển báo giao thông hư hỏng": "signage"
        }

    def analyze(self, image_bytes):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        inputs = self.processor(
            text=self.labels, 
            images=image, 
            return_tensors="pt", 
            padding=True
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)

        # Get the top candidate
        top_prob, top_idx = probs.max(1)
        confidence = top_prob.item() * 100
        label = self.labels[top_idx.item()]
        
        # Check if it's "not a social issue"
        is_valid = "không phải vấn đề dân sinh" not in label
        
        category = "unknown"
        clean_label = label
        if is_valid:
            category = self.category_mapping.get(label, "other")
            # Map back to a clean Vietnamese label for the UI
            clean_label = label.split(",")[0].capitalize()
        else:
            clean_label = "Hình ảnh không phải vấn đề dân sinh"

        return {
            "label": clean_label,
            "category": category,
            "confidence": round(confidence, 2),
            "is_valid": is_valid
        }

# Singleton instance
classifier = None

def get_classifier():
    global classifier
    if classifier is None:
        classifier = SocialIssueClassifier()
    return classifier
