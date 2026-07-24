import urllib.request
import json
import sys

def test_api():
    base_url = "http://127.0.0.1:8000"
    print("Starting backend API integration test...\n")

    # Healthcheck
    try:
        req = urllib.request.Request(f"{base_url}/")
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            print(f"[Healthcheck] Status: {data.get('status')} (Success)")
    except Exception as e:
        print(f"[Healthcheck] Failed: {e}")
        sys.exit(1)

    # 1. Test Chat
    messages = [
        {"role": "model", "content": "Hi there! I am CareerCompass AI. What is your full name?"},
        {"role": "user", "content": "Rajesh Kumar"}
    ]
    chat_payload = json.dumps({"messages": messages}).encode('utf-8')
    try:
        req = urllib.request.Request(
            f"{base_url}/resume/chat",
            data=chat_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            print(f"[Chat Endpoint] Reply: {data.get('response')} (Success)")
    except Exception as e:
        print(f"[Chat Endpoint] Failed: {e}")
        sys.exit(1)

    # 2. Test Profile Extraction
    # We will simulate a longer chat history where the user gives skills, education, location, experience
    full_messages = [
        {"role": "model", "content": "Hi there! What is your name?"},
        {"role": "user", "content": "Rajesh Kumar"},
        {"role": "model", "content": "What is your email and phone?"},
        {"role": "user", "content": "rajesh@gmail.com, +91 99999 88888"},
        {"role": "model", "content": "Which city do you live in?"},
        {"role": "user", "content": "Jaipur"},
        {"role": "model", "content": "What is your education?"},
        {"role": "user", "content": "B.Tech in Computer Science from RTU in 2024"},
        {"role": "model", "content": "What are your skills?"},
        {"role": "user", "content": "React, JavaScript, HTML, CSS, Python, FastAPI"},
        {"role": "model", "content": "Describe your work experience and years of experience."},
        {"role": "user", "content": "I worked as an intern at AppVenture for 6 months building React pages. Total experience is 0.5 years."}
    ]
    generate_payload = json.dumps({"messages": full_messages}).encode('utf-8')
    profile_obj = None
    try:
        req = urllib.request.Request(
            f"{base_url}/resume/generate",
            data=generate_payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as res:
            profile_obj = json.loads(res.read().decode())
            print("\n[Resume Extraction Endpoint] Structured Profile Extracted successfully:")
            print(json.dumps(profile_obj, indent=2))
            
            # Basic validation
            assert profile_obj.get("name") == "Rajesh Kumar", "Name mismatch"
            assert "React" in profile_obj.get("skills", []), "Skills missing React"
            assert profile_obj.get("location") == "Jaipur", "Location mismatch"
            assert profile_obj.get("experience_years") == 0.5, "Experience years mismatch"
            print("Profile validation assertions passed!")
    except Exception as e:
        print(f"[Resume Extraction Endpoint] Failed or assertions failed: {e}")
        sys.exit(1)

    # 3. Test Job Recommendations & Score Calculations
    if profile_obj:
        rec_payload = json.dumps(profile_obj).encode('utf-8')
        try:
            req = urllib.request.Request(
                f"{base_url}/jobs/recommendations",
                data=rec_payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as res:
                recommendations = json.loads(res.read().decode())
                print("\n[Job Recommendations Endpoint] Received recommendations list:")
                
                # Check top job match
                top_job = recommendations[0]
                print(f"Top Recommended Job: {top_job['title']} at {top_job['company']} (Location: {top_job['location']})")
                print(f"Match Score: {top_job['match_score']}%")
                print(f"Score Breakdown: {top_job['breakdown']}")
                print(f"Matching Skills: {top_job['analysis']['matching_skills']}")
                print(f"Missing Skills: {top_job['analysis']['missing_skills']}")
                print(f"Suggested Resource for first missing skill (if any):")
                if top_job['analysis']['learning_recommendations']:
                    print(f"  Skill: {top_job['analysis']['learning_recommendations'][0]['skill']}")
                    print(f"  Resource: {top_job['analysis']['learning_recommendations'][0]['resource']}")
                else:
                    print("  None - perfect match!")
                
                # Let's verify score math for Job #1 (Junior Full Stack Developer in Jaipur):
                # Job requirements: React, JavaScript, HTML, CSS, Python, FastAPI. Experience: 1.5 yrs. Location: Jaipur
                # Rajesh profile: React, JavaScript, HTML, CSS, Python, FastAPI. Experience: 0.5 yrs. Location: Jaipur
                # Calculations:
                # Skill Overlap: all 6 skills match => 1.0 (100.0%)
                # Location Match: Jaipur matches Jaipur => 1.0 (100.0%)
                # Experience Fit: 0.5 / 1.5 = 0.3333 => 33.3%
                # Weighted score: (0.60 * 1.0) + (0.25 * 1.0) + (0.15 * 0.3333) = 0.60 + 0.25 + 0.05 = 0.90 => 90.0%
                # Let's find Junior Full Stack Developer and check its score:
                jfsd_job = next((j for j in recommendations if j["job_id"] == "job_001"), None)
                if jfsd_job:
                    print(f"\nVerifying formula math for Job 'Junior Full Stack Developer':")
                    print(f"Calculated Score: {jfsd_job['match_score']}% (Expected: ~90.0%)")
                    assert abs(jfsd_job['match_score'] - 90.0) < 1.0, "Formula score mismatch!"
                    print("Formula score validation assertion passed!")
                
                print("\nAll integration API tests completed successfully!")
        except Exception as e:
            print(f"[Job Recommendations Endpoint] Failed or assertion failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    test_api()
