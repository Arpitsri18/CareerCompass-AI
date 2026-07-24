import React, { useState, useEffect } from "react";
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Plus, Trash2, Edit2, Check, Sparkles, Award, Download, Loader2
} from "lucide-react";

export default function ResumePreview({ profile, onProfileUpdate, apiBaseUrl }) {
  const [localProfile, setLocalProfile] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [newSkill, setNewSkill] = useState("");
  const [exportingFormat, setExportingFormat] = useState(null); // "pdf" | "docx" | null

  // Keep local state in sync with parent prop
  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
    } else {
      // Default empty template
      setLocalProfile({
        name: "",
        email: "",
        phone: "",
        location: "",
        skills: [],
        education: [],
        experience: [],
        experience_years: 0.0
      });
    }
  }, [profile]);

  if (!localProfile) return null;

  const triggerUpdate = (updatedProfile) => {
    setLocalProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...localProfile, [field]: value };
    triggerUpdate(updated);
  };

  const toggleEdit = (fieldKey) => {
    setEditFields(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleBlur = (fieldKey) => {
    setEditFields(prev => ({ ...prev, [fieldKey]: false }));
  };

  const handleKeyDown = (e, fieldKey) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      toggleEdit(fieldKey);
    }
  };

  // Skill management
  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (localProfile.skills.includes(newSkill.trim())) {
      setNewSkill("");
      return;
    }
    const updatedSkills = [...localProfile.skills, newSkill.trim()];
    const updated = { ...localProfile, skills: updatedSkills };
    triggerUpdate(updated);
    setNewSkill("");
  };

  const deleteSkill = (skillToDelete) => {
    const updatedSkills = localProfile.skills.filter(s => s !== skillToDelete);
    const updated = { ...localProfile, skills: updatedSkills };
    triggerUpdate(updated);
  };

  // Education management
  const updateEducation = (index, field, value) => {
    const updatedEd = [...localProfile.education];
    updatedEd[index] = { ...updatedEd[index], [field]: value };
    const updated = { ...localProfile, education: updatedEd };
    triggerUpdate(updated);
  };

  const addEducation = () => {
    const newItem = { degree: "Degree/Course", school: "College/School Name", year: "2026" };
    const updatedEd = [...localProfile.education, newItem];
    const updated = { ...localProfile, education: updatedEd };
    triggerUpdate(updated);
  };

  const deleteEducation = (index) => {
    const updatedEd = localProfile.education.filter((_, i) => i !== index);
    const updated = { ...localProfile, education: updatedEd };
    triggerUpdate(updated);
  };

  // Experience management
  const updateExperience = (index, field, value) => {
    const updatedExp = [...localProfile.experience];
    updatedExp[index] = { ...updatedExp[index], [field]: value };
    const updated = { ...localProfile, experience: updatedExp };
    triggerUpdate(updated);
  };

  const addExperience = () => {
    const newItem = { company: "Company Name", role: "Role/Position", duration: "1 year", description: "Duties performed" };
    const updatedExp = [...localProfile.experience, newItem];
    const updated = { ...localProfile, experience: updatedExp };
    triggerUpdate(updated);
  };

  const deleteExperience = (index) => {
    const updatedExp = localProfile.experience.filter((_, i) => i !== index);
    const updated = { ...localProfile, experience: updatedExp };
    triggerUpdate(updated);
  };

  const renderInlineEdit = (fieldKey, value, placeholder, type = "text", className = "") => {
    const isEditing = editFields[fieldKey];
    
    if (isEditing) {
      if (type === "textarea") {
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
            onBlur={() => handleBlur(fieldKey)}
            className="w-full bg-slate-900 border border-brand-500 rounded px-2 py-1 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            rows={3}
            autoFocus
          />
        );
      }
      return (
        <input
          type={type}
          value={value === 0 ? "0" : (value || "")}
          onChange={(e) => handleFieldChange(fieldKey, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          onBlur={() => handleBlur(fieldKey)}
          onKeyDown={(e) => handleKeyDown(e, fieldKey)}
          className={`bg-slate-900 border border-brand-500 rounded px-2 py-0.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${className}`}
          autoFocus
        />
      );
    }

    return (
      <div 
        onClick={() => toggleEdit(fieldKey)}
        className="group flex items-center gap-2 cursor-pointer hover:bg-slate-800/40 rounded px-2 py-0.5 transition-all -ml-2 select-none"
      >
        <span className={`${!value ? "text-slate-500 italic" : "text-slate-100"} ${className}`}>
          {value === 0 ? "0" : (value || placeholder)}
        </span>
        <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  const hasContent = localProfile.name || localProfile.email || localProfile.skills.length > 0;

  const downloadResume = async (format) => {
    if (!apiBaseUrl || exportingFormat) return;
    setExportingFormat(format);
    try {
      const res = await fetch(`${apiBaseUrl}/resume/export?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localProfile)
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const filename = `${(localProfile.name || "resume").trim().replace(/\s+/g, "_")}.${format}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting resume:", err);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 md:p-8 border border-slate-800 relative bg-slate-900/40 overflow-hidden">
      {/* Background glow decorator */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {!hasContent && (
        <div className="p-4 mb-6 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>Interactive profile template. Start typing in the interview chat to auto-populate, or edit any field below by clicking on it.</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="border-b border-slate-800 pb-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            {renderInlineEdit("name", localProfile.name, "Your Full Name", "text", "text-2xl md:text-3xl font-bold tracking-tight text-white")}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                {renderInlineEdit("email", localProfile.email, "your.email@example.com")}
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-500" />
                {renderInlineEdit("phone", localProfile.phone, "+91 99999 99999")}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-500" />
                {renderInlineEdit("location", localProfile.location, "City, State")}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="bg-slate-800/60 rounded-xl px-4 py-2 border border-slate-700/50 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Experience</span>
              <div className="flex items-center gap-1 mt-1">
                {renderInlineEdit("experience_years", localProfile.experience_years, "0.0", "number", "text-lg font-bold text-brand-400 w-12 text-center")}
                <span className="text-sm text-slate-300">Yrs</span>
              </div>
            </div>
            {hasContent && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => downloadResume("pdf")}
                  disabled={!!exportingFormat}
                  className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-brand-600/10 hover:bg-brand-600/20 text-brand-300 border border-brand-500/30 transition-all disabled:opacity-50"
                >
                  {exportingFormat === "pdf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  PDF
                </button>
                <button
                  onClick={() => downloadResume("docx")}
                  disabled={!!exportingFormat}
                  className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
                >
                  {exportingFormat === "docx" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  DOCX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="space-y-6">
        {/* Skills Section */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-brand-400 font-bold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" /> Technical Skills
          </h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {localProfile.skills.map((skill, index) => (
              <span 
                key={index}
                className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 px-3 py-1 rounded-full text-xs font-medium border border-brand-500/20 flex items-center gap-1.5 transition-all group"
              >
                {skill}
                <button 
                  onClick={() => deleteSkill(skill)}
                  className="text-brand-400/60 hover:text-brand-300 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
            {localProfile.skills.length === 0 && (
              <span className="text-xs text-slate-500 italic">No skills listed yet</span>
            )}
          </div>
          <form onSubmit={addSkill} className="flex gap-2 max-w-xs">
            <input
              type="text"
              placeholder="Add skill (e.g., Python)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button 
              type="submit" 
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg transition-colors flex items-center justify-center border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Experience Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs uppercase tracking-wider text-brand-400 font-bold flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Work Experience & Projects
            </h4>
            <button
              onClick={addExperience}
              className="text-[10px] flex items-center gap-1 hover:text-brand-300 text-slate-400 transition-colors bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              <Plus className="w-3 h-3" /> Add Experience
            </button>
          </div>
          <div className="space-y-4">
            {localProfile.experience.map((exp, idx) => (
              <div key={idx} className="relative group/item pl-4 border-l border-slate-800 hover:border-brand-500/40 transition-colors py-1">
                {/* Delete button */}
                <button
                  onClick={() => deleteExperience(idx)}
                  className="absolute top-0 right-0 text-slate-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                  <div>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExperience(idx, "role", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-brand-500 focus:outline-none text-slate-200 text-sm font-semibold transition-colors px-1"
                      placeholder="Role (e.g. Frontend Intern)"
                    />
                    <span className="text-slate-400 mx-1">at</span>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(idx, "company", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-brand-500 focus:outline-none text-slate-300 text-sm font-medium transition-colors px-1"
                      placeholder="Company/Project"
                    />
                  </div>
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => updateExperience(idx, "duration", e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-brand-500 focus:outline-none text-slate-400 text-xs md:text-right transition-colors px-1 w-28"
                    placeholder="Duration"
                  />
                </div>
                <div className="mt-1.5">
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, "description", e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-800 focus:border-brand-500 focus:outline-none text-slate-400 text-xs transition-colors px-1 resize-none"
                    placeholder="Describe your responsibilities, tools used, or project accomplishments..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            {localProfile.experience.length === 0 && (
              <p className="text-xs text-slate-500 italic pl-4 border-l border-slate-800 py-1">No experience or projects listed yet. Click 'Add Experience' or chat with the bot.</p>
            )}
          </div>
        </div>

        {/* Education Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs uppercase tracking-wider text-brand-400 font-bold flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Education
            </h4>
            <button
              onClick={addEducation}
              className="text-[10px] flex items-center gap-1 hover:text-brand-300 text-slate-400 transition-colors bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              <Plus className="w-3 h-3" /> Add Education
            </button>
          </div>
          <div className="space-y-4">
            {localProfile.education.map((edu, idx) => (
              <div key={idx} className="relative group/item pl-4 border-l border-slate-800 hover:border-brand-500/40 transition-colors py-1">
                {/* Delete button */}
                <button
                  onClick={() => deleteEducation(idx)}
                  className="absolute top-0 right-0 text-slate-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                  <div>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-brand-500 focus:outline-none text-slate-200 text-sm font-semibold transition-colors px-1"
                      placeholder="Degree/Course (e.g. B.Tech in CS)"
                    />
                    <span className="text-slate-400 mx-1">from</span>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(idx, "school", e.target.value)}
                      className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-brand-500 focus:outline-none text-slate-300 text-sm font-medium transition-colors px-1"
                      placeholder="University/College"
                    />
                  </div>
                  <input
                    type="text"
                    value={edu.year}
                    onChange={(e) => updateEducation(idx, "year", e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-brand-500 focus:outline-none text-slate-400 text-xs md:text-right transition-colors px-1 w-20"
                    placeholder="Graduation Year"
                  />
                </div>
              </div>
            ))}
            {localProfile.education.length === 0 && (
              <p className="text-xs text-slate-500 italic pl-4 border-l border-slate-800 py-1">No education listed yet. Click 'Add Education' or chat with the bot.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
