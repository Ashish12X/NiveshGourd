// src/data/mockIncidents.js

export const incidentCategories = [
  {
    id: "suspicious-message",
    title: "I received a suspicious message",
    subtitle: "Unsolicited tip, job offer, or high-return proposal",
    icon: "MessageSquareWarning",
    severity: "low",
    urgencyText: "Preventive action — no money sent yet",
  },
  {
    id: "sent-money",
    title: "I sent money",
    subtitle: "Transferred funds via UPI, IMPS, or bank transfer to a suspicious party",
    icon: "CreditCard",
    severity: "critical",
    urgencyText: "Golden Hour protocol active — every minute counts",
  },
  {
    id: "withdrawal-blocked",
    title: "My withdrawal is blocked",
    subtitle: "Trading platform is asking for extra 'tax' or fees to release capital",
    icon: "Lock",
    severity: "high",
    urgencyText: "Do not send additional unlock fees",
  },
  {
    id: "account-issue",
    title: "My account has an issue",
    subtitle: "Demat or bank account shows unrecognized transactions or login attempts",
    icon: "ShieldAlert",
    severity: "high",
    urgencyText: "Immediate account freeze recommended",
  },
  {
    id: "think-scammed",
    title: "I think I may have been scammed",
    subtitle: "Unsure if a scheme was legitimate, lost contact with advisor",
    icon: "HelpCircle",
    severity: "high",
    urgencyText: "Evidence capture & guided triage",
  },
  {
    id: "help-with-complaint",
    title: "I need help with a complaint",
    subtitle: "Registered broker, advisor, or bank failed to resolve an issue within 30 days",
    icon: "FileText",
    severity: "medium",
    urgencyText: "Regulatory escalation pathway (SCORES / RBI Ombudsman)",
  },
  {
    id: "something-else",
    title: "Something else happened",
    subtitle: "Describe your situation in your own words",
    icon: "AlertOctagon",
    severity: "medium",
    urgencyText: "Structured safe diagnostic",
  },
];

export const incidentFlowSteps = [
  {
    step: 1,
    title: "What happened?",
    description: "Clarify the situation without blame or stress.",
  },
  {
    step: 2,
    title: "Preserve evidence",
    description: "Capture unedited screenshots, transaction IDs, and sender details.",
  },
  {
    step: 3,
    title: "Record important details",
    description: "Note timestamps, amounts, bank names, and payment handles.",
  },
  {
    step: 4,
    title: "Identify relevant official channel",
    description: "Match with the specific statutory authority (1930, SEBI, or RBI).",
  },
  {
    step: 5,
    title: "Prepare next steps",
    description: "Draft your formal statement and review protective actions.",
  },
];

export const officialChannels = [
  {
    name: "National Cybercrime Reporting Portal & Helpline",
    identifier: "Helpline 1930 / cybercrime.gov.in",
    bestFor: "Financial cyber fraud, unauthorized UPI transfers, impersonation scams",
    action: "Call 1930 immediately to freeze funds in transit across intermediate bank accounts.",
    badge: "Immediate Emergency (Golden Hour)",
    color: "rose",
  },
  {
    name: "SEBI SCORES 2.0 (SEBI Complaints Redress System)",
    identifier: "scores.sebi.gov.in / 1800 22 7575",
    bestFor: "Grievances against registered stockbrokers, mutual funds, listed companies, depository participants",
    action: "File online with broker account number and formal correspondence records.",
    badge: "Statutory Capital Markets Redressal",
    color: "blue",
  },
  {
    name: "RBI Complaint Management System & Ombudsman",
    identifier: "cms.rbi.org.in / 14448",
    bestFor: "Bank fraud, unauthorized debit cards/netbanking, unauthorized lending apps",
    action: "Lodge after 30 days if your bank fails to resolve your written complaint satisfactorily.",
    badge: "Banking & Payment System Escalation",
    color: "teal",
  },
  {
    name: "SMART ODR Portal (Securities Market Online Dispute Resolution)",
    identifier: "smartodr.in",
    bestFor: "Online conciliation and arbitration for disputes between investors and registered market intermediaries",
    action: "Initiate digital dispute resolution after SCORES review.",
    badge: "Independent Institutional Mediation",
    color: "indigo",
  },
  {
    name: "National Consumer Helpline (NCH)",
    identifier: "1915 / consumerhelpline.gov.in",
    bestFor: "Deficiency in commercial service or misleading commercial advertisements",
    action: "Register pre-litigation consumer grievance ticket.",
    badge: "Consumer Protection",
    color: "slate",
  },
];
