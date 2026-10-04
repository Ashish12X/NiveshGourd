// src/pages/AskSangyanPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Bot,
  HelpCircle,
  Search,
  BookOpen,
  ArrowRight,
  PlusCircle,
  Loader2,
  CheckCircle2,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { sendMessage, listConversations, getConversation } from '../services/aiApi';
import { useAuth } from '../context/AuthContext';

export default function AskSangyanPage() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [activeIntent, setActiveIntent] = useState('Explain'); // Explain | Verify | Guide
  const [inputQuestion, setInputQuestion] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const initialWelcomeMessage = {
    id: 'welcome',
    sender: 'sangyan',
    text: "Welcome to Ask NiveshGuard. I am your adaptive investor safety tutor.\n\nAsk me anything about Indian financial terms, investment mechanics, verifying platforms, or identifying potential scam red flags. My responses adapt to your understanding profile and safety context.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    metadata: {
      adaptationSummary: "Standard tutor mode active.",
      safetyLevel: "normal"
    }
  };

  const [messages, setMessages] = useState([initialWelcomeMessage]);

  const suggestedQuestions = [
    "What is investment risk?",
    "How do I verify an investment platform?",
    "What are investor rights?",
    "Someone promised me guaranteed 30% returns on WhatsApp.",
  ];

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversation list if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadPastConversations();
    }
  }, [isAuthenticated]);

  const loadPastConversations = async () => {
    try {
      const list = await listConversations();
      if (list && Array.isArray(list)) {
        setConversations(list);
      }
    } catch {
      // Non-critical; silently fail
    }
  };

  const handleStartNewChat = () => {
    setConversationId(null);
    setMessages([
      {
        ...initialWelcomeMessage,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSelectConversation = async (convId) => {
    try {
      setIsLoading(true);
      const conv = await getConversation(convId);
      if (conv) {
        setConversationId(conv._id);
        const mappedMsgs = (conv.messages || []).map((m, idx) => ({
          id: `conv-msg-${idx}-${Date.now()}`,
          sender: m.role === 'assistant' ? 'sangyan' : 'user',
          text: m.content,
          metadata: m.metadata || {},
          timestamp: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(mappedMsgs.length > 0 ? mappedMsgs : [initialWelcomeMessage]);
        setShowHistory(false);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;

    const userQ = inputQuestion.trim();
    setInputQuestion('');

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userQ,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await sendMessage({
        message: userQ,
        conversationId,
        uiMode: activeIntent,
        language: i18n.language || 'en',
      });

      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      const assistantMsg = {
        id: `a-${Date.now()}`,
        sender: 'sangyan',
        text: result.message,
        metadata: result.metadata || {},
        isFallback: result.isFallback || false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Refresh conversation list in background
      loadPastConversations();
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'sangyan',
        text: !isAuthenticated
          ? "Please sign in to your SANGYAN account to chat with the adaptive AI engine."
          : err.message || "SANGYAN couldn't complete that response right now. Please try again.",
        isFallback: true,
        metadata: {
          adaptationSummary: "Temporary connection or service notice.",
          safetyLevel: "normal"
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickSuggested = (q) => {
    setInputQuestion(q);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={t('ask.title')}
          subtitle={t('ask.subtitle')}
          badge={
            <Badge variant="teal" size="sm">
              Adaptive AI Engine
            </Badge>
          }
        />
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {conversations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              History ({conversations.length})
            </button>
          )}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>
      </div>

      {/* History Drawer Dropdown */}
      {showHistory && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>Recent Conversations</span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => handleSelectConversation(c._id)}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  c._id === conversationId
                    ? 'bg-teal-50 border border-teal-200 text-teal-900 font-medium'
                    : 'hover:bg-white text-slate-700'
                }`}
              >
                <span className="truncate max-w-md">{c.title || 'Untitled conversation'}</span>
                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                  {new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Safety Guardrail Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Strict Safety Guardrail:</strong> {t('ask.disclaimer')}
        </div>
      </div>

      {/* Intent Shortcuts */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Intent Mode:
        </span>
        {['Explain', 'Verify', 'Guide'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setActiveIntent(mode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeIntent === mode
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {mode === 'Explain' && `📖 ${t('ask.modeExplain')}`}
            {mode === 'Verify' && `🔍 ${t('ask.modeVerify')}`}
            {mode === 'Guide' && `🧭 ${t('ask.modeGuide')}`}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 flex flex-col h-[560px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-semibold text-slate-400">
                  {msg.sender === 'user' ? 'You' : 'NiveshGuard Companion'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {msg.timestamp}
                </span>
              </div>

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-xl whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                }`}
              >
                {msg.text}

                {/* Adaptive Metadata Pill (Safe Explain Why metadata) */}
                {msg.sender === 'sangyan' && msg.metadata?.adaptationSummary && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                    <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                    <span className="font-medium text-slate-600">Personalized:</span>
                    <span>{msg.metadata.adaptationSummary}</span>
                    {msg.metadata.safetyLevel && msg.metadata.safetyLevel !== 'normal' && (
                      <span className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Caution Signal
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-semibold text-slate-400">
                  NiveshGuard Companion
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200/80 rounded-tl-xs flex items-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                <span>Thinking and tailoring response to your profile...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="py-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" /> Prompts:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePickSuggested(q)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            placeholder={t('ask.placeholder')}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-800 text-slate-800 disabled:opacity-60"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Send}
            iconPosition="right"
            disabled={isLoading || !inputQuestion.trim()}
          >
            {isLoading ? t('ask.sending') : t('ask.send')}
          </Button>
        </form>
      </div>
    </div>
  );
}
