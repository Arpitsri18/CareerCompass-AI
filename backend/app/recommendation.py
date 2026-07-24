from typing import List, Dict, Any
from app.database import MOCK_JOBS

def clean_skill(skill: str) -> str:
    return skill.strip().lower()

def get_course_suggestion(skill: str) -> str:
    """Returns a mock course suggestion for a missing skill."""
    skill_lower = skill.lower()
    if "react" in skill_lower:
        return "React - The Complete Guide (Udemy) or React Docs Tutorial"
    elif "fastapi" in skill_lower:
        return "FastAPI Bootcamp: Build modern REST APIs with Python"
    elif "python" in skill_lower:
        return "Python for Everybody Specialization (Coursera)"
    elif "javascript" in skill_lower:
        return "Modern JavaScript From The Beginning (JavaScript.info)"
    elif "tailwind" in skill_lower:
        return "Tailwind CSS From Scratch (Scrimba / YouTube)"
    elif "sql" in skill_lower or "postgresql" in skill_lower:
        return "SQL & Databases Bootcamp (Kaggle or freeCodeCamp)"
    elif "aws" in skill_lower:
        return "AWS Certified Cloud Practitioner course (freeCodeCamp)"
    elif "docker" in skill_lower:
        return "Docker & Kubernetes: The Practical Guide"
    elif "figma" in skill_lower or "ui" in skill_lower or "ux" in skill_lower:
        return "UI/UX Design Essentials in Figma (Google UX Design Certificate)"
    elif "flutter" in skill_lower or "dart" in skill_lower:
        return "Flutter & Dart - The Complete Guide (Academind)"
    elif "git" in skill_lower:
        return "Git & GitHub Crash Course (YouTube / Git-it)"
    elif "seo" in skill_lower:
        return "Google SEO Fundamentals (Coursera)"
    elif "selenium" in skill_lower or "qa" in skill_lower:
        return "Selenium WebDriver Automation with Python (Udemy)"
    else:
        return f"Complete Guide to {skill} (freeCodeCamp / Medium Guides)"

def calculate_recommendations(user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Calculates match scores and skill gaps for all jobs based on user profile.
    Formula:
    Match Score = (0.60 * Skill Overlap) + (0.25 * Location Match) + (0.15 * Experience Fit)
    """
    user_skills = [clean_skill(s) for s in user_profile.get("skills", [])]
    user_location = user_profile.get("location", "").strip().lower()
    try:
        user_experience = float(user_profile.get("experience_years", 0))
    except (ValueError, TypeError):
        user_experience = 0.0

    recommendations = []

    for job in MOCK_JOBS:
        # 1. Skill Overlap
        job_skills = [clean_skill(s) for s in job["skills_required"]]
        if not job_skills:
            skill_overlap = 1.0
            matching_skills = []
            missing_skills = []
        else:
            matching_skills = [s for s in job["skills_required"] if clean_skill(s) in user_skills]
            missing_skills = [s for s in job["skills_required"] if clean_skill(s) not in user_skills]
            skill_overlap = len(matching_skills) / len(job_skills)

        # 2. Location Match
        job_location = job["location"].strip().lower()
        if user_location == job_location or job_location == "remote":
            location_match = 1.0
        else:
            location_match = 0.0

        # 3. Experience Fit
        job_experience = float(job["experience_required"])
        if user_experience >= job_experience:
            experience_fit = 1.0
        else:
            if job_experience > 0:
                experience_fit = max(0.0, user_experience / job_experience)
            else:
                experience_fit = 1.0

        # Weighted score
        match_score = (0.60 * skill_overlap) + (0.25 * location_match) + (0.15 * experience_fit)
        match_score_pct = round(match_score * 100, 1)

        # Generate action items/courses for missing skills
        learning_recommendations = [
            {"skill": skill, "resource": get_course_suggestion(skill)}
            for skill in missing_skills
        ]

        recommendations.append({
            "job_id": job["id"],
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "skills_required": job["skills_required"],
            "experience_required": job["experience_required"],
            "salary_range": job["salary_range"],
            "description": job["description"],
            "match_score": match_score_pct,
            "breakdown": {
                "skill_overlap": round(skill_overlap * 100, 1),
                "location_match": round(location_match * 100, 1),
                "experience_fit": round(experience_fit * 100, 1)
            },
            "analysis": {
                "matching_skills": matching_skills,
                "missing_skills": missing_skills,
                "learning_recommendations": learning_recommendations
            }
        })

    # Sort recommendations by Match Score in descending order
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations


def get_gap_report_for_role(user_profile: Dict[str, Any], target_role_id: str) -> Dict[str, Any]:
    """
    TRD endpoint GET /skills/gap-report: returns the skill-gap report for a single
    target role, reusing the same scoring/analysis logic as calculate_recommendations.
    """
    all_recs = calculate_recommendations(user_profile)
    match = next((r for r in all_recs if r["job_id"] == target_role_id), None)
    if match is None:
        return {}

    return {
        "report_id": f"gap_{target_role_id}",
        "target_role_id": target_role_id,
        "target_role_title": match["title"],
        "match_score": match["match_score"],
        "matching_skills": match["analysis"]["matching_skills"],
        "missing_skills": match["analysis"]["missing_skills"],
        "learning_recommendations": match["analysis"]["learning_recommendations"],
    }
