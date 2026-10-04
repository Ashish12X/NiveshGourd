// src/pages/MySafetyPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  FolderLock,
  FileCheck,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Search,
  FileText,
  Calendar,
  Lock,
  Sparkles,
  RefreshCw,
  Loader2,
  Compass,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import SectionHeader from '../components/common/SectionHeader';
import StatusBadge from '../components/common/StatusBadge';
import ProgressBar from '../components/common/ProgressBar';
import Button from '../components/common/Button';
import SafetyCard from '../components/cards/SafetyCard';
import SafetyReceiptCard from '../components/cards/SafetyReceiptCard';
import EvidenceCard from '../components/cards/EvidenceCard';
import { fetchUnderstandingProfile } from '../services/assessmentApi';
import { getVerificationHistory } from '../services/verificationApi';
import { fetchSafetyHubOverview } from '../services/safetyApi';

const ORDERED_TOPIC_KEYS = [
  'basicConcepts',
  'riskReturn',
  'fraudAwareness',
  'sourceVerification',
  'investorRights',
  'grievanceAwareness',
];

export default function MySafetyPage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [recentChecks, setRecentChecks] = useState([]);
  const [loadingChecks, setLoadingChecks] = useState(true);

  const [safetyOverview, setSafetyOverview] = useState(null);
  const [loadingSafety, setLoadingSafety] = useState(true);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      setProfileError(null);
      const data = await fetchUnderstandingProfile();
      setProfile(data);
    } catch (err) {
      console.warn('MySafety profile load:', err.message);
      setProfileError(err.message || 'Unable to retrieve understanding profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadRecentChecks = async () => {
    try {
      setLoadingChecks(true);
      const res = await getVerificationHistory(1, 3);
      if (res && res.items && res.items.length > 0) {
        setRecentChecks(res.items);
      }
    } catch (err) {
      console.warn('MySafety recent checks load:', err.message);
    } finally {
      setLoadingChecks(false);
    }
  };

  const loadSafetyHub = async () => {
    try {
      setLoadingSafety(true);
      const overview = await fetchSafetyHubOverview();
      setSafetyOverview(overview);
    } catch (err) {
      console.warn('MySafety hub overview load:', err.message);
    } finally {
      setLoadingSafety(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadRecentChecks();
    loadSafetyHub();
  }, []);

  const getStatusBadgeClass = (status) => {
    if (status === 'Strong') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Developing') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (status === 'Needs Attention') return 'bg-orange-50 text-orange-800 border-orange-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getProgressBarColor = (status) => {
    if (status === 'Strong') return 'emerald';
    if (status === 'Developing') return 'amber';
    return 'slate';
  };

  const receipts = safetyOverview?.recentReceipts || [];
  const evidenceList = safetyOverview?.recentEvidence || [];
  const evidenceCount = safetyOverview?.summary?.evidenceCount ?? 0;
  const receiptsCount = safetyOverview?.summary?.receiptsCount ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <PageHeader
        title={t('mySafety.title')}
        subtitle={t('mySafety.subtitle')}
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Encrypted Records
          </span>
        }
      />

      {/* Understanding Map Overview Card */}
      {loadingProfile ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 text-xs sm:text-sm">
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            <span>Loading calibrated understanding map from secure safety engine...</span>
          </div>
        </div>
      ) : profileError ? (
        <div className="bg-white rounded-3xl border border-rose-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to load Understanding Profile</p>
              <p className="text-slate-600 text-xs mt-0.5">{profileError}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadProfile} icon={RefreshCw} iconPosition="left">
            Retry
          </Button>
        </div>
      ) : !profile?.baselineAssessmentCompleted ? (
        <div className="bg-gradient-to-r from-teal-50/80 via-slate-50 to-white rounded-3xl border border-teal-200/80 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Understanding Map Not Yet Calibrated</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                Take the short 5-minute baseline calibration assessment to map your understanding across all 6 core investor protection domains.
              </p>
            </div>
          </div>
          <Link to="/assessment" className="shrink-0 self-start sm:self-auto">
            <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
              Start Assessment
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <h2 className="text-lg font-bold text-slate-900">Calibrated Investor Understanding Map</h2>
              </div>
              <p className="text-xs text-slate-500">
                Your deterministic baseline map. Guides NiveshGuard across Validity Checks, Comparisons, and Learning.
              </p>
            </div>
            <Link to="/assessment">
              <Button variant="ghost" size="sm" icon={RefreshCw} iconPosition="left">
                Recalibrate
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ORDERED_TOPIC_KEYS.map((key) => {
              const topic = profile?.topicUnderstandings?.[key];
              const status = topic?.status || 'Not Assessed';
              const score = topic?.score !== undefined ? topic.score : 0;
              const title = topic?.topicTitle || key;

              return (
                <div key={key} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate" title={title}>
                      {title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeClass(status)}`}>
                      {status}
                    </span>
                  </div>
                  <ProgressBar progress={score} color={getProgressBarColor(status)} />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Score: {score}%</span>
                    <span>{topic?.misconceptions?.length || 0} misconceptions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Validity Checks Section */}
      <div>
        <SectionHeader
          title="Recent Claim Checks"
          description="Recent texts, brochures, and links you verified against regulatory repositories"
          action={
            <Link to="/validity-check" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              <span>Run New Check</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recentChecks.length > 0 ? (
            recentChecks.map((item) => {
              const badgeType =
                item.overallStatus === 'VERIFIED'
                  ? 'verified'
                  : item.overallStatus === 'CONTRADICTED'
                  ? 'alert'
                  : 'warning';

              const formattedDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent';

              return (
                <SafetyCard
                  key={item._id}
                  title={`Validity Check: ${item.inputType}`}
                  claim={item.extractedText}
                  source={`Mode: ${item.verificationMode}`}
                  date={formattedDate}
                  status={item.overallStatus.replace(/_/g, ' ')}
                  statusType={badgeType}
                  riskSignalsCount={item.topRiskSignals?.length || 0}
                  link={`/validity-check/result?id=${item._id}`}
                />
              );
            })
          ) : (
            <div className="col-span-full p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No validity checks conducted yet.</p>
              <Link to="/validity-check">
                <Button variant="outline" size="sm">
                  Verify an Investment Claim
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Safety Receipts Section */}
      <div>
        <SectionHeader
          title="Safety Receipts"
          description="Verifiable, timestamped summaries of claims and official sources checked"
          action={
            <Link to="/my-safety/receipts" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              <span>View All Receipts ({receiptsCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {receipts.length > 0 ? (
            receipts.slice(0, 2).map((receipt) => {
              const formattedDate = receipt.createdAt
                ? new Date(receipt.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <SafetyReceiptCard
                  key={receipt._id}
                  receiptNumber={receipt.receiptNumber}
                  date={formattedDate}
                  situation={receipt.situation}
                  claim={receipt.claim}
                  verificationStatus={receipt.verificationStatus}
                  statusType={receipt.statusType || 'warning'}
                  riskSignalsCount={receipt.riskSignalsCount || 0}
                  sourcesChecked={receipt.sourcesChecked || 0}
                  uncertaintyNote={receipt.uncertaintyNote}
                  nextSteps={
                    Array.isArray(receipt.nextSteps)
                      ? receipt.nextSteps.join(' • ')
                      : receipt.nextSteps || 'Review official regulatory registry.'
                  }
                  onViewReceipt={() => {}}
                />
              );
            })
          ) : (
            <div className="col-span-full p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-2">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No safety receipts generated yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Vault Section */}
      <div>
        <SectionHeader
          title="Evidence Vault"
          description="Secure repository of preserved screenshots, brochures, and transaction proofs"
          action={
            <Link to="/my-safety/evidence" className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1">
              <span>Open Vault ({evidenceCount} records)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {evidenceList.length > 0 ? (
            evidenceList.slice(0, 3).map((item) => (
              <EvidenceCard
                key={item._id}
                name={item.name}
                category={item.category}
                size={item.size || '1.0 MB'}
                uploadedDate={
                  item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recently'
                }
                relatedIncident={item.relatedIncidentId ? 'Incident Linked' : 'Individual Record'}
                relatedAnalysis={item.relatedAnalysisId ? 'Verification Linked' : null}
                description={item.description}
                tag={item.tag}
                onView={() => {}}
              />
            ))
          ) : (
            <div className="col-span-full p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-2">
              <FolderLock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No evidence items preserved yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Incident Protocol Banner */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-5 h-5 text-rose-700" />
            <h3 className="text-base sm:text-lg font-bold text-rose-900">
              Need to Report a Suspicious Situation?
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-rose-800/80 leading-relaxed">
            If you transferred funds to an unauthorized account, entered bank credentials on a lookalike site, or had your withdrawals blocked, access our structured step-by-step incident flow.
          </p>
        </div>

        <Link to="/incident" className="shrink-0">
          <button
            type="button"
            className="px-5 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Launch Incident Mode</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}
