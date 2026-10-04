// src/data/mockAnalyses.js

export const mockVerificationResult = {
  id: "chk_sangyan_8921",
  checkDate: "2026-10-02 19:42 IST",
  status: "Needs verification",
  statusType: "warning", // warning | alert | verified | info
  riskLevel: "High-risk signals detected",
  riskScore: 78, // out of 100
  claim: "Guaranteed 25% monthly return via exclusive algorithmic institutional pool",
  source: "Unverified Telegram Channel ('Alpha High Yield VIP Desk')",
  submittedInput: "Hi sir, join our SEBI approved VIP group today! Guaranteed 25% profit every month with 100% capital protection. Only 3 slots left. Click here to deposit via UPI or DM admin directly.",
  evidenceSummary: "Unable to find reliable official regulatory evidence supporting the claim. In Indian financial markets, fixed return assurances on market-linked securities are legally impermissible for registered entities.",
  
  riskSignals: [
    {
      title: "Guaranteed Return Language",
      description: "Promises fixed 25% monthly yield. In regulated markets, return fluctuates with risk. No registered intermediary can promise guaranteed returns.",
      severity: "critical",
    },
    {
      title: "Artificial Urgency & Scarcity",
      description: "Claims 'Only 3 slots left today' to induce quick emotional action before independent verification can take place.",
      severity: "high",
    },
    {
      title: "Unverified Regulatory Credentials",
      description: "Mentioned 'SEBI approved' without providing a verifiable 12-character SEBI Registration Code (e.g., INH/INA/INZ) or corporate entity name.",
      severity: "high",
    },
    {
      title: "Private Messaging & Unofficial Gateway",
      description: "Instructions to direct-message an anonymous administrator and transfer funds via personal UPI IDs rather than institutional escrow.",
      severity: "critical",
    },
  ],

  uncertaintyStatement: "We could not independently verify the physical identity, jurisdiction, or legal standing of the account administrator. The assessment reflects observable linguistic, structural, and regulatory signals rather than definitive forensic certainty.",

  expandableSections: [
    {
      id: "why-sangyan-said-this",
      title: "Why did SANGYAN say this?",
      content: "Legitimate investment entities registered with SEBI or RBI are strictly prohibited under Section 12A of the SEBI Act from advertising guaranteed high yields or misrepresenting regulatory sanction. The yield claimed (25% per month compounded) would theoretically exceed 1300% annualized, which defies fundamental financial economics.",
      keyPoints: [
        "Annualized return claimed is mathematically inconsistent with capital preservation.",
        "SEBI circulars explicitly prohibit promises of assured returns.",
        "Payment routing directs to unmonitored individual accounts.",
      ]
    },
    {
      id: "what-should-i-verify",
      title: "What should I verify?",
      content: "Before sending any capital or sharing KYC documents, demand these specific verifiable items:",
      keyPoints: [
        "Official 12-character SEBI Registration Number.",
        "Exact corporate name as registered on Ministry of Corporate Affairs (MCA).",
        "Registered bank current account in the company's full legal name.",
        "Formal risk disclosure document signed by a licensed compliance officer.",
      ]
    },
    {
      id: "sources-consulted",
      title: "Regulatory & Official Sources",
      content: "Cross-referenced against standard regulatory frameworks and alert lists:",
      keyPoints: [
        "SEBI Master Circular on Unsolicited Financial Advice and Guaranteed Yields (SEBI/HO/MIRSD).",
        "RBI Alert List of Unauthorized Forex & Trading Platforms (sachet.rbi.org.in).",
        "Indian Cybercrime Coordination Centre (I4C) Advisory on VIP Messaging Groups.",
      ]
    },
    {
      id: "what-happens-next",
      title: "What happens next?",
      content: "If you have not transferred money, simply do not proceed and mute/report the channel. If you have already transferred money or shared bank OTPs, switch immediately to SANGYAN Incident Mode to preserve evidence and dial National Cybercrime Helpline 1930.",
      keyPoints: [
        "Do not transfer 'verification' or 'tax' fees to unlock funds.",
        "Take timestamped screenshots of full chat history with sender phone numbers.",
        "Save this assessment as a verifiable Safety Receipt.",
      ]
    }
  ],

  receiptNumber: "SR-2026-0892",
  suggestedAction: "Pause interaction. Cross-verify credentials before taking any financial action."
};
