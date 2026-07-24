import json
import logging
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import google.generativeai as genai
from app.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Configure Google Generative AI
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set. Gemini integration will run in mock/fallback mode.")

# --- Pydantic Schemas for Structured Resume ---

class EducationItem(BaseModel):
    degree: str = Field(default="", description="Name of the degree or course, e.g., B.Tech Computer Science")
    school: str = Field(default="", description="Name of the school, college, or university")
    year: str = Field(default="", description="Year of graduation or expected graduation, e.g., 2024")

class ExperienceItem(BaseModel):
    company: str = Field(default="", description="Name of company, organization, or 'Personal Projects'")
    role: str = Field(default="", description="Job title, role, or position, e.g., Frontend Intern")
    duration: str = Field(default="", description="Duration of employment, e.g., 6 months, 2 years")
    description: str = Field(default="", description="Key responsibilities and achievements")

class ProfileSchema(BaseModel):
    name: str = Field(default="", description="User's full name")
    email: str = Field(default="", description="User's email address")
    phone: str = Field(default="", description="User's phone number")
    location: str = Field(default="", description="User's current city/location (e.g. Jaipur, Lucknow, Indore)")
    education: List[EducationItem] = Field(default_factory=list, description="List of educational qualifications")
    skills: List[str] = Field(default_factory=list, description="List of technical/soft skills, e.g. ['React', 'Python']")
    experience: List[ExperienceItem] = Field(default_factory=list, description="List of professional experiences and projects")
    experience_years: float = Field(default=0.0, description="Total years of work experience as a float (e.g. 1.5, 0.0 for freshers)")

# --- Chat Prompt and Logic ---

SYSTEM_PROMPT = """You are CareerCompass AI, an expert career counselor and interviewer. Your objective is to conduct a friendly, professional, step-by-step interview to build the user's professional profile.

Rules:
1. Ask ONLY one question at a time. Do not overwhelm the user.
2. Step-by-step, collect the following information:
   - Full Name
   - Contact Info (Email, Phone)
   - Current Location (prefer Indian Tier-2/3 cities if applicable, but accept whatever they say)
   - Education details (Degree, Institution, Graduation Year)
   - Skills (list of programming languages, tools, or domain skills)
   - Work Experience / Projects (Company/Project name, Role, Duration in years/months, and description)
   - Total Years of Experience (as a number)
3. NEVER make up, invent, or assume any information about the user. Only document what the user explicitly tells you. If they say they are a fresher, record 0 years of experience and focus on personal projects/education.
4. If the user doesn't provide complete information for a section, ask follow-up questions politely, but do not nag.
5. Keep your tone encouraging, conversational, and concise.
6. When you feel you have gathered the key details (e.g. name, contact, location, education, skills, experience), politely inform the user that their profile is ready and you have updated their resume preview on the dashboard, but they can continue chatting to refine it.
"""

def generate_chat_response(messages: List[Dict[str, str]]) -> str:
    """
    Sends the chat history with system instructions to Gemini and returns the next question/response.
    """
    if not settings.GEMINI_API_KEY:
        # Fallback Mock Mode
        return mock_chat_fallback(messages)

    try:
        # We use gemini-1.5-flash as it is fast, stable, and highly capable for chat
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT
        )
        
        # Format history for Gemini API
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [msg["content"]]
            })
            
        response = model.generate_content(contents)
        return response.text
    except Exception as e:
        logger.error(f"Error calling Gemini Chat: {e}")
        return f"I'm sorry, I encountered an issue: {str(e)}. Let's continue. Can you tell me more about your skills?"

def extract_profile_from_chat(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Takes the chat history, sends it to Gemini, and instructs the model to extract
    and format the collected details into a structured JSON profile using ProfileSchema.
    """
    if not settings.GEMINI_API_KEY:
        # Fallback Mock Mode
        return mock_extract_fallback(messages)

    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": ProfileSchema,
                "temperature": 0.1
            }
        )
        
        # Construct a prompt for extraction
        chat_text = ""
        for msg in messages:
            chat_text += f"{msg['role'].upper()}: {msg['content']}\n"
            
        prompt = f"""
        Analyze the following chat conversation between a CareerCompass AI interviewer and a user.
        Extract the user's professional profile details.
        Strictly follow these guidelines:
        - Extract Name, Email, Phone, Location, Skills, Education, Experience, and Total Experience in years.
        - Do NOT hallucinate or assume details. If a detail is missing, leave it as an empty string or empty list as defined in the schema.
        - Convert experience years to a float (e.g. '6 months' is 0.5, '2 years' is 2.0).

        Conversation history:
        {chat_text}
        """
        
        response = model.generate_content(prompt)
        profile_json = json.loads(response.text)
        return profile_json
    except Exception as e:
        logger.error(f"Error extracting profile from chat: {e}")
        return mock_extract_fallback(messages)

# --- Fallbacks for Mock/Testing Mode ---

def mock_chat_fallback(messages: List[Dict[str, str]]) -> str:
    """Mock conversational chat for when API key is missing or fails."""
    user_msgs = [m for m in messages if m["role"] == "user"]
    if not user_msgs:
        return "Hi there! I am CareerCompass AI. Let's build your professional profile and find the best job recommendations for you. What is your full name?"
    
    last_user_msg = user_msgs[-1]["content"].lower()
    
    # Very simple keyword heuristic for testing
    if len(user_msgs) == 1:
        return f"Nice to meet you, {user_msgs[-1]['content']}! Could you share your email address and phone number so we can put them on your resume?"
    elif len(user_msgs) == 2:
        return "Got it! Which city are you currently located in? (e.g., Jaipur, Indore, Coimbatore, Kochi)"
    elif len(user_msgs) == 3:
        return "Excellent! Let's talk about your education. What degree did you complete, from which college, and in what year?"
    elif len(user_msgs) == 4:
        return "Great! What technical skills do you have? (e.g., React, Python, SQL, CSS, Figma)"
    elif len(user_msgs) == 5:
        return "Awesome skills! Do you have any work experience or personal projects? Please tell me the role, company/project name, duration, and what you built."
    elif len(user_msgs) == 6:
        return "Understood. How many total years of work experience do you have? (e.g., 0 for fresher, 1.5, 3)"
    else:
        return "Thank you! I have gathered all your details and generated your resume. You can check the preview and the recommended jobs on your dashboard. Feel free to refine any details!"

def mock_extract_fallback(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """Mock extractor that attempts to pull details from chat history for testing."""
    profile = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "+91 9988776655",
        "location": "Jaipur",
        "education": [
            {"degree": "B.Tech in Computer Science", "school": "Rajasthan Technical University", "year": "2024"}
        ],
        "skills": ["React", "JavaScript", "HTML", "CSS", "Python"],
        "experience": [
            {"company": "AppVenture Technologies", "role": "Frontend Intern", "duration": "6 months", "description": "Built interactive UI elements."}
        ],
        "experience_years": 0.5
    }
    
    # Try simple extraction from the chat history
    user_texts = [m["content"] for m in messages if m["role"] == "user"]
    if len(user_texts) > 0:
        profile["name"] = user_texts[0]
    if len(user_texts) > 1:
        profile["email"] = "user@example.com"
        profile["phone"] = "+91 9000000000"
    if len(user_texts) > 2:
        profile["location"] = user_texts[2]
    if len(user_texts) > 4:
        # Extract skills (split by comma or spaces)
        skills_text = user_texts[4]
        skills_list = [s.strip() for s in skills_text.replace(",", " ").split() if len(s.strip()) > 1]
        if skills_list:
            profile["skills"] = list(set(skills_list))
    if len(user_texts) > 6:
        try:
            profile["experience_years"] = float(user_texts[6])
        except ValueError:
            profile["experience_years"] = 1.0
            
    return profile
