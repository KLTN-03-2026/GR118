from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from classifier import get_classifier
import time

app = FastAPI(title="Issue Reporting AI Service")

# Setup CORS to allow requests from the Frontend (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set this to 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Warm up the model
    print("AI Service Starting...")
    get_classifier()

@app.get("/")
def read_root():
    return {"status": "AI Service is running"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    try:
        start_time = time.time()
        image_bytes = await file.read()
        
        classifier = get_classifier()
        result = classifier.analyze(image_bytes)
        
        processing_time = time.time() - start_time
        result["processing_time"] = round(processing_time, 4)
        
        return result
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
