from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd
from pydantic import BaseModel, Field
import joblib
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path


# --------------------------------------------------
# Application setup
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
ASSETS_DIR = BASE_DIR / "assets"

app = FastAPI(
    title="NYC Airbnb Room Type Predictor",
    description="Predict an Airbnb listing's room type.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Model setup
# --------------------------------------------------

COLUMNS = [
    "latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
    "neighbourhood_group",
    "neighbourhood",
]

MODEL_PATH = BASE_DIR / "Model_Pipeline.pkl"
model = joblib.load(MODEL_PATH)


# --------------------------------------------------
# Static assets
# --------------------------------------------------

if ASSETS_DIR.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=str(ASSETS_DIR)),
        name="assets",
    )


# --------------------------------------------------
# Input validation
# --------------------------------------------------

class Features(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    price: float = Field(..., gt=0)
    minimum_nights: int = Field(..., ge=1, le=365)
    number_of_reviews: int = Field(..., ge=0)
    reviews_per_month: float = Field(..., ge=0)
    calculated_host_listings_count: int = Field(..., ge=0)
    availability_365: int = Field(..., ge=0, le=365)
    neighbourhood_group: str = Field(..., min_length=1)
    neighbourhood: str = Field(..., min_length=1)


# --------------------------------------------------
# Homepage and frontend files
# --------------------------------------------------

@app.get("/", include_in_schema=False)
def home():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/styles.css", include_in_schema=False)
def styles():
    return FileResponse(BASE_DIR / "styles.css")


@app.get("/app.js", include_in_schema=False)
def javascript():
    return FileResponse(BASE_DIR / "app.js")


@app.get("/health")
def health():
    return {"status": "ok"}


# --------------------------------------------------
# Prediction endpoint
# --------------------------------------------------

@app.post("/predict")
def predict(features: Features):
    row = pd.DataFrame(
        [features.model_dump()],
        columns=COLUMNS,
    )

    prediction = model.predict(row)
    probability = model.predict_proba(row)

    classes = [str(label) for label in model.classes_]

    probabilities = {
        label: float(value)
        for label, value in zip(classes, probability[0])
    }

    return {
        "Predicted_room_type": str(prediction[0]),
        "Probability": probability.tolist()[0],
        "classes": classes,
        "probabilities": probabilities,
    }
