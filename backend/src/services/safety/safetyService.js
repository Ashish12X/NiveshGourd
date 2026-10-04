// backend/src/services/safety/safetyService.js
/**
 * SafetyService
 * 
 * Business logic for:
 * - Evidence Vault (CRUD, verification linking)
 * - Safety Receipts (generation from VerificationAnalysis or Incident, listing, retrieval)
 * - Incident Reporting (creation, safety guidance identification, official routing, receipt generation)
 * - Safety Hub summary data
 */

import EvidenceItem from '../../models/EvidenceItem.js';
import SafetyReceipt from '../../models/SafetyReceipt.js';
import Incident from '../../models/Incident.js';
import VerificationAnalysis from '../../models/VerificationAnalysis.js';

// Sensitive credential detection patterns to block accidental storage
const SENSITIVE_PATTERNS = [
  /\b(otp|one\s*time\s*password)\s*(is|code)?\s*[:=]?\s*\d{4,6}\b/i,
  /\b\d{4,6}\s*(is\s*your\s*otp|otp|one\s*time\s*password)\b/i,
  /\b(mpin|atm\s*pin|upi\s*pin)\s*[:=]?\s*\d{4,6}\b/i,
  /\bpassword\s*[:=]\s*[^\s,;]+/i,
];

export function scrubSensitiveInfo(text) {
  if (!text || typeof text !== 'string') return text;
  let scrubbed = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, '[REDACTED_SENSITIVE_CREDENTIAL]');
  }
  return scrubbed;
}

// -------------------------------------------------------------
// Official Guidance & Channels Mapping
// -------------------------------------------------------------
const OFFICIAL_CHANNELS_MAP = {
  'sent-money': [
    {
      name: 'National Cybercrime Reporting Portal & Helpline',
      identifier: 'Helpline 1930 / cybercrime.gov.in',
      action: 'Call 1930 immediately to freeze funds in transit across intermediate bank accounts (Golden Hour protocol).',
      badge: 'Immediate Emergency (Golden Hour)',
      urgency: 'Immediate',
    },
    {
      name: 'Your Bank Immediate Fraud Desk',
      identifier: 'Official Bank Helpline / Mobile Banking App',
      action: 'Block debit card, netbanking, or UPI handles associated with the fraudulent debit.',
      badge: 'Account Security',
      urgency: 'Immediate',
    },
  ],
  'withdrawal-blocked': [
    {
      name: 'SEBI SCORES 2.0 (SEBI Complaints Redress System)',
      identifier: 'scores.sebi.gov.in / 1800 22 7575',
      action: 'Check if platform is a SEBI-registered intermediary. If unregistered, report as illegal investment portal to cybercrime.gov.in.',
      badge: 'Statutory Capital Markets Redressal',
      urgency: 'High',
    },
    {
      name: 'National Cybercrime Reporting Portal',
      identifier: 'cybercrime.gov.in / 1930',
      action: 'Report fake trading platform withholding capital and demanding advance release tax.',
      badge: 'Cyber Fraud Reporting',
      urgency: 'High',
    },
  ],
  'suspicious-message': [
    {
      name: 'Chakshu (DoT Citizen Financial Cyber Fraud Reporting)',
      identifier: 'sancharsaathi.gov.in/sfc',
      action: 'Report suspicious SMS, WhatsApp, and Telegram fraudulent communication handles.',
      badge: 'Telecom Fraud Prevention',
      urgency: 'Standard',
    },
    {
      name: 'SEBI Investor Awareness & Vigilance',
      identifier: 'sebi.gov.in',
      action: 'Verify SEBI registration number of advisor or entity before any transaction.',
      badge: 'Statutory Verification',
      urgency: 'Standard',
    },
  ],
  'account-issue': [
    {
      name: 'Your Depository Participant / Bank Fraud Helpline',
      identifier: 'Official Customer Care / Branch',
      action: 'Request immediate freeze of Demat/Trading/Bank account for unauthorized activity.',
      badge: 'Immediate Defense',
      urgency: 'Immediate',
    },
    {
      name: 'National Cybercrime Reporting Portal',
      identifier: 'cybercrime.gov.in / 1930',
      action: 'Document unauthorized credential access or SIM-swap transaction.',
      badge: 'Cybercrime Redressal',
      urgency: 'High',
    },
  ],
  'help-with-complaint': [
    {
      name: 'SEBI SCORES 2.0',
      identifier: 'scores.sebi.gov.in',
      action: 'Lodge grievance against registered entity if no satisfactory response within 30 days.',
      badge: 'Statutory Capital Markets Redressal',
      urgency: 'Standard',
    },
    {
      name: 'SMART ODR Portal',
      identifier: 'smartodr.in',
      action: 'Initiate online conciliation and dispute resolution for securities market intermediaries.',
      badge: 'Online Dispute Resolution',
      urgency: 'Standard',
    },
  ],
  default: [
    {
      name: 'National Cybercrime Reporting Portal',
      identifier: 'cybercrime.gov.in / Helpline 1930',
      action: 'Report online financial misrepresentation, scam, or unlawful demand.',
      badge: 'Statutory Cyber Authority',
      urgency: 'Standard',
    },
    {
      name: 'SEBI Investor Helpdesk',
      identifier: '1800 22 7575 / sebi.gov.in',
      action: 'Inquire regarding regulatory status of market entities or advisory channels.',
      badge: 'Securities Market Regulator',
      urgency: 'Standard',
    },
  ],
};

const IMMEDIATE_SAFETY_GUIDANCE = {
  'sent-money': [
    'Do NOT send any additional money, "tax", or "security deposit" to recover the initial amount.',
    'Immediately call 1930 (National Cybercrime Helpline) to initiate bank account lien freezes.',
    'Take unedited screenshots of UPI transaction IDs, chats, and recipient bank details.',
    'Notify your bank within 3 days for maximum zero-liability protection under RBI guidelines.',
  ],
  'withdrawal-blocked': [
    'Do NOT pay any fee, commission, or "capital gains tax" demanded by the platform to release funds.',
    'Legitimate brokers deduct statutory taxes automatically or upon filing; they never demand advance deposit to unlock funds.',
    'Preserve all account statements, deposit receipts, and chat logs with platform representatives.',
  ],
  'suspicious-message': [
    'Do NOT click any unknown links or install APK / remote desktop applications (AnyDesk, TeamViewer).',
    'Do NOT share OTP, UPI PIN, or bank passwords with anyone claiming to be a broker or SEBI official.',
    'Verify the claims through official regulatory registries before engaging.',
  ],
  'account-issue': [
    'Contact your bank / broker immediately to freeze netbanking, UPI, and trading access.',
    'Change your email and trading account passwords from a separate, secure device.',
    'Check if your phone number has been ported or if unauthorized forwarding has been set up.',
  ],
  default: [
    'Stop further communication with the suspicious party.',
    'Preserve all messages, receipts, and correspondence without alteration.',
    'Never share security credentials, passwords, or OTPs.',
  ],
};

// -------------------------------------------------------------
// Evidence Vault Service
// -------------------------------------------------------------
export async function createEvidence({ userId, name, category, description, source, size, relatedAnalysisId, relatedIncidentId, metadata }) {
  if (!name || !name.trim()) {
    throw new Error('Evidence name is required.');
  }

  // Safety sanitization: block/redact credentials
  const cleanName = scrubSensitiveInfo(name.trim());
  const cleanDesc = scrubSensitiveInfo(description || '');
  const cleanSource = scrubSensitiveInfo(source || '');

  const doc = new EvidenceItem({
    userId,
    name: cleanName,
    category: category || 'Documents',
    size: size || '1.0 MB',
    description: cleanDesc,
    source: cleanSource,
    tag: relatedAnalysisId ? 'Verification Linked' : 'User Preserved',
    status: relatedAnalysisId ? 'VERIFIED_LINKED' : 'RECORDED',
    relatedAnalysisId: relatedAnalysisId || null,
    relatedIncidentId: relatedIncidentId || null,
    metadata: metadata || {},
  });

  return await doc.save();
}

export async function listEvidence({ userId, category, search, limit = 50, page = 1 }) {
  const query = { userId };
  if (category && category !== 'All') {
    query.category = category;
  }
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
      { source: { $regex: s, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    EvidenceItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    EvidenceItem.countDocuments(query),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getEvidenceById({ userId, evidenceId }) {
  const item = await EvidenceItem.findOne({ _id: evidenceId, userId }).lean();
  if (!item) {
    throw new Error('Evidence item not found or unauthorized.');
  }
  return item;
}

export async function deleteEvidence({ userId, evidenceId }) {
  const deleted = await EvidenceItem.findOneAndDelete({ _id: evidenceId, userId });
  if (!deleted) {
    throw new Error('Evidence item not found or unauthorized.');
  }
  return { success: true, message: 'Evidence item deleted.' };
}

// -------------------------------------------------------------
// Safety Receipt Service
// -------------------------------------------------------------
export async function createReceiptFromVerification({ userId, analysisId, situationNote }) {
  const analysis = await VerificationAnalysis.findOne({ _id: analysisId, userId }).lean();
  if (!analysis) {
    throw new Error('Verification record not found or unauthorized.');
  }

  const receiptNumber = `SR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // Determine status color type
  let statusType = 'warning';
  if (analysis.status === 'VERIFIED') statusType = 'success';
  else if (analysis.status === 'CONTRADICTED') statusType = 'danger';
  else if (analysis.status === 'INSUFFICIENT_EVIDENCE' || analysis.status === 'NOT_VERIFIED') statusType = 'warning';

  const riskSignals = (analysis.riskSignals || []).map((s) => (typeof s === 'string' ? s : s.type || s.description));
  const sources = (analysis.evidenceSources || []).map((s) => (typeof s === 'string' ? s : s.title || s.name || 'Official Reference'));

  const receipt = new SafetyReceipt({
    userId,
    receiptNumber,
    situation: situationNote || 'Claim assessed via NiveshGuard Validity Check',
    claim: analysis.inputText || analysis.claims?.[0]?.claimText || 'Verified investment claim',
    verificationStatus: analysis.status,
    statusType,
    riskSignalsCount: riskSignals.length,
    riskSignals,
    sourcesChecked: sources.length,
    sources,
    uncertaintyNote: analysis.uncertaintyNote || 'Heuristic analysis based on configured regulatory parameters.',
    nextSteps: analysis.nextSteps || [
      'Verify entity license on SEBI/RBI portal before transferring funds.',
      'Never send capital to personal UPI or crypto addresses.',
    ],
    relatedAnalysisId: analysis._id,
  });

  return await receipt.save();
}

export async function listSafetyReceipts({ userId, limit = 50, page = 1 }) {
  const skip = (Math.max(1, page) - 1) * limit;
  const [receipts, total] = await Promise.all([
    SafetyReceipt.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SafetyReceipt.countDocuments({ userId }),
  ]);

  return { receipts, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getSafetyReceiptById({ userId, receiptId }) {
  const receipt = await SafetyReceipt.findOne({ _id: receiptId, userId }).lean();
  if (!receipt) {
    throw new Error('Safety receipt not found or unauthorized.');
  }
  return receipt;
}

// -------------------------------------------------------------
// Incident Service
// -------------------------------------------------------------
export async function createIncident({ userId, category, title, details = {}, evidenceIds = [], verificationIds = [] }) {
  if (!category) throw new Error('Incident category is required.');

  const incidentNumber = `INC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const channels = OFFICIAL_CHANNELS_MAP[category] || OFFICIAL_CHANNELS_MAP.default;
  const guidance = IMMEDIATE_SAFETY_GUIDANCE[category] || IMMEDIATE_SAFETY_GUIDANCE.default;

  // Severity derivation
  let severity = 'medium';
  if (category === 'sent-money') severity = 'critical';
  else if (category === 'withdrawal-blocked' || category === 'account-issue') severity = 'high';
  else if (category === 'suspicious-message') severity = 'low';

  // Scrub sensitive details
  const cleanDetails = {
    amount: scrubSensitiveInfo(details.amount || ''),
    platform: scrubSensitiveInfo(details.platform || ''),
    occurredAt: details.occurredAt || new Date().toISOString().split('T')[0],
    utr: scrubSensitiveInfo(details.utr || ''),
    notes: scrubSensitiveInfo(details.notes || ''),
  };

  const incidentTitle = title && title.trim() ? scrubSensitiveInfo(title.trim()) : `Incident: ${category.replace(/-/g, ' ')}`;

  const incident = new Incident({
    userId,
    incidentNumber,
    category,
    title: incidentTitle,
    severity,
    status: 'DOCUMENTED',
    details: cleanDetails,
    immediateSafetyGuidance: guidance,
    officialChannels: channels,
    evidenceIds: evidenceIds || [],
    verificationIds: verificationIds || [],
  });

  const saved = await incident.save();

  // Automatically generate an associated SafetyReceipt for this incident documentation
  try {
    const receiptNumber = `SR-INC-${Date.now().toString().slice(-5)}`;
    const receipt = new SafetyReceipt({
      userId,
      receiptNumber,
      situation: `Incident Documented: ${category}`,
      claim: cleanDetails.platform ? `Platform/Counterparty: ${cleanDetails.platform}` : incidentTitle,
      verificationStatus: 'DOCUMENTED',
      statusType: severity === 'critical' || severity === 'high' ? 'danger' : 'warning',
      riskSignalsCount: 1,
      riskSignals: [category],
      sourcesChecked: channels.length,
      sources: channels.map((c) => c.name),
      uncertaintyNote: 'Self-reported incident documented for statutory referral and evidence preservation.',
      nextSteps: guidance.slice(0, 3),
      relatedIncidentId: saved._id,
    });
    const savedReceipt = await receipt.save();
    saved.safetyReceiptId = savedReceipt._id;
    await saved.save();
  } catch (err) {
    console.warn('Auto receipt creation for incident failed:', err.message);
  }

  return saved;
}

export async function listIncidents({ userId, limit = 50, page = 1 }) {
  const skip = (Math.max(1, page) - 1) * limit;
  const [incidents, total] = await Promise.all([
    Incident.find({ userId })
      .populate('evidenceIds', 'name category size status')
      .populate('safetyReceiptId', 'receiptNumber verificationStatus statusType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Incident.countDocuments({ userId }),
  ]);

  return { incidents, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getIncidentById({ userId, incidentId }) {
  const incident = await Incident.findOne({ _id: incidentId, userId })
    .populate('evidenceIds')
    .populate('verificationIds')
    .populate('safetyReceiptId')
    .lean();

  if (!incident) {
    throw new Error('Incident record not found or unauthorized.');
  }
  return incident;
}

export async function updateIncidentStatus({ userId, incidentId, status }) {
  const validStatuses = ['OPEN', 'DOCUMENTED', 'ACTION_RECOMMENDED', 'RESOLVED'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid incident status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const incident = await Incident.findOneAndUpdate(
    { _id: incidentId, userId },
    { $set: { status } },
    { new: true }
  );

  if (!incident) {
    throw new Error('Incident not found or unauthorized.');
  }
  return incident;
}

// -------------------------------------------------------------
// Safety Hub Unified Overview Service
// -------------------------------------------------------------
export async function getSafetyHubOverview({ userId }) {
  const [evidenceCount, receiptsCount, incidentsCount, recentReceipts, recentEvidence, recentIncidents] =
    await Promise.all([
      EvidenceItem.countDocuments({ userId }),
      SafetyReceipt.countDocuments({ userId }),
      Incident.countDocuments({ userId }),
      SafetyReceipt.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
      EvidenceItem.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
      Incident.find({ userId }).sort({ createdAt: -1 }).limit(3).lean(),
    ]);

  return {
    summary: {
      evidenceCount,
      receiptsCount,
      incidentsCount,
    },
    recentReceipts,
    recentEvidence,
    recentIncidents,
  };
}
