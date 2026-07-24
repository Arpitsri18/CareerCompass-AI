# CareerCompass AI

CareerCompass AI is an MVP job guidance and career counseling platform designed for candidates in Indian Tier-2/3 cities (such as Coimbatore, Indore, Jaipur, Lucknow, Patna, Nagpur). 

The platform features:
1. **Gemini AI Career Onboarding Chat**: A guided step-by-step chat interface that collects user name, contact details, education, skills, location, and experience. It uses a strict system prompt to avoid hallucinations or making up details.
2. **Dynamic Resume Preview (with inline editing)**: Renders the candidate's profile into an elegant, professional resume where clicking fields opens interactive input fields to edit details on the fly.
3. **Recommendation Engine & Match Score**: Evaluates candidate profiles against local job listings using a weighted algorithm.
4. **Skill Gap Analyzer**: Highlights missing skills for recommended jobs and suggests action paths, including direct names of online courses or certifications.

---

## Monorepo Directory Structure

```
d:\IBM internship\
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI endpoints (chat, profile generate, recommendations)
│   │   ├── config.py          # Configuration and .env loading
│   │   ├── database.py        # Mock database with Tier-2/3 cities jobs
│   │   ├── recommendation.py  # Recommendation engine & skill gap calculation
│   │   └── resume.py          # Gemini AI API integration & mock fallbacks
│   ├── requirements.txt
│   ├── .env                   # Configuration file (add your GEMINI_API_KEY here)
│   └── test_flow.py           # Automated integration test script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx   # Onboarding conversational AI UI
│   │   │   ├── ResumePreview.jsx   # Resume view with inline text inputs
│   │   │   └── JobCards.jsx        # Recommendation lists, scores, and modal popups
│   │   ├── App.jsx                 # Dashboard orchestration and API triggers
│   │   ├── index.css               # Styling and custom theme config (Tailwind CSS v4)
│   │   └── main.jsx                # React app entry point
│   ├── index.html
│   ├── postcss.config.js
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Core Algorithm: Match Score Formula

User profiles are scored against job listings in real time using the following exact weighted formula:

$$\text{Match Score} = (0.60 \times \text{Skill Overlap}) + (0.25 \times \text{Location Match}) + (0.15 \times \text{Experience Fit})$$

### Sub-Score Details:
1. **Skill Overlap (60%)**: 
   $$\text{Skill Overlap} = \frac{|\text{User Skills} \cap \text{Job Skills}|}{|\text{Job Skills}|}$$
   Comparing skills case-insensitively, ignoring excess whitespace.
2. **Location Match (25%)**:
   - `1.0` if user location matches the job location (case-insensitive) OR if the job is `Remote`.
   - `0.0` otherwise.
3. **Experience Fit (15%)**:
   - `1.0` if user years of experience $\ge$ job required years of experience.
   - `User Experience / Job Experience Required` if user experience $<$ job experience required (and job required experience $>$ 0).
   - `1.0` if job experience required is 0 (entry-level).

---

## Setup & Running Locally

Both servers have been set up and are currently running in your terminal environment.

### Backend (Python FastAPI)
- **Local Address**: `http://localhost:8000`
- **Command to Run manually**:
  ```powershell
  cd backend
  .venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ```
- **Gemini API Key**: Add your `GEMINI_API_KEY` in the `backend/.env` file. If no key is provided, the backend falls back to a clean conversational testing mock mode.

### Frontend (React + Tailwind CSS v4 + Vite)
- **Local Address**: `http://localhost:5173`
- **Command to Run manually**:
  ```powershell
  cd frontend
  # Using the portable node provided in the workspace:
  $env:Path = "d:\IBM internship\node_portable\node-v22.13.0-win-x64;" + $env:Path
  npm run dev
  ```

---

## Verification & Testing
To run the automated backend API integration and score math validation test:
```powershell
cd backend
.venv\Scripts\python.exe test_flow.py
```
This returns a full breakdown of the calculated scores, matching skills, and course recommendations, verifying the formulas' correctness.
