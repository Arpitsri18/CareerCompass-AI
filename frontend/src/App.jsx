import React, { useState, useEffect } from "react";
import { 
  Bot, Briefcase, FileText, Sparkles, MapPin, 
  Layers, RefreshCw, Compass, Users 
} from "lucide-react";
import ChatInterface from "./components/ChatInterface";
import ResumePreview from "./components/ResumePreview";
import JobCards from "./components/JobCards";

const API_BASE_URL = "http://localhost:8000";

export default function App() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    skills: [],
    education: [],
    experience: [],
    experience_years: 0.0
  });

  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState("resume"); // "resume" or "jobs"
  const [isUpdatingRecs, setIsUpdatingRecs] = useState(false);
  const [userId, setUserId] = useState(null);

  // Calculate recommendations whenever the profile changes
  const updateRecommendations = async (currentProfile) => {
    if (!currentProfile) return;
    setIsUpdatingRecs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentProfile)
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Error fetching job recommendations:", err);
    } finally {
      setIsUpdatingRecs(false);
    }
  };

  // Persist the profile to the backend (SQLite-backed store) so returning
  // users don't have to re-enter their info every session.
  const persistProfile = async (currentProfile, existingUserId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: existingUserId, profile: currentProfile })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user_id && data.user_id !== existingUserId) {
          localStorage.setItem("careercompass_user_id", data.user_id);
          setUserId(data.user_id);
        }
      }
    } catch (err) {
      console.error("Error persisting profile:", err);
    }
  };

  const handleProfileUpdate = (newProfile) => {
    if (!newProfile) {
      // Clear profile
      const cleared = {
        name: "",
        email: "",
        phone: "",
        location: "",
        skills: [],
        education: [],
        experience: [],
        experience_years: 0.0
      };
      setProfile(cleared);
      updateRecommendations(cleared);
      return;
    }
    setProfile(newProfile);
    updateRecommendations(newProfile);
    persistProfile(newProfile, userId);
  };

  // On mount: try to restore a previously saved profile using the user_id
  // stored in localStorage; otherwise fetch initial jobs using empty profile.
  useEffect(() => {
    const storedUserId = localStorage.getItem("careercompass_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
      fetch(`${API_BASE_URL}/profile/${storedUserId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((savedProfile) => {
          if (savedProfile) {
            setProfile(savedProfile);
            updateRecommendations(savedProfile);
          } else {
            updateRecommendations(profile);
          }
        })
        .catch(() => updateRecommendations(profile));
    } else {
      updateRecommendations(profile);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col">
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-800/10 rounded-full blur-[120px] pointer-events-none glow-bg"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none glow-bg"></div>

      {/* Header Banner */}
      <header className="glass border-b border-slate-800/80 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-brand-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/25">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-brand-400 tracking-tight m-0 select-none">
                CareerCompass AI
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wide font-semibold uppercase">MVP Job Guidance Platform</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span>Tier-2/3 India Cities</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Gemini AI Interviewer</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6 z-10">
        {/* Left Column: Conversational AI Onboarding Chat (2/5 size) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bot className="w-4 h-4 text-brand-400" />
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">Guided Interview</h2>
          </div>
          <ChatInterface 
            onProfileUpdate={handleProfileUpdate} 
            apiBaseUrl={API_BASE_URL} 
          />
        </div>

        {/* Right Column: Tabbed Resume Preview & Job Matches (3/5 size) */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          {/* Tab Selector Header */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab("resume")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "resume"
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Resume Preview
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all relative ${
                  activeTab === "jobs"
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Job Matches
                {recommendations.length > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-brand-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-extrabold border border-slate-950">
                    {recommendations.filter(r => r.match_score >= 40).length}
                  </span>
                )}
              </button>
            </div>

            {/* Spinner indicator when recalculating */}
            {isUpdatingRecs && (
              <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Recalculating scores...</span>
              </div>
            )}
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1">
            {activeTab === "resume" ? (
              <ResumePreview 
                profile={profile} 
                onProfileUpdate={handleProfileUpdate}
                apiBaseUrl={API_BASE_URL}
              />
            ) : (
              <JobCards recommendations={recommendations} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-4 text-center text-[10px] text-slate-600">
        CareerCompass AI &bull; Powered by Google Gemini &amp; Python FastAPI. Developed for MVP Submission.
      </footer>
    </div>
  );
}
