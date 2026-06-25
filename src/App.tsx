import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  GraduationCap,
  Activity,
  Code,
  PenTool,
  Briefcase,
  CheckSquare,
  Sparkles,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Sparkle
} from "lucide-react";
import { Message, ChatSession, CapabilityCard } from "./types";
import { CAPABILITY_CARDS } from "./data";
import HayatLogo from "./components/HayatLogo";

export default function App() {
  // State for chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // State for active conversation
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sidebar state (mobile and desktop toggle)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Card states
  const [selectedCategory, setSelectedCategory] = useState<CapabilityCard | null>(null);
  
  // UI States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<boolean | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-collapse sidebar on smaller screens on startup and handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    // Check once immediately
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load chat sessions from local storage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("hayat_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
      }
    }
    
    // Check API health status
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setApiKeyStatus(data.apiKeyConfigured);
      })
      .catch((err) => {
        console.error("Health check failed", err);
        setApiKeyStatus(false);
      });
  }, []);

  // Save sessions to local storage whenever they change
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem("hayat_sessions", JSON.stringify(updatedSessions));
  };

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId, isLoading]);

  // Create a brand new session
  const createNewSession = (initialMsg?: string) => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: initialMsg 
        ? initialMsg.length > 30 
          ? initialMsg.substring(0, 30) + "..." 
          : initialMsg 
        : "New Discussion",
      messages: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setActiveSessionId(newSession.id);
    setSelectedCategory(null);
    return newSession.id;
  };

  // Delete a session
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    saveSessionsToStorage(updated);
    
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  // Clear all conversations
  const clearAllSessions = () => {
    if (window.confirm("Are you sure you want to clear your entire chat history?")) {
      saveSessionsToStorage([]);
      setActiveSessionId(null);
    }
  };

  // Send a message
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInputValue("");

    // Determine target session ID
    let currentSessionId = activeSessionId;
    let currentSession = sessions.find((s) => s.id === currentSessionId);

    // If there is no session, or current session has messages and user clicks a category prompt, 
    // or we just want to spawn a fresh session
    if (!currentSessionId || !currentSession) {
      currentSessionId = createNewSession(trimmed);
      currentSession = {
        id: currentSessionId,
        title: trimmed.length > 30 ? trimmed.substring(0, 30) + "..." : trimmed,
        messages: [],
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Append user message
    const updatedMessages = [...currentSession.messages, userMessage];
    
    // Update title if it was default
    const title = currentSession.title === "New Discussion" 
      ? (trimmed.length > 30 ? trimmed.substring(0, 30) + "..." : trimmed)
      : currentSession.title;

    const updatedSession: ChatSession = {
      ...currentSession,
      title,
      messages: updatedMessages,
    };

    const updatedSessions = sessions.map((s) => 
      s.id === currentSessionId ? updatedSession : s
    );
    
    // Move updated session to top
    const sortedSessions = [
      updatedSession,
      ...updatedSessions.filter((s) => s.id !== currentSessionId)
    ];

    saveSessionsToStorage(sortedSessions);
    setActiveSessionId(currentSessionId);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch response from Hayat AI.");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage],
      };

      const finalSessions = sortedSessions.map((s) => 
        s.id === currentSessionId ? finalSession : s
      );

      saveSessionsToStorage(finalSessions);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while reflecting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Helper to map icon names to Lucide elements
  const renderCardIcon = (iconName: string) => {
    switch (iconName) {
      case "GraduationCap":
        return <GraduationCap className="w-5 h-5" />;
      case "Activity":
        return <Activity className="w-5 h-5" />;
      case "Code":
        return <Code className="w-5 h-5" />;
      case "PenTool":
        return <PenTool className="w-5 h-5" />;
      case "Briefcase":
        return <Briefcase className="w-5 h-5" />;
      case "CheckSquare":
        return <CheckSquare className="w-5 h-5" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  // Copy code utility
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Find active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-[#1e293b] font-sans overflow-hidden">
      
      {/* SIDEBAR FOR CONVERSATION HISTORY */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 bg-slate-900 text-slate-300 flex flex-col z-40 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isSidebarOpen
            ? "translate-x-0 md:static md:translate-x-0"
            : "-translate-x-full md:hidden"
        }`}
        id="sidebar"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white shadow-md flex items-center justify-center">
              <HayatLogo className="w-6 h-6" />
            </span>
            <div>
              <h1 className="font-display font-bold text-slate-100 text-lg tracking-tight leading-none">Hayat AI</h1>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-semibold uppercase mt-1 inline-block">Calm & Smart</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            id="close-sidebar-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              createNewSession();
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 active:scale-98"
            id="sidebar-new-chat-btn"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat session</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 tracking-wider uppercase">
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs italic">
              No conversations started yet. Ask your first question!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setSelectedCategory(null);
                    if (window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`group w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 text-left ${
                    isActive
                      ? "bg-slate-800 text-slate-100 font-medium border-l-4 border-emerald-500 pl-2.5"
                      : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                  }`}
                  id={`session-item-${session.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                    <div className="truncate text-sm flex-1">
                      <p className="truncate">{session.title}</p>
                      <span className="text-[10px] text-slate-500 block mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {session.createdAt}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-all ml-1.5 focus:opacity-100"
                    title="Delete Chat"
                    id={`delete-btn-${session.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500 space-y-2">
          {sessions.length > 1 && (
            <button
              onClick={clearAllSessions}
              className="w-full text-left py-1 px-2 rounded hover:bg-slate-800/80 hover:text-rose-400 transition-colors flex items-center gap-1.5"
              id="clear-all-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${apiKeyStatus ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></span>
            <span className="truncate">
              {apiKeyStatus ? "Gemini Free Quota Connected" : "API Setup checking..."}
            </span>
          </div>
          <p className="text-[10px]">No account required. Fast & direct.</p>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs md:hidden z-35"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP UNIFIED HEADER BAR */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 flex-shrink-0 md:h-16 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 focus:outline-none transition-all flex items-center justify-center border border-slate-200 bg-white shadow-xs"
              id="sidebar-toggle-btn"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            
            <div className="flex items-center gap-2">
              {!isSidebarOpen && (
                <span className="p-1 rounded-md bg-white shadow-sm flex items-center justify-center border border-slate-150">
                  <HayatLogo className="w-4 h-4" />
                </span>
              )}
              <span className="font-display font-bold tracking-tight text-slate-900 text-sm md:text-base truncate max-w-[150px] sm:max-w-[300px]">
                {activeSession ? activeSession.title : "Hayat AI"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* New Chat Button */}
            <button
              onClick={() => createNewSession()}
              className="py-1.5 px-3 rounded-xl hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 font-semibold text-xs md:text-sm flex items-center gap-1.5 border border-emerald-100 bg-emerald-50/40 transition-all shadow-xs active:scale-95"
              id="top-new-chat-btn"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>
        
        {/* API Warning if not loaded properly */}
        {apiKeyStatus === false && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>Gemini Secret is being retrieved or offline. Make sure GEMINI_API_KEY is saved in settings.</span>
            </div>
          </div>
        )}

        {/* Current Active Conversation Details / Empty State */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {!activeSession || activeSession.messages.length === 0 ? (
            
            /* HERO / STARTER BOARD */
            <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 flex flex-col items-center">
              
              {/* BRAND LOGO */}
              <div className="mb-6 text-center animate-fade-in">
                <span className="inline-flex p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/50 mb-4 items-center justify-center">
                  <HayatLogo className="w-12 h-12" />
                </span>
                <h2 className="text-3xl md:text-4xl font-display font-extrabold text-slate-950 tracking-tight">
                  Hayat AI
                </h2>
                <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto mt-2.5 font-sans leading-relaxed">
                  Welcome to your direct space for rapid study, clear explanations, entrepreneur planning, and code building.
                </p>
                <div className="flex items-center justify-center gap-3 mt-4 text-xs font-medium text-emerald-800">
                  <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">No Sign In</span>
                  <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 font-mono">Gemini 3.5 Flash</span>
                  <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Durable Offline Log</span>
                </div>
              </div>

              {/* CAPABILITY GRID */}
              <div className="w-full mt-8">
                <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4 text-left">
                  Explore Capabilities & Fast Prompts
                </div>
                
                {selectedCategory === null ? (
                  /* Main Categories Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CAPABILITY_CARDS.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => setSelectedCategory(card)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-white ${card.colorTheme.border} ${card.colorTheme.hoverBg} hover:shadow-md group flex flex-col justify-between h-40 relative`}
                        id={`card-${card.id}`}
                      >
                        <div>
                          <div className={`p-2 rounded-xl inline-flex mb-3 ${card.colorTheme.iconBg} ${card.colorTheme.iconColor}`}>
                            {renderCardIcon(card.iconName)}
                          </div>
                          <h3 className="font-display font-semibold text-slate-900 text-sm tracking-tight leading-snug group-hover:text-emerald-800">
                            {card.title}
                          </h3>
                          <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-emerald-700 self-end mt-2">
                          <span>See prompts</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Expanded Prompt Cards */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${selectedCategory.colorTheme.iconBg} ${selectedCategory.colorTheme.iconColor}`}>
                          {renderCardIcon(selectedCategory.iconName)}
                        </div>
                        <span className="font-semibold text-sm text-slate-800">{selectedCategory.title} prompts</span>
                      </div>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        Back to categories
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedCategory.prompts.map((promptText, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(promptText)}
                          className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all text-xs text-slate-600 hover:text-slate-900 h-32 flex flex-col justify-between cursor-pointer group"
                        >
                          <span className="line-clamp-4 leading-relaxed font-sans">{promptText}</span>
                          <span className="text-[10px] font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-2">
                            Send Prompt →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* BRAND BELIEF SYSTEM */}
              <div className="mt-12 p-5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-500 max-w-2xl text-center leading-relaxed">
                <span className="font-semibold text-slate-700 uppercase tracking-wider block mb-1">Hayat AI Philosophy</span>
                Calm, smart, and respectful. Hayat is designed to break down difficult matters without solving everything for you, encouraging authentic learning and long-term capability. No logins or forms are required to save effort.
              </div>
              
            </div>
          ) : (
            
            /* MESSAGES LIST FEED */
            <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
              
              {/* Discussion Title Header */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm leading-tight">
                      {activeSession.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Active chat logged locally
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm("Do you want to reset this session?")) {
                        const updated = sessions.map((s) => 
                          s.id === activeSession.id ? { ...s, messages: [] } : s
                        );
                        saveSessionsToStorage(updated);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Reset Session Messages"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* The Feed */}
              <div className="space-y-6">
                {activeSession.messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* Avatar for AI */}
                      {!isUser && (
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-xs">
                          <HayatLogo className="w-5 h-5" />
                        </div>
                      )}

                      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-5 shadow-xs relative ${
                        isUser
                          ? "bg-slate-900 text-slate-100 rounded-tr-none"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none"
                      }`}>
                        
                        {/* Copy button for Assistant messages */}
                        {!isUser && (
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            title="Copy text"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        <div className="prose prose-slate max-w-none text-sm md:text-base">
                          {isUser ? (
                            <p className="whitespace-pre-wrap font-sans break-words">{message.content}</p>
                          ) : (
                            <div className="markdown-body">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>

                        <div className={`text-[10px] mt-2.5 flex items-center justify-between ${
                          isUser ? "text-slate-400" : "text-slate-400"
                        }`}>
                          <span className="font-mono font-medium">{isUser ? "You" : "Hayat AI"}</span>
                          <span>{message.timestamp}</span>
                        </div>
                      </div>

                      {/* Avatar for User */}
                      {isUser && (
                        <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex-shrink-0 flex items-center justify-center font-display font-bold text-xs uppercase shadow-xs">
                          ME
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading Reflector */}
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center animate-pulse">
                      <HayatLogo className="w-5 h-5" />
                    </div>

                    <div className="bg-white border border-slate-200/80 text-slate-600 rounded-2xl rounded-tl-none p-5 shadow-xs max-w-[85%] md:max-w-[75%]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex space-x-1.5">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-xs font-medium text-slate-400 animate-pulse font-sans">
                          Hayat AI is reflecting...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2 max-w-xl mx-auto">
                    <p className="font-semibold">Reflecting was interrupted</p>
                    <p>{error}</p>
                    <button
                      onClick={() => {
                        const currentSession = sessions.find((s) => s.id === activeSessionId);
                        if (currentSession && currentSession.messages.length > 0) {
                          const lastUserMessage = [...currentSession.messages]
                            .reverse()
                            .find((m) => m.role === "user");
                          if (lastUserMessage) {
                            handleSendMessage(lastUserMessage.content);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg font-medium text-rose-900 transition-colors"
                    >
                      Retry Reflection
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* INPUT INPUT-PANEL */}
        <div className="bg-white border-t border-slate-200 p-4 md:p-6 z-20">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Hayat AI anything... (Study, Tech, Creative, Science...)"
                disabled={isLoading}
                className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-sm md:text-base text-slate-800 transition-all font-sans placeholder:text-slate-400 shadow-inner"
                id="chat-input"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`absolute right-2 p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
                  inputValue.trim() && !isLoading
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-200"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                }`}
                id="send-message-btn"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-[11px] text-slate-400 font-sans">
              <div className="flex items-center gap-1.5">
                <span>⚡ Powered by Google Gemini 3.5-flash</span>
              </div>
              <div className="flex items-center gap-3">
                <span>✨ Calm & confident helper</span>
                <span>🔒 Secure API Proxy</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
