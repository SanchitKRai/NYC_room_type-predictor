const API_BASE = "";
const form = document.getElementById("predictionForm");
const message = document.getElementById("formMessage");
const submitButton = form.querySelector('button[type="submit"]');
const submitText = document.getElementById("submitText");
const availability = document.getElementById("availability");
const availabilityOutput = document.getElementById("availabilityOutput");
const borough = document.getElementById("borough");
const neighbourhood = document.getElementById("neighbourhood");

const examples = {
  midtown: { neighbourhood_group:"Manhattan", neighbourhood:"Midtown", latitude:40.7549, longitude:-73.9840, price:190, minimum_nights:2, number_of_reviews:12, reviews_per_month:1.2, calculated_host_listings_count:3, availability_365:180 },
  bushwick: { neighbourhood_group:"Brooklyn", neighbourhood:"Bushwick", latitude:40.6944, longitude:-73.9213, price:65, minimum_nights:2, number_of_reviews:8, reviews_per_month:0.8, calculated_host_listings_count:1, availability_365:210 },
  jamaica: { neighbourhood_group:"Queens", neighbourhood:"Jamaica", latitude:40.7027, longitude:-73.7890, price:35, minimum_nights:1, number_of_reviews:4, reviews_per_month:0.4, calculated_host_listings_count:2, availability_365:240 }
};

function setApiStatus(state, label) {
  const dot = document.getElementById("apiDot");
  dot.className = state;
  document.getElementById("apiStatus").textContent = label;
}
async function checkApi() {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error("API unavailable");
    setApiStatus("online", "API online");
  } catch {
    setApiStatus("offline", "API offline");
  }
}
function setFormValues(data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  });
  availabilityOutput.textContent = `${availability.value} days`;
  updateLocation();
}
function updateLocation() {
  document.getElementById("locationName").textContent = `${neighbourhood.value || "New York"}, ${borough.value || "NYC"}`;
}
document.querySelectorAll(".example-chip").forEach(button => {
  button.addEventListener("click", () => {
    setFormValues(examples[button.dataset.example]);
    message.textContent = "Example loaded. You can edit any value before predicting.";
  });
});
availability.addEventListener("input", () => availabilityOutput.textContent = `${availability.value} days`);
borough.addEventListener("change", updateLocation);
neighbourhood.addEventListener("input", updateLocation);
document.getElementById("themeToggle").addEventListener("click", () => document.body.classList.toggle("dark-mode"));

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    availabilityOutput.textContent = `${availability.value} days`;
    message.textContent = "";
    updateLocation();
    clearProbabilities();
    document.getElementById("resultTitle").textContent = "Ready to predict?";
    document.getElementById("resultDescription").textContent = "Submit the listing details to see the model’s estimate.";
    document.getElementById("confidenceText").textContent = "MODEL OUTPUT";
  }, 0);
});
function clearProbabilities() {
  ["private","shared","entire"].forEach(key => {
    document.getElementById(`${key}Value`).textContent = "—";
    document.getElementById(`${key}Bar`).style.width = "0%";
  });
}
function normaliseLabel(label) {
  const value = String(label).toLowerCase();
  if (value.includes("private")) return "private";
  if (value.includes("shared")) return "shared";
  if (value.includes("entire") || value.includes("home") || value.includes("apt")) return "entire";
  return null;
}
function displayResult(data) {
  const prediction = data.Predicted_room_type ?? data.predicted_room_type ?? data.prediction ?? "Unknown";
  const probabilities = data.probabilities || {};
  if (!Object.keys(probabilities).length && Array.isArray(data.Probability) && Array.isArray(data.classes)) {
    data.classes.forEach((label, i) => probabilities[label] = data.Probability[i]);
  }
  const normalized = {private:0, shared:0, entire:0};
  Object.entries(probabilities).forEach(([label, prob]) => {
    const key = normaliseLabel(label);
    if (key) normalized[key] = Number(prob);
  });
  const max = Math.max(...Object.values(normalized));
  const percent = n => `${(n * 100).toFixed(1)}%`;
  document.getElementById("resultTitle").textContent = prediction;
  const best = normalized[normaliseLabel(prediction)] ?? max;
  document.getElementById("resultDescription").textContent = `The model estimates ${percent(best)} confidence for this room type. Treat this as an estimate, not a fact.`;
  document.getElementById("confidenceText").textContent = `${percent(best)} MODEL CONFIDENCE`;
  ["private","shared","entire"].forEach(key => {
    document.getElementById(`${key}Value`).textContent = percent(normalized[key]);
    document.getElementById(`${key}Bar`).style.width = `${Math.max(0, Math.min(100, normalized[key]*100))}%`;
  });
  updateLocation();
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "";
  submitButton.disabled = true;
  submitText.textContent = "Predicting…";
  const payload = Object.fromEntries(new FormData(form).entries());
  ["latitude","longitude","price","reviews_per_month"].forEach(k => payload[k] = Number(payload[k]));
  ["minimum_nights","number_of_reviews","calculated_host_listings_count","availability_365"].forEach(k => payload[k] = Number.parseInt(payload[k], 10));
  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = Array.isArray(data.detail) ? data.detail.map(item => item.msg).join(", ") : data.detail;
      throw new Error(detail || `Prediction failed (${response.status})`);
    }
    displayResult(data);
    setApiStatus("online", "API online");
    message.textContent = "Prediction complete.";
  } catch (error) {
    setApiStatus("offline", "API offline");
    message.textContent = `Could not get a prediction: ${error.message}. Start the FastAPI server and try again.`;
  } finally {
    submitButton.disabled = false;
    submitText.textContent = "Predict room type";
  }
});
checkApi();
setInterval(checkApi, 15000);
