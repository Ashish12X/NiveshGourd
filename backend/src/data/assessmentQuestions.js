// backend/src/data/assessmentQuestions.js

export const ASSESSMENT_VERSION = '1.0';

export const TOPIC_DOMAINS = {
  basicConcepts: {
    id: 'basicConcepts',
    label: 'Basic Investment Concepts',
    description: 'Fundamental mechanics of savings, capital growth, liquidity, and investment instruments.',
  },
  riskReturn: {
    id: 'riskReturn',
    label: 'Risk & Return',
    description: 'Understanding market volatility, capital preservation, downside risk, and realistic returns.',
  },
  fraudAwareness: {
    id: 'fraudAwareness',
    label: 'Fraud & Scam Awareness',
    description: 'Identifying fraudulent offers, high-yield investment programs (HYIPs), and pressure tactics.',
  },
  sourceVerification: {
    id: 'sourceVerification',
    label: 'Source Verification',
    description: 'Cross-checking regulatory registration, authentic websites, and legitimate payment channels.',
  },
  investorRights: {
    id: 'investorRights',
    label: 'Investor Rights',
    description: 'Knowing statutory investor protections, disclosure standards, and broker obligations.',
  },
  grievanceAwareness: {
    id: 'grievanceAwareness',
    label: 'Grievance Awareness',
    description: 'Escalation pathways, dispute resolution mechanisms (SCORES, SMART ODR), and remedial timelines.',
  },
};

/**
 * 12 Curated Questions (2 per domain: 1 Theory, 1 Practical)
 * Correct options and explanations reside ONLY on backend.
 */
export const ASSESSMENT_QUESTIONS = [
  // --- 1. Basic Investment Concepts ---
  {
    id: 'bc_01',
    topic: 'basicConcepts',
    type: 'theory',
    difficulty: 'basic',
    weight: 1,
    question: 'What is the primary financial distinction between a Bank Fixed Deposit and an Equity Mutual Fund?',
    description: 'Consider how capital preservation and market fluctuations apply to each product.',
    options: [
      { id: 'a', text: 'Both offer the same guaranteed fixed annual yield.' },
      { id: 'b', text: 'A Bank FD offers contractually fixed interest with DICGC insurance protection up to ₹5 lakh, whereas Equity Mutual Funds fluctuate with market performance and carry no guaranteed return.' },
      { id: 'c', text: 'Equity Mutual Funds are backed by the Reserve Bank of India against capital loss.' },
      { id: 'd', text: 'Bank Fixed Deposits can never be premature-withdrawn under any circumstances.' },
    ],
    correctOption: 'b',
    explanation: 'Bank deposits are insured up to ₹5 lakh by DICGC with fixed rates, whereas mutual fund units participate directly in equity markets without principal guarantees.',
  },
  {
    id: 'bc_02',
    topic: 'basicConcepts',
    type: 'practical',
    difficulty: 'basic',
    weight: 1.2,
    question: 'You have savings that you will need urgently in 3 months for medical or family obligations. Where is it safest to park this money?',
    description: 'Evaluate suitability based on investment horizon and liquidity needs.',
    options: [
      { id: 'a', text: 'In high-beta speculative small-cap stocks for a quick 3-month gain.' },
      { id: 'b', text: 'In liquid mutual funds, a short-term bank FD, or a savings bank account with instant liquidity.' },
      { id: 'c', text: 'In an unlisted real estate crowdfunding scheme with a 5-year lock-in.' },
      { id: 'd', text: 'In cryptocurrency futures contracts.' },
    ],
    correctOption: 'b',
    explanation: 'Short-term funds with immediate capital safety and liquidity requirements must never be exposed to volatile equity or illiquid alternative investments.',
  },

  // --- 2. Risk & Return ---
  {
    id: 'rr_01',
    topic: 'riskReturn',
    type: 'theory',
    difficulty: 'basic',
    weight: 1,
    question: 'Which of the following statements most accurately reflects the core relationship between investment risk and expected return?',
    description: 'Reflect on fundamental economic principles across regulated financial markets.',
    options: [
      { id: 'a', text: 'Legitimate investments can consistently guarantee high returns with zero risk of loss.' },
      { id: 'b', text: 'Higher potential returns inherently require accepting greater uncertainty, volatility, or risk of capital loss.' },
      { id: 'c', text: 'Risk only exists in foreign markets; domestic Indian investments carry no risk.' },
      { id: 'd', text: 'Risk completely disappears as long as you hold an asset for at least 30 days.' },
    ],
    correctOption: 'b',
    explanation: 'In financial economics, return is the compensation for bearing risk. No genuine asset class can deliver above-market returns without commensurate downside risk.',
  },
  {
    id: 'rr_02',
    topic: 'riskReturn',
    type: 'practical',
    difficulty: 'intermediate',
    weight: 1.2,
    question: 'A financial promoter presents a chart showing an investment that grew 40% every single month for the last year without a single down week. How should you interpret this?',
    description: 'Apply realistic market volatility expectations to advertised performance charts.',
    options: [
      { id: 'a', text: 'As proof of a revolutionary risk-free algorithmic breakthrough.' },
      { id: 'b', text: 'As an extreme warning sign; genuine market-linked assets experience fluctuating cycles, and unbroken upward linearity often indicates fabricated metrics or a Ponzi structure.' },
      { id: 'c', text: 'As an opportunity to invest your entire emergency fund immediately.' },
      { id: 'd', text: 'As standard performance for newly launched private investment desks.' },
    ],
    correctOption: 'b',
    explanation: 'Real market securities experience price discovery with volatility. Continuous straight-line high gains with zero drawdown are a classic hallmark of fabricated schemes.',
  },

  // --- 3. Fraud & Scam Awareness ---
  {
    id: 'fa_01',
    topic: 'fraudAwareness',
    type: 'theory',
    difficulty: 'basic',
    weight: 1,
    question: 'Under SEBI (Securities and Exchange Board of India) regulations, what is the legal rule regarding guaranteed returns in the stock market?',
    description: 'Identify statutory rules governing advisory and asset management entities in India.',
    options: [
      { id: 'a', text: 'Registered intermediaries are legally prohibited from promising or guaranteeing fixed returns on stock market investments.' },
      { id: 'b', text: 'Guaranteed returns are allowed if the advisor has a Telegram channel with over 10,000 members.' },
      { id: 'c', text: 'Any company registered under the Companies Act may guarantee 20% monthly returns.' },
      { id: 'd', text: 'Guarantees are permitted as long as payments are collected through UPI.' },
    ],
    correctOption: 'a',
    explanation: 'SEBI expressly forbids registered entities from assuring or guaranteeing fixed returns, as equity investments are subject to inherent market risk.',
  },
  {
    id: 'fa_02',
    topic: 'fraudAwareness',
    type: 'practical',
    difficulty: 'intermediate',
    weight: 1.2,
    question: 'You are added to a Telegram group called "Institutional VIP Wealth Club". The admin insists that an exclusive pre-market allocation closes in 2 hours and urges you to send money immediately. What should you do?',
    description: 'Recognize artificial urgency and unsolicited communication patterns.',
    options: [
      { id: 'a', text: 'Transfer a small token amount quickly before the timer expires.' },
      { id: 'b', text: 'Pause, do not send any money, recognize artificial urgency as a manipulative scam tactic, and exit or report the group.' },
      { id: 'c', text: 'Share the group link with friends to confirm if the opportunity is real.' },
      { id: 'd', text: 'Provide your bank account details so they can verify your eligibility.' },
    ],
    correctOption: 'b',
    explanation: 'High-pressure countdowns and artificial urgency are psychological manipulation tools used by scammers to bypass critical thinking and verification.',
  },

  // --- 4. Source Verification ---
  {
    id: 'sv_01',
    topic: 'sourceVerification',
    type: 'theory',
    difficulty: 'basic',
    weight: 1,
    question: 'Where can an Indian retail investor officially verify whether an individual or company is genuinely registered as a SEBI Research Analyst (RA) or Investment Adviser (IA)?',
    description: 'Identify the authoritative official regulatory verification portal.',
    options: [
      { id: 'a', text: 'On social media follower counters and YouTube verified checkmarks.' },
      { id: 'b', text: 'On the official SEBI website (sebi.gov.in) under the "Recognised Intermediaries" public registry directory.' },
      { id: 'c', text: 'By looking at user reviews on Google Play Store.' },
      { id: 'd', text: 'On private WhatsApp verification badges.' },
    ],
    correctOption: 'b',
    explanation: 'The official SEBI portal (sebi.gov.in) maintains a publicly searchable, authenticated directory of all licensed intermediaries and their registered status.',
  },
  {
    id: 'sv_02',
    topic: 'sourceVerification',
    type: 'practical',
    difficulty: 'intermediate',
    weight: 1.2,
    question: 'An investment platform instructing you to open an account asks you to transfer funds to a personal savings UPI handle ("rajesh.sharma@okaxis") instead of a corporate broker clearing account. What does this indicate?',
    description: 'Analyze legitimate institutional payment routing versus illicit diversion.',
    options: [
      { id: 'a', text: 'It is a common convenience practice designed to avoid exchange processing fees.' },
      { id: 'b', text: 'It is a critical red flag indicating an unregulated operation; legitimate brokers only route funds through registered corporate clearing escrow accounts.' },
      { id: 'c', text: 'It is an official tax-saving channel permitted under SEBI sandbox guidelines.' },
      { id: 'd', text: 'It is safe as long as you take a screenshot of the UPI transaction receipt.' },
    ],
    correctOption: 'b',
    explanation: 'SEBI-registered stockbrokers and AMCs never collect client investment funds in individual personal savings accounts or personal UPI addresses.',
  },

  // --- 5. Investor Rights ---
  {
    id: 'ir_01',
    topic: 'investorRights',
    type: 'theory',
    difficulty: 'basic',
    weight: 1,
    question: 'Which of the following is a fundamental statutory right granted to Indian stock market retail investors?',
    description: 'Recognize investor rights regarding transaction documentation and trade execution.',
    options: [
      { id: 'a', text: 'The right to receive an official Contract Note from the broker within 24 hours of trade execution detailing all trades, rates, and taxes.' },
      { id: 'b', text: 'The right to be compensated by the exchange for any losses sustained in voluntary trading.' },
      { id: 'c', text: 'The right to trade without having a registered PAN card or completing KYC verification.' },
      { id: 'd', text: 'The right to demand insider trading tips prior to corporate earnings releases.' },
    ],
    correctOption: 'a',
    explanation: 'Brokers are legally obligated to issue contract notes within 24 hours of executing trades, showing exact execution prices, brokerage, and statutory levies.',
  },
  {
    id: 'ir_02',
    topic: 'investorRights',
    type: 'practical',
    difficulty: 'intermediate',
    weight: 1.2,
    question: 'A relationship manager at your brokerage firm asks for your trading account login password and OTP so they can "manage trades profitably on your behalf." How should you respond?',
    description: 'Evaluate account security guidelines and power-of-attorney boundaries.',
    options: [
      { id: 'a', text: 'Share the credentials since the manager is an authorized employee of the registered broker.' },
      { id: 'b', text: 'Refuse immediately; brokers and their employees are strictly barred from demanding client passwords or OTPs, and discretionary trading without explicit authorization is illegal.' },
      { id: 'c', text: 'Provide the password but keep changing the PIN every weekend.' },
      { id: 'd', text: 'Agree, provided they sign an informal handwritten profit-sharing note.' },
    ],
    correctOption: 'b',
    explanation: 'Brokers and exchange rules prohibit sharing confidential login passwords or 2-factor OTPs with anyone, including brokerage relationship managers.',
  },

  // --- 6. Grievance Awareness ---
  {
    id: 'ga_01',
    topic: 'grievanceAwareness',
    type: 'theory',
    difficulty: 'basic',
    weight: 1,
    question: 'What is SCORES (scores.sebi.gov.in) in the context of the Indian securities market?',
    description: 'Identify the statutory dispute escalation platform.',
    options: [
      { id: 'a', text: 'A credit scoring agency that ranks personal loans and credit cards.' },
      { id: 'b', text: 'SEBI Complaints Redress System — a centralized online platform where investors can lodge grievances against registered entities if unresolved by the intermediary.' },
      { id: 'c', text: 'A social networking portal where investors vote on popular stocks.' },
      { id: 'd', text: 'A private trading algorithm that ranks broker performance scores.' },
    ],
    correctOption: 'b',
    explanation: 'SCORES is SEBI’s centralized web-based complaint redressal system designed to facilitate prompt redressal of retail investors’ legitimate grievances.',
  },
  {
    id: 'ga_02',
    topic: 'grievanceAwareness',
    type: 'practical',
    difficulty: 'intermediate',
    weight: 1.2,
    question: 'You notice unauthorized unauthorized deductions in your demat account charges. You lodged a complaint with your broker, but have received no response after 30 days. What is your proper escalation path?',
    description: 'Follow standard investor redressal escalation steps.',
    options: [
      { id: 'a', text: 'Post abusive messages on social media and tag random public accounts.' },
      { id: 'b', text: 'Escalate the complaint to SEBI SCORES 2.0 or initiate dispute resolution through the SMART ODR (Online Dispute Resolution) portal.' },
      { id: 'c', text: 'Accept the loss because broker contracts cannot be legally challenged.' },
      { id: 'd', text: 'Hire an unregulated private online recovery agent who promises to recover funds for an upfront fee.' },
    ],
    correctOption: 'b',
    explanation: 'If an intermediary fails to resolve a complaint within statutory timelines (30 days), investors can escalate directly through SEBI SCORES or SMART ODR for conciliation and arbitration.',
  },
];

/**
 * Strips confidential keys (correctOption, explanation, weight)
 * before returning question bank to frontend.
 */
export const getSanitizedQuestions = () => {
  return ASSESSMENT_QUESTIONS.map((q) => ({
    id: q.id,
    topic: q.topic,
    topicLabel: TOPIC_DOMAINS[q.topic]?.label || q.topic,
    type: q.type,
    difficulty: q.difficulty,
    question: q.question,
    description: q.description,
    options: q.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
    })),
  }));
};
