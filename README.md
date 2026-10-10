# NYC Airbnb Room Type Predictor 🏙️

A machine-learning web application that predicts the room type of a New York City Airbnb listing from listing and location details. The interface is designed as an interactive NYC-inspired dashboard, with a listing form, example inputs, room-type visuals, and a probability-based prediction panel.

> **Important:** This project provides a model estimate for learning and exploration. It is not an Airbnb booking tool, and its predictions should not be treated as guaranteed or as a substitute for checking a real listing.

## Project Overview

Airbnb listings can differ by location, nightly price, minimum stay, review activity, host portfolio, and availability. This project uses these attributes to estimate which of three room categories a listing belongs to:

- **Entire home/apt**
- **Private room**
- **Shared room**

Users enter the listing details in the homepage and submit them to the backend. The backend passes the features to a saved machine-learning pipeline and returns the predicted class and the model's class probabilities. The frontend displays the prediction and probability bars.

## About the Machine-Learning Model

The project uses a **pre-trained scikit-learn-compatible pipeline** saved in `Model_Pipeline.pkl`. The API loads that pipeline with `joblib` and uses it for inference; the app does not train the model when it starts.

### Model inputs

The backend expects these ten features, with these exact field names:

| Feature | Description |
|---|---|
| `latitude` | Listing latitude |
| `longitude` | Listing longitude |
| `price` | Price per night |
| `minimum_nights` | Minimum number of nights required |
| `number_of_reviews` | Total reviews |
| `reviews_per_month` | Average reviews per month |
| `calculated_host_listings_count` | Number of listings associated with the host |
| `availability_365` | Days available during a 365-day year |
| `neighbourhood_group` | NYC borough/group |
| `neighbourhood` | Specific neighbourhood |

The API validates the inputs using Pydantic before constructing a one-row pandas DataFrame in the feature order expected by the pipeline.

### Model output

The `/predict` endpoint returns the predicted room type and the class probability values provided by the model. The UI uses these values to show the estimated likelihood for each room category.

**Model transparency note:** The supplied project files establish that a saved classification pipeline is loaded and that `predict()` and `predict_proba()` are called. They do not, by themselves, establish the model's training dataset size, train/test split, evaluation scores, feature importance, or production readiness. Add those details only after verifying them from the original training notebook or evaluation results.

## Features

- Responsive homepage with a New York City twilight visual theme
- Listing form covering location, price, stay, reviews, host listings, and availability
- Example listing presets for Midtown, Bushwick, and Jamaica
- Three room-type image cards
- Prediction panel with class probability bars
- API connection indicator and user-facing error messages
- FastAPI backend with a `/health` check and `/predict` endpoint
- Lightweight SVG assets and a custom favicon

## Tech Stack

- **Python**
- **FastAPI** — prediction API
- **Pydantic** — request validation
- **pandas** — input DataFrame preparation
- **joblib** — loading the saved pipeline
- **scikit-learn-compatible model pipeline** — inference
- **HTML, CSS, JavaScript** — frontend
- **SVG/JPG** — visual assets

## Project Structure

```text
nyc_airbnb_predictor_ui/
├── main.py
├── Model_Pipeline.pkl
├── requirements.txt
├── README.md
├── index.html
├── styles.css
├── app.js
├── homepage-design-reference.png
├── asset-reference-collage.png
└── assets/
    ├── nyc-twilight-hero.jpg
    ├── entire-home.jpg
    ├── private-room.jpg
    ├── shared-room.jpg
    ├── location-map.svg
    └── favicon.svg
```

## Run Locally (Windows)

### 1. Open the project

Extract the ZIP and open the project folder in VS Code.

### 2. Create a virtual environment

Open a terminal in the project directory:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Start the backend

```powershell
uvicorn main:app --reload
```

The API should run at `http://127.0.0.1:8000`.

Useful endpoints:

- `http://127.0.0.1:8000/` — API status message
- `http://127.0.0.1:8000/health` — health check
- `http://127.0.0.1:8000/docs` — interactive API documentation
- `http://127.0.0.1:8000/predict` — prediction endpoint (POST)

### 4. Start the frontend

Open `index.html` using the VS Code **Live Server** extension. The frontend's default API address is `http://127.0.0.1:8000`.

If the API is hosted at a different address, update `API_BASE` near the top of `app.js`.

## Model Compatibility

`Model_Pipeline.pkl` was serialized in a particular Python/scikit-learn environment. Install versions compatible with the environment used to train and save it. If the backend raises an error while executing `joblib.load()`, check the original training environment and pin the corresponding dependency versions. Loading pickle/joblib files from untrusted sources can execute code; only use a model file you trust.

## API Request Example

Send a `POST` request to `/predict` with JSON like this:

```json
{
  "latitude": 40.7549,
  "longitude": -73.984,
  "price": 190,
  "minimum_nights": 2,
  "number_of_reviews": 12,
  "reviews_per_month": 1.2,
  "calculated_host_listings_count": 3,
  "availability_365": 180,
  "neighbourhood_group": "Manhattan",
  "neighbourhood": "Midtown"
}
```

The response includes `Predicted_room_type`, `Probability`, `classes`, `probabilities`, and `confidence`, depending on the model output. The exact class labels and probabilities depend on the trained pipeline and the submitted feature values.

## Limitations and Next Steps

- The result depends on the training data and the categories represented in the fitted pipeline.
- Neighbourhood names should match categories accepted by the model's preprocessing pipeline.
- The map illustration is decorative and is not a live map or geocoder.
- Example listing values are illustrative; they are not live Airbnb listings.
- Before deployment, restrict CORS to the actual frontend domain, pin verified dependency versions, test API errors, and evaluate the model on held-out data.
- To document model performance responsibly, add verified metrics such as accuracy, precision, recall, F1-score, confusion matrix, and class-wise results from the original evaluation.

## Future Improvements

- Add a map/geocoding integration for listing coordinates
- train on large data
- Populate neighbourhood choices from the model's known categories
- Add model evaluation charts and feature explanations
- Add automated tests for API validation and predictions
- Deploy the frontend and backend with environment-specific API configuration

## Author

Built as a machine-learning project to explore Airbnb listing characteristics and room-type classification in New York City.
