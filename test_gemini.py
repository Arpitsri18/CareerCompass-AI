import os
import google.genai as genai  # ✅ use new package

# Configure Gemini with API key
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Read model name from env var, fallback to 3.5 flash
model_name = os.getenv("GEMINI_MODEL", "models/gemini-3.5-flash")
print(f"Using model: {model_name}")

model = genai.GenerativeModel(model_name=model_name)
response = model.generate_content("Hello Gemini 3.5, confirm you are working.")
print(response.text)
