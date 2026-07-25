import os
from google import genai

# Initialize client with API key
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# Read model name from env var, fallback to 3.5 flash
model_name = os.getenv("GEMINI_MODEL", "models/gemini-3.5-flash")
print(f"Using model: {model_name}")

# Generate response
response = client.models.generate_content(
    model=model_name,
    contents="Hello Gemini 3.5, confirm you are working."
)

print(response.text)
