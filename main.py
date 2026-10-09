from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel, Field
import joblib
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


COLUMNS = ["latitude", "longitude", "price", "minimum_nights",
    "number_of_reviews", "reviews_per_month",
    "calculated_host_listings_count", "availability_365",
    "neighbourhood_group", "neighbourhood",]

MODEL_PATH = Path(__file__).resolve().parent / "Model_Pipeline.pkl"
model = joblib.load(MODEL_PATH)  # Load the pre-trained model pipeline

#Pydantic Model = the input validation
class Features(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    price: float = Field(..., gt=0, description="Price per night, must be positive")
    minimum_nights: int = Field(..., ge=1, le=365, description="Minimum nights required for booking")
    number_of_reviews: int = Field(..., ge=0, description="Total number of reviews")
    reviews_per_month: float = Field(..., ge=0, description="Average reviews per month")
    calculated_host_listings_count: int = Field(..., ge=0, description="Number of listings by this host")
    availability_365: int = Field(..., ge=0, le=365, description="Days available out of 365")
    neighbourhood_group: str = Field(..., min_length=1, description="Borough or neighbourhood group")
    neighbourhood: str = Field(..., min_length=1, description="Specific neighbourhood name")



@app.get('/')
def greet():
    return "Hello Guyss"


@app.get('/health')
def health():
    return {"status": "ok"}


@app.post('/predict')
def predict(features: Features):
    row = pd.DataFrame([features.model_dump()], columns=COLUMNS)
    prediction  = model.predict(row)
    probability = model.predict_proba(row)
    classes = [str(label) for label in model.classes_]
    probabilities = {
        label: float(value) for label, value in zip(classes, probability[0])
    }

    return {
        "Predicted_room_type": str(prediction[0]),
        "Probability": probability.tolist()[0],
        "classes": classes,
        "probabilities": probabilities,
    }