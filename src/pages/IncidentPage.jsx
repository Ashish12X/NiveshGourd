// src/pages/IncidentPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertOctagon,
  ShieldCheck,
  CreditCard,
  MessageSquareWarning,
  Lock,
  ShieldAlert,
  HelpCircle,
  FileText,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Info,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { incidentCategories, incidentFlowSteps, officialChannels } from '../data/mockIncidents';
import { createIncidentReport, fetchIncidents } from '../services/safetyApi';

export default function IncidentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [incidentDetails, setIncidentDetails] = useState({
    amount: '',
    platform: '',
    occurredAt: new Date().toISOString().split('T')[0],
    utr: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdIncident, setCreatedIncident] = useState(null);

  // Past user incidents list
  const [pastIncidents, setPastIncidents] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  useEffect(() => {
    loadPastIncidents();
  }, []);

  const loadPastIncidents = async () => {
    try {
      setLoadingPast(true);
      const res = await fetchIncidents(1, 5);
      setPastIncidents(res.incidents || []);
    } catch (err) {
      console.warn('Could not load past incidents:', err.message);
    } finally {
      setLoadingPast(false);
    }
  };

  const categoryIcons = {
    'suspicious-message': MessageSquareWarning,
    'sent-money': CreditCard,
    'withdrawal-blocked': Lock,
    'account-issue': ShieldAlert,
    'think-scammed': HelpCircle,
    'help-with-complaint': FileText,
    'something-else': AlertOctagon,
  };

  const activeCategoryObj = incidentCategories.find((c) => c.id === selectedCategory);

  const handleFinishAndSave = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const incident = await createIncidentReport({
        category: selectedCategory,
        title: activeCategoryObj ? activeCategoryObj.title : 'Incident Report',
        details: incidentDetails,
      });

      setCreatedIncident(incident);
      loadPastIncidents();
    } catch (err) {
      setSubmitError(err.message || 'Failed to record incident report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setCurrentStep(1);
    setCreatedIncident(null);
    setIncidentDetails({
      amount: '',
      platform: '',
      occurredAt: new Date().toISOString().split('T')[0],
      utr: '',
      notes: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={t('incident.title')}
        subtitle={t('incident.subtitle')}
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            Confidential Incident Support
          </span>
        }
      />

      {/* Immediate Reassurance Banner */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-5 sm:p-6 flex items-start gap-4 text-teal-950">
        <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <strong className="text-base font-bold text-teal-950 block">
            You are not at fault.
          </strong>
          <p className="leading-relaxed">
            Modern financial cyber fraud employs sophisticated psychological urgency and forged regulatory identities. Take a deep breath: following systematic recovery protocols right now gives you the best foundation.
          </p>
        </div>
      </div>

      {/* Success View after creating incident */}
      {createdIncident ? (
        <div className="bg-white rounded-3xl border border-teal-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                Incident Documented: #{createdIncident.incidentNumber}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Action Plan & Evidence Preserved
              </h2>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <p className="text-slate-700">
              Your incident summary and associated <strong>Safety Receipt</strong> have been safely generated in your private account.
            </p>
            <p className="text-slate-500">
              <strong>Notice:</strong> Documenting here organizes your evidence. To initiate legal prosecution or bank account freezes, proceed directly to the designated official statutory channels below.
            </p>
          </div>

          {/* Immediate Steps Checklist */}
          {createdIncident.immediateSafetyGuidance && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Immediate Recommended Safety Steps</h3>
              <div className="space-y-2">
                {createdIncident.immediateSafetyGuidance.map((step, idx) => (
                  <div key={idx} className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl text-xs text-teal-950 flex items-start gap-2.5">
                    <span className="font-bold text-teal-700 shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Channels to Contact */}
          {createdIncident.officialChannels && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Contact Official Authorities Directly</h3>
              <div className="space-y-3">
                {createdIncident.officialChannels.map((channel, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{channel.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                        {channel.badge || channel.urgency}
                      </span>
                    </div>
                    <div className="font-mono text-teal-800 font-semibold">{channel.identifier}</div>
                    <p className="text-slate-600">{channel.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Link to="/my-safety/receipts">
                <Button variant="outline" size="sm">
                  View Safety Receipts
                </Button>
              </Link>
              <Link to="/my-safety/evidence">
                <Button variant="outline" size="sm">
                  Go to Evidence Vault
                </Button>
              </Link>
            </div>
            <Button variant="primary" size="sm" onClick={handleReset}>
              Document Another Situation
            </Button>
          </div>
        </div>
      ) : !selectedCategory ? (
        /* Screen 1: Select What Happened */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            What describes your current situation best?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {incidentCategories.map((item) => {
              const Icon = categoryIcons[item.id] || AlertOctagon;
              const isCrit = item.severity === 'critical';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(item.id);
                    setCurrentStep(1);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-150 flex items-start gap-3.5 hover:shadow-xs cursor-pointer ${
                    isCrit
                      ? 'border-rose-200/90 bg-rose-50/20 hover:bg-rose-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCrit ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-semibold mt-2 px-2 py-0.5 rounded ${
                        isCrit
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.urgencyText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Past Incidents Section */}
          {pastIncidents.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Previously Documented Incidents ({pastIncidents.length})
              </h3>
              <div className="space-y-2">
                {pastIncidents.map((inc) => (
                  <div
                    key={inc._id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 mr-2">
                        #{inc.incidentNumber}
                      </span>
                      <span className="text-slate-600 font-medium">{inc.title}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-200 text-slate-700">
                      {inc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Screen 2: 5-Step Guided Incident Protocol */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Step Indicator Bar */}
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 mb-1 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Issue Type
              </button>
              <h2 className="text-lg font-bold text-slate-900">
                {activeCategoryObj?.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {incidentFlowSteps.map((step) => (
                <div
                  key={step.step}
                  onClick={() => setCurrentStep(step.step)}
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                    currentStep === step.step
                      ? 'bg-slate-900 text-white'
                      : currentStep > step.step
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step.step}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Stepper Content */}
          <div className="min-h-[220px]">
            {/* Step 1: What Happened */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Step 1: Clarify what happened
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provide brief context. Mention who initiated contact, what platforms were involved, and what promises were made.
                </p>
                <textarea
                  rows={4}
                  value={incidentDetails.notes}
                  onChange={(e) => setIncidentDetails({ ...incidentDetails, notes: e.target.value })}
                  placeholder="e.g. Received unsolicited WhatsApp message offering 35% weekly returns. Was directed to deposit money to an individual UPI address..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-800 text-slate-800"
                />
              </div>
            )}

            {/* Step 2: Preserve Evidence */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Step 2: Preserve Digital Evidence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-800 block">Screenshots</span>
                    <p className="text-slate-500">Capture chats, Telegram handles, web URLs, and deposit confirmation screens.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                    <span className="font-bold text-slate-800 block">Payment Proofs</span>
                    <p className="text-slate-500">Save bank SMS, UPI transaction IDs, and passbook debit lines.</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>Important:</strong> Do not crop out dates, sender phone numbers, or account VPAs.
                </div>
              </div>
            )}

            {/* Step 3: Record Important Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Step 3: Key Financial Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Approximate Amount Involved (INR):
                    </label>
                    <input
                      type="text"
                      value={incidentDetails.amount}
                      onChange={(e) => setIncidentDetails({ ...incidentDetails, amount: e.target.value })}
                      placeholder="e.g. ₹50,000"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Date of Transaction:
                    </label>
                    <input
                      type="date"
                      value={incidentDetails.occurredAt}
                      onChange={(e) => setIncidentDetails({ ...incidentDetails, occurredAt: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      UPI Reference / UTR Number:
                    </label>
                    <input
                      type="text"
                      value={incidentDetails.utr}
                      onChange={(e) => setIncidentDetails({ ...incidentDetails, utr: e.target.value })}
                      placeholder="e.g. 439281729012"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Platform / Counterparty Handle:
                    </label>
                    <input
                      type="text"
                      value={incidentDetails.platform}
                      onChange={(e) => setIncidentDetails({ ...incidentDetails, platform: e.target.value })}
                      placeholder="e.g. VIP Forex Desk / user@okhdfcbank"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Identify Relevant Official Channel */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Step 4: Designated Official Statutory Channels
                </h3>
                <p className="text-xs text-slate-600">
                  NiveshGuard routes you to the appropriate statutory body based on your situation:
                </p>

                <div className="space-y-3">
                  {officialChannels.map((channel, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-slate-900">{channel.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                          {channel.badge}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-teal-800">
                        {channel.identifier}
                      </div>
                      <p className="text-xs text-slate-600">
                        <strong>Action:</strong> {channel.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Review & Save */}
            {currentStep === 5 && (
              <div className="space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                  <h4 className="font-bold text-teal-950 text-sm mb-1">
                    Structured Action Plan Ready
                  </h4>
                  <p className="text-teal-900 text-xs">
                    Clicking "Save & Generate Safety Plan" will document your incident in your account and generate a linked Safety Receipt.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <h5 className="font-bold text-slate-800">Critical Immediate Protocols:</h5>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                    <li>Call <strong>1930</strong> (National Cybercrime Helpline) immediately if funds were sent recently.</li>
                    <li>Notify your bank with the UTR number: <strong>{incidentDetails.utr || 'N/A'}</strong>.</li>
                    <li>Never pay additional "clearance tax" or "anti-money-laundering verification" unlock fees.</li>
                    <li>Keep all chat transcripts safely in your Evidence Vault.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            {currentStep < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                icon={ArrowRight}
                iconPosition="right"
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="teal"
                size="md"
                onClick={handleFinishAndSave}
                disabled={submitting}
                icon={submitting ? Loader2 : CheckCircle2}
                iconPosition="left"
              >
                {submitting ? 'Recording Incident...' : 'Save & Generate Safety Plan'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
