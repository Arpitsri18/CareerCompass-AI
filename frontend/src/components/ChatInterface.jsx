import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, RefreshCw, Sparkles } from "lucide-react";

export default function ChatInterface({ onProfileUpdate, apiBaseUrl }) {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "Hi there! I am CareerCompass AI, your personal career guide. Let's build your professional resume and find local job opportunities in Tier-2/3 cities. To start, what is your full name?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: "user", content: inputValue.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // 1. Send chat message to FastAPI backend
      const chatRes = await fetch(`${apiBaseUrl}/resume/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });
      
      if (!chatRes.ok) throw new Error("Failed to send message to chat API");
      
      const chatData = await chatRes.json();
      const modelMessage = { role: "model", content: chatData.response };
      const finalMessages = [...updatedMessages, modelMessage];
      setMessages(finalMessages);

      // 2. Extract profile JSON dynamically from entire conversation history
      const extractRes = await fetch(`${apiBaseUrl}/resume/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: finalMessages })
      });

      if (extractRes.ok) {
        const profileData = await extractRes.json();
        onProfileUpdate(profileData);
      }
    } catch (err) {
      console.error("Error in chat flow:", err);
      setMessages(prev => [
        ...prev,
        { role: "model", content: "Oops! I hit a connection snag. Feel free to continue describing your experience or try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the chat? This will clear the chat history.")) {
      setMessages([
        {
          role: "model",
          content: "Hello! Let's start over. What is your full name?"
        }
      ]);
      onProfileUpdate(null);
    }
  };

  return (
    <div className="glass-card flex flex-col h-[600px] rounded-2xl overflow-hidden relative border border-slate-800">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-brand-900/60 to-slate-900 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-brand-500/20 p-1.5 rounded-lg border border-brand-500/30">
            <Bot className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm md:text-base">
              CareerCompass AI <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />
            </h3>
            <p className="text-xs text-slate-400">Onboarding Interviewer</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-800/50 rounded-lg"
          title="Reset Chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                msg.role === "user"
                  ? "bg-brand-600/20 border-brand-500/30 text-brand-300"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4.5 h-4.5" />
              ) : (
                <Bot className="w-4.5 h-4.5" />
              )}
            </div>
            <div
              className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-600 text-white rounded-tr-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-slate-950/60 border-t border-slate-800 flex gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-2.5 rounded-xl transition-all flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
