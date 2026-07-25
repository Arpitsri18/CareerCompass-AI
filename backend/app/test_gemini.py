import os
from google import genai
from dotenv import load_dotenv

# Force load backend .env
load_dotenv(dotenv_path="D:/CareerConsultation/CareerConsultation/backend/.env")

api_key = os.getenv("GEMINI_API_KEY")
print("Loaded API Key:", api_key)  # Debug check

if not api_key:
    raise ValueError("API key not found. Check backend/.env file!")

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model="models/gemini-3.5-flash",
    contents="Hello Gemini, test response!"
)

print("Gemini says:", response.text)
