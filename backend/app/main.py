from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Dict, Any, Literal, Optional

from app.resume import ProfileSchema, generate_chat_response, extract_profile_from_chat
from app.recommendation import calculate_recommendations, get_gap_report_for_role
from app.database import MOCK_JOBS
from app.export_resume import build_docx, build_pdf
from app import store

app = FastAPI(title="CareerCompass AI API", version="1.0.0")
store.init_db()

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain e.g., http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Request Models ---

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

class SaveProfileRequest(BaseModel):
    user_id: Optional[str] = None
    profile: ProfileSchema

class GapReportRequest(BaseModel):
    profile: ProfileSchema
    target_role_id: str

# --- API Endpoints ---

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "CareerCompass AI Backend"}

@app.post("/resume/chat")
def resume_chat(request: ChatRequest):
    """
    Continues the conversation interview. Receives chat history and returns the next question.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
    
    reply = generate_chat_response(request.messages)
    return {"response": reply}

@app.post("/resume/generate", response_model=ProfileSchema)
def resume_generate(request: ChatRequest):
    """
    Parses conversation history to extract a structured resume profile.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
    
    profile = extract_profile_from_chat(request.messages)
    return profile

@app.post("/jobs/recommendations")
def get_job_recommendations(profile: ProfileSchema):
    """
    Calculates match scores and skill gaps for all jobs using the user profile.
    """
    # Convert Pydantic profile to dictionary
    profile_dict = profile.model_dump()
    recommendations = calculate_recommendations(profile_dict)
    return recommendations

@app.get("/jobs/all")
def get_all_jobs():
    """
    Returns the raw list of mock jobs in Tier-2/3 cities.
    """
    return MOCK_JOBS

@app.post("/skills/gap-report")
def skills_gap_report(request: GapReportRequest):
    """
    Returns the skill-gap report for a single target role (TRD GET /skills/gap-report,
    implemented as POST since the report depends on the user's full profile payload).
    """
    profile_dict = request.profile.model_dump()
    report = get_gap_report_for_role(profile_dict, request.target_role_id)
    if not report:
        raise HTTPException(status_code=404, detail="Target role not found")
    return report

# --- Profile Persistence (SQLite substitute for PostgreSQL/Firebase in TRD) ---

@app.post("/profile")
def save_profile(request: SaveProfileRequest):
    """
    Creates or updates a user profile so returning users don't re-enter information
    every session (PRD user story: "As a returning user, I want my profile saved").
    """
    user_id = request.user_id or store.create_user_id()
    result = store.save_profile(user_id, request.profile.model_dump())
    return result

@app.get("/profile/{user_id}")
def load_profile(user_id: str):
    """
    Loads a previously saved profile by user_id.
    """
    profile = store.get_profile(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.delete("/profile/{user_id}")
def clear_profile(user_id: str):
    deleted = store.delete_profile(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"user_id": user_id, "deleted": True}

# --- Resume Export (PDF/DOCX) ---

@app.post("/resume/export")
def export_resume(profile: ProfileSchema, format: Literal["pdf", "docx"] = "pdf"):
    """
    Generates an ATS-friendly resume file from the profile (PRD 6.1: resume export as PDF/DOCX).
    """
    profile_dict = profile.model_dump()
    filename_base = (profile_dict.get("name") or "resume").strip().replace(" ", "_") or "resume"

    if format == "docx":
        content = build_docx(profile_dict)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = f"{filename_base}.docx"
    else:
        content = build_pdf(profile_dict)
        media_type = "application/pdf"
        filename = f"{filename_base}.pdf"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
