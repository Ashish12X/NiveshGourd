// src/pages/LearningTopicPage.jsx
/**
 * LearningTopicPage — Stage 6 Progressive Interactive Learning Flow
 *
 * Implements the full learning loop:
 *   STEP 1: Adaptive Topic Explanation & Sections (calibrated to UnderstandingProfile)
 *   STEP 2: Comprehension Check (with confidence capture)
 *   STEP 3: Real Practical Scenario
 *   STEP 4: Interactive AI Tutor (fact-locked to verified curriculum)
 *   STEP 5: Completion & Dynamic Next Topic Recommendation
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  HelpCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  AlertTriangle,
  ExternalLink,
  Shield,
  Loader2,
  AlertCircle,
  Check,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useTranslation } from 'react-i18next';
import {
  fetchTopicDetails,
  startLearningTopic,
  submitLearningInteraction,
  completeLearningTopic,
  askAITutor,
} from '../services/learningApi';

export default function LearningTopicPage() {
  const { t } = useTranslation();
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comprehension state
  const [selectedComprehension, setSelectedComprehension] = useState(null);
  const [comprehensionConfidence, setComprehensionConfidence] = useState('MEDIUM');
  const [comprehensionResult, setComprehensionResult] = useState(null);
  const [submittingComprehension, setSubmittingComprehension] = useState(false);

  // Practical scenario state
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioConfidence, setScenarioConfidence] = useState('HIGH');
  const [scenarioResult, setScenarioResult] = useState(null);
  const [submittingScenario, setSubmittingScenario] = useState(false);

  // Completion state
  const [completionData, setCompletionData] = useState(null);
  const [completing, setCompleting] = useState(false);

  // AI Tutor state
  const [aiQuestion, setAiQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [askingAi, setAskingAi] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // Start topic
        await startLearningTopic(topicId);
        const res = await fetchTopicDetails(topicId);
        if (isMounted) {
          setData(res);
          // Set initial AI conversation
          setConversation([
            {
              sender: 'sangyan',
              text: `Welcome to "${res.topic.title}". I'm your SANGYAN learning companion. I explain concepts based on your calibrated profile (${res.adaptation?.depth} depth). Ask me any question about this module!`,
            },
          ]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load topic.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [topicId]);

  const handleComprehensionSubmit = async () => {
    if (!selectedComprehension || submittingComprehension) return;
    try {
      setSubmittingComprehension(true);
      const question = data.topic.comprehensionQuestions[0];
      const res = await submitLearningInteraction(topicId, {
        interactionType: 'comprehension_answer',
        questionId: question.questionId,
        selectedOption: selectedComprehension,
        confidence: comprehensionConfidence,
      });
      setComprehensionResult(res.evaluation);
    } catch (err) {
      alert(err.message || 'Failed to submit answer.');
    } finally {
      setSubmittingComprehension(false);
    }
  };

  const handleScenarioSubmit = async () => {
    if (!selectedScenario || submittingScenario) return;
    try {
      setSubmittingScenario(true);
      const scenario = data.topic.practicalScenarios[0];
      const res = await submitLearningInteraction(topicId, {
        interactionType: 'practical_attempt',
        scenarioId: scenario.scenarioId,
        selectedOption: selectedScenario,
        confidence: scenarioConfidence,
      });
      setScenarioResult(res.evaluation);
    } catch (err) {
      alert(err.message || 'Failed to submit scenario.');
    } finally {
      setSubmittingScenario(false);
    }
  };

  const handleCompleteTopic = async () => {
    try {
      setCompleting(true);
      const res = await completeLearningTopic(topicId);
      setCompletionData(res);
    } catch (err) {
      alert(err.message || 'Failed to complete topic.');
    } finally {
      setCompleting(false);
    }
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim() || askingAi) return;
    const q = aiQuestion.trim();
    setAiQuestion('');
    setConversation((prev) => [...prev, { sender: 'user', text: q }]);
    try {
      setAskingAi(true);
      const res = await askAITutor(topicId, q);
      setConversation((prev) => [...prev, { sender: 'sangyan', text: res.reply }]);
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          sender: 'sangyan',
          text: 'Unable to reach AI tutor right now. Please refer to the verified sections above or official regulatory portals.',
        },
      ]);
    } finally {
      setAskingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <h2 className="text-base font-semibold text-slate-800">
          Preparing Learning Module...
        </h2>
        <p className="text-xs text-slate-500">
          Adapting curriculum explanations to your calibrated understanding profile.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold">Topic Not Found</h2>
          </div>
          <p className="text-sm">{error || 'This learning module does not exist.'}</p>
          <Link to="/learn">
            <Button variant="secondary" size="sm">
              Back to Curriculum
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { topic, adaptation, progress } = data;
  const compQuestion = topic.comprehensionQuestions?.[0];
  const practicalScenario = topic.practicalScenarios?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      <PageHeader
        title={topic.title}
        subtitle={topic.shortDescription}
        backUrl="/learn"
        backLabel={t('learning.backToModules') || 'Back to Learning Curriculum'}
        badge={
          <Badge variant="teal" size="sm">
            {topic.domain} • {topic.difficulty}
          </Badge>
        }
      />

      {/* Adaptation Metadata Callout */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between text-xs text-teal-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
          <span>
            <strong>Personalized Presentation:</strong> {adaptation.summary}
          </span>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase shrink-0">
          {adaptation.depth} Depth
        </span>
      </div>

      {/* STEP 1: Progressive Lesson Content Sections */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-700" />
            <span>Core Lesson Concepts</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {topic.sections?.length} Sections
          </span>
        </div>

        <div className="space-y-8">
          {topic.sections?.map((sec, idx) => (
            <div key={idx} className="space-y-3 pb-6 border-b border-slate-100 last:border-b-0 last:pb-0">
              <h3 className="text-base font-bold text-slate-900">
                {sec.heading}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {sec.explanation}
              </p>

              {sec.example && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <strong className="text-slate-900 block font-semibold text-[11px] uppercase tracking-wider">
                    Realistic Example:
                  </strong>
                  <p className="leading-relaxed italic">"{sec.example}"</p>
                </div>
              )}

              {sec.warning && (
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/70 text-xs text-rose-950 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block mb-0.5">Critical Investor Warning:</strong>
                    <p className="leading-relaxed">{sec.warning}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Takeaways */}
        {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Key Takeaways:
            </span>
            <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-700">
              {topic.keyTakeaways.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* STEP 2: Comprehension Check */}
      {compQuestion && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Comprehension Check
              </h3>
              <p className="text-xs text-slate-500">
                Confirm your understanding before attempting the real scenario
              </p>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
            {compQuestion.question}
          </p>

          <div className="space-y-3">
            {compQuestion.options.map((opt) => {
              const isSelected = selectedComprehension === opt.id;
              let style = 'border-slate-200 hover:border-slate-300 bg-white';
              if (comprehensionResult) {
                if (opt.isCorrect) style = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold';
                else if (isSelected && !opt.isCorrect) style = 'border-rose-400 bg-rose-50/50 text-rose-950';
              } else if (isSelected) {
                style = 'border-teal-700 bg-teal-50/40 text-teal-950 font-medium';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(comprehensionResult)}
                  onClick={() => setSelectedComprehension(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all text-xs sm:text-sm text-slate-800 flex items-start gap-3 cursor-pointer ${style}`}
                >
                  <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center shrink-0 font-bold text-xs bg-slate-50">
                    {opt.id.toUpperCase()}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Confidence Selector before submitting */}
          {!comprehensionResult && (
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Your Confidence:</span>
                {['LOW', 'MEDIUM', 'HIGH'].map((conf) => (
                  <button
                    key={conf}
                    type="button"
                    onClick={() => setComprehensionConfidence(conf)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      comprehensionConfidence === conf
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="md"
                disabled={!selectedComprehension || submittingComprehension}
                onClick={handleComprehensionSubmit}
              >
                {submittingComprehension ? 'Evaluating...' : 'Check Answer'}
              </Button>
            </div>
          )}

          {/* Explanation Feedback */}
          {comprehensionResult && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                comprehensionResult.isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <strong className="block font-bold">
                {comprehensionResult.isCorrect ? '✅ Well done!' : '⚠️ Misconception Identified:'}
              </strong>
              <p>{comprehensionResult.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Practical Scenario */}
      {practicalScenario && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Try a Real Situation: {practicalScenario.title}
              </h3>
              <p className="text-xs text-slate-500">
                Apply your understanding to an actual real-world scenario
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 italic leading-relaxed">
            "{practicalScenario.situation}"
          </div>

          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
            {practicalScenario.question}
          </p>

          <div className="space-y-3">
            {practicalScenario.options.map((opt) => {
              const isSelected = selectedScenario === opt.id;
              let style = 'border-slate-200 hover:border-slate-300 bg-white';
              if (scenarioResult) {
                if (opt.isCorrect) style = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold';
                else if (isSelected && !opt.isCorrect) style = 'border-rose-400 bg-rose-50/50 text-rose-950';
              } else if (isSelected) {
                style = 'border-teal-700 bg-teal-50/40 text-teal-950 font-medium';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(scenarioResult)}
                  onClick={() => setSelectedScenario(opt.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all text-xs sm:text-sm text-slate-800 flex items-start gap-3 cursor-pointer ${style}`}
                >
                  <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center shrink-0 font-bold text-xs bg-slate-50">
                    {opt.id.toUpperCase()}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Confidence Selector before submitting */}
          {!scenarioResult && (
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Your Confidence:</span>
                {['LOW', 'MEDIUM', 'HIGH'].map((conf) => (
                  <button
                    key={conf}
                    type="button"
                    onClick={() => setScenarioConfidence(conf)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      scenarioConfidence === conf
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {conf}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                size="md"
                disabled={!selectedScenario || submittingScenario}
                onClick={handleScenarioSubmit}
              >
                {submittingScenario ? 'Evaluating...' : 'Apply Decision'}
              </Button>
            </div>
          )}

          {/* Explanation Feedback */}
          {scenarioResult && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                scenarioResult.isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <strong className="block font-bold">
                {scenarioResult.isCorrect ? '✅ Safe Decision Confirmed!' : '⚠️ Cautionary Reflection:'}
              </strong>
              <p>{scenarioResult.explanation}</p>
              {scenarioResult.reflectionNote && (
                <p className="font-medium pt-1">{scenarioResult.reflectionNote}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Interactive AI Tutor */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ask SANGYAN about this module
            </h3>
            <p className="text-xs text-slate-500">
              Interactive AI tutor answering in plain language, fact-locked to official guidelines
            </p>
          </div>
        </div>

        {/* Conversation View */}
        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 max-h-80 overflow-y-auto">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs sm:text-sm ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'sangyan' && (
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  S
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl max-w-lg leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {askingAi && (
            <div className="flex gap-3 text-xs sm:text-sm justify-start">
              <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 text-xs font-bold animate-pulse">
                S
              </div>
              <div className="p-3.5 rounded-2xl max-w-lg bg-white text-slate-500 border border-slate-200">
                Thinking in plain terms...
              </div>
            </div>
          )}
        </div>

        {/* Ask Input Form */}
        <form onSubmit={handleAskAi} className="flex gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Ask anything about this module (e.g., 'What if an advisor is registered abroad?')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-800"
          />
          <Button type="submit" variant="primary" size="md" icon={Send} iconPosition="right" disabled={askingAi}>
            Ask
          </Button>
        </form>
      </div>

      {/* Official Regulatory Sources */}
      {topic.officialSources && topic.officialSources.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
          <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
            Statutory & Regulatory Sources:
          </span>
          <div className="flex flex-wrap gap-3">
            {topic.officialSources.map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-800 hover:underline font-semibold"
              >
                <span>{src.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: Complete & Next Topic Recommendation */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        {!completionData ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Ready to complete this module?
              </h4>
              <p className="text-xs text-slate-500">
                Your responses will update your calibrated Understanding Profile and determine your next recommended chapter.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={completing || !comprehensionResult || !scenarioResult}
              onClick={handleCompleteTopic}
            >
              {completing ? 'Completing...' : 'Complete Module'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block text-emerald-800">
                  Status: {completionData.status}
                </span>
                <p className="text-xs sm:text-sm font-medium mt-0.5">
                  Comprehension: {completionData.comprehensionScore}% • Practical: {completionData.practicalScore}%
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            {/* Adaptive Next Recommendation */}
            {completionData.nextRecommendation && (
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                  Adaptive Next Chapter
                </span>
                <h3 className="text-lg font-bold">
                  {completionData.nextRecommendation.topic.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Why SANGYAN picked this:</strong> {completionData.nextRecommendation.reason}
                </p>
                <div className="pt-2 flex gap-3">
                  <Link to={`/learn/topic/${completionData.nextRecommendation.topic.topicId}`}>
                    <Button variant="teal" size="md" icon={ArrowRight} iconPosition="right">
                      Start Next Chapter
                    </Button>
                  </Link>
                  <Link to="/learn">
                    <Button variant="secondary" size="md">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
