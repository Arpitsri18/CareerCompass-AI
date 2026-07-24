import React, { useState } from "react";
import { 
  MapPin, Briefcase, IndianRupee, HelpCircle, 
  X, CheckCircle, AlertTriangle, BookOpen, ExternalLink, Sparkles 
} from "lucide-react";

export default function JobCards({ recommendations }) {
  const [selectedJob, setSelectedJob] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 75) return "text-emerald-400 stroke-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 40) return "text-amber-400 stroke-amber-400 border-amber-500/20 bg-amber-500/5";
    return "text-rose-400 stroke-rose-400 border-rose-500/20 bg-rose-500/5";
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 75) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    if (score >= 40) return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    return "bg-rose-500/10 text-rose-300 border-rose-500/30";
  };

  const drawCircularProgress = (score) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Track circle */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="stroke-slate-800 fill-none"
            strokeWidth="3.5"
          />
          {/* Progress circle */}
          <circle
            cx="28"
            cy="28"
            r={radius}
            className={`fill-none transition-all duration-1000 ease-out`}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[11px] font-bold text-slate-100">{Math.round(score)}%</span>
      </div>
    );
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
        <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300">No Job Recommendations Yet</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Start typing in the interview chat or add details to your resume to see matching jobs in local Tier-2/3 cities.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
          Found {recommendations.length} Matching Roles
        </p>
        <div className="flex gap-4 text-[10px] text-slate-400">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></span> Strong (&ge;75%)</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></span> Good (40-74%)</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/40"></span> Low (&lt;40%)</div>
        </div>
      </div>

      {/* Grid of Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const scoreColorInfo = getScoreColor(rec.match_score);
          const scoreClass = scoreColorInfo.split(" ")[0]; // text color class
          const progressClass = scoreColorInfo.split(" ")[1]; // stroke class
          const cardClass = scoreColorInfo.split(" ")[2]; // border class
          const bgClass = scoreColorInfo.split(" ")[3]; // bg class

          return (
            <div 
              key={rec.job_id}
              className={`glass-card glass-card-hover rounded-xl p-5 border flex flex-col justify-between ${cardClass}`}
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border mb-1.5 uppercase ${getScoreBadgeClass(rec.match_score)}`}>
                      {rec.match_score >= 75 ? "Highly Compatible" : rec.match_score >= 40 ? "Potential Match" : "Skill Gap High"}
                    </span>
                    <h3 className="font-bold text-slate-100 text-base line-clamp-1 leading-snug">{rec.title}</h3>
                    <p className="text-xs text-brand-400 font-semibold mt-0.5">{rec.company}</p>
                  </div>
                  {/* Circular Gauge */}
                  <div className={`${scoreClass} ${progressClass}`}>
                    {drawCircularProgress(rec.match_score)}
                  </div>
                </div>

                {/* Job Metadata */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-1 mt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="line-clamp-1">{rec.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Req: {rec.experience_required} yrs</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                    <span>{rec.salary_range}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed italic">
                  "{rec.description}"
                </p>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800/40 flex items-center justify-between">
                <div className="flex flex-wrap gap-1 max-w-[65%] overflow-hidden max-h-5">
                  {rec.analysis.missing_skills.length > 0 ? (
                    <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                      -{rec.analysis.missing_skills.length} skills missing
                    </span>
                  ) : (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" /> Full Skills Match
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedJob(rec)}
                  className="bg-brand-600/10 hover:bg-brand-600/20 text-brand-300 border border-brand-500/30 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                >
                  Analyze Skills
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Skill Gap Analysis Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-brand-900/60 to-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-100 text-lg leading-tight">{selectedJob.title}</h3>
                <p className="text-xs text-brand-400 font-semibold">{selectedJob.company} &bull; {selectedJob.location}</p>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 p-1.5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Formula Match Score Meter */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overall Match Score</span>
                  <span className={`text-xl font-extrabold ${selectedJob.match_score >= 75 ? "text-emerald-400" : selectedJob.match_score >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                    {selectedJob.match_score}%
                  </span>
                </div>
                {/* Score slider bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      selectedJob.match_score >= 75 ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : selectedJob.match_score >= 40 ? "bg-amber-500 shadow-lg shadow-amber-500/20" : "bg-rose-500 shadow-lg shadow-rose-500/20"
                    }`}
                    style={{ width: `${selectedJob.match_score}%` }}
                  ></div>
                </div>

                {/* Score breakdown description */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] text-center text-slate-400 border-t border-slate-800/60 pt-3">
                  <div>
                    <div className="font-bold text-slate-200">{selectedJob.breakdown.skill_overlap}%</div>
                    <div className="text-[9px] text-slate-500">Skills Weight (60%)</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{selectedJob.breakdown.location_match}%</div>
                    <div className="text-[9px] text-slate-500">Location Weight (25%)</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{selectedJob.breakdown.experience_fit}%</div>
                    <div className="text-[9px] text-slate-500">Experience Weight (15%)</div>
                  </div>
                </div>
              </div>

              {/* Skills Overlap & Missing */}
              <div className="space-y-4">
                {/* Matching Skills */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Matching Skills ({selectedJob.analysis.matching_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.analysis.matching_skills.map((skill, idx) => (
                      <span key={idx} className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {selectedJob.analysis.matching_skills.length === 0 && (
                      <span className="text-xs text-slate-500 italic">None of the required skills match your current profile.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-rose-400 font-bold mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Missing Skills ({selectedJob.analysis.missing_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.analysis.missing_skills.map((skill, idx) => (
                      <span key={idx} className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {selectedJob.analysis.missing_skills.length === 0 && (
                      <span className="text-xs text-emerald-400 italic flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Wow, you have all the required skills for this job!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actionable Learning Path / Recommendations */}
              {selectedJob.analysis.learning_recommendations.length > 0 && (
                <div className="border-t border-slate-800/80 pt-4">
                  <h4 className="text-xs uppercase tracking-wider text-brand-400 font-bold mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Recommended Learning Path
                  </h4>
                  <div className="space-y-3">
                    {selectedJob.analysis.learning_recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg flex items-start gap-3">
                        <div className="bg-brand-500/10 p-1.5 rounded text-brand-400 border border-brand-500/20 shrink-0">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Master {rec.skill}</span>
                          <span className="text-xs text-slate-400 block mt-0.5">{rec.resource}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
