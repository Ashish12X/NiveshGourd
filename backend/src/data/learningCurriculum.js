// backend/src/data/learningCurriculum.js
/**
 * Authoritative Stage 6 Investor Learning Curriculum
 *
 * Mapped to the 6 core investor protection domains:
 *   1. basicConcepts
 *   2. riskReturn
 *   3. fraudAwareness
 *   4. sourceVerification
 *   5. investorRights
 *   6. grievanceAwareness
 *
 * All regulatory rules, statutory timelines, and official portals cite genuine Indian regulatory frameworks:
 *   - SEBI (Securities and Exchange Board of India Act, 1992)
 *   - RBI (Reserve Bank of India Act / Sachet portal)
 *   - AMFI (Association of Mutual Funds in India)
 *   - SCORES (SEBI Complaints Redress System)
 *   - SMART ODR (Securities Market Approach for Resolution Through ODR)
 *
 * No fake URLs, no fabricated returns, no stock picking advice.
 */

export const INITIAL_CURRICULUM = [
  // ── 1. sourceVerification: Verify Before You Trust ─────────────────────────
  {
    topicId: 'verify-before-you-trust',
    domain: 'sourceVerification',
    title: 'Verify Before You Trust: Validating Financial Intermediaries',
    shortDescription: 'How to check official SEBI and RBI registries before transferring a single rupee to any broker, advisor, or app.',
    learningObjective: 'Empower investors to independently cross-check regulatory registration numbers (INH/INA/INZ) on official government portals rather than trusting social media credentials.',
    difficulty: 'Fundamental',
    estimatedMinutes: 5,
    sections: [
      {
        heading: '1. Why Registration Numbers Matter',
        explanation: 'In India, any entity offering stock broking, investment advice, or portfolio management must be legally registered with SEBI. A genuine entity will always hold an active registration code: INZ for stockbrokers, INA for investment advisers, and INH for research analysts.',
        example: 'A WhatsApp message claims "ABC Capital is SEBI Approved." A registered advisor will provide a verifiable code like INA000012345.',
        warning: 'Fraudulent channels frequently forge PDF certificates displaying the SEBI national emblem or fake registration numbers.',
      },
      {
        heading: '2. How to Cross-Check on the Official SEBI Portal',
        explanation: 'Never use links sent via WhatsApp, SMS, or Telegram to verify an intermediary. Go directly to sebi.gov.in -> Intermediaries -> Recognized Intermediaries. Search by the legal registered company name or registration code. Confirm that the listed official email domain and office address match where your communications originate.',
        example: 'If the SEBI portal shows "abc@registeredfirm.com", but the advisor contacts you from a personal Gmail or Telegram ID, it is an impersonation.',
        warning: 'Registered intermediaries are legally required to accept funds ONLY in registered company bank current accounts, NEVER in individual personal UPI accounts.',
      },
      {
        heading: '3. Checking Unsolicited Lending & Deposit Apps with RBI',
        explanation: 'For lending apps, deposit schemes, or forex platforms, the primary regulator is RBI. RBI maintains the Sachet portal (sachet.rbi.org.in), which publishes lists of unauthorized entities and alert lists of illegal forex/trading platforms.',
        example: 'Before depositing savings into an online app offering 18% annual fixed yield, check if the NBFC is listed under RBI-registered deposit-taking NBFCs.',
        warning: 'Peer-to-peer (P2P) platforms or unregistered offshore apps operating without RBI licenses are not covered by investor protection funds.',
      },
    ],
    keyTakeaways: [
      'Genuine SEBI advisors have codes: INZ (Brokers), INA (Advisers), INH (Research Analysts).',
      'Always verify directly on sebi.gov.in, never on verification links provided by the seller.',
      'Official bank accounts must be in the corporate legal name, never personal UPI IDs.',
      'RBI Sachet (sachet.rbi.org.in) lists unauthorized entities and illegal forex platforms.',
    ],
    comprehensionQuestions: [
      {
        questionId: 'cq_sv_01',
        question: 'An investment channel admin shares a photo of a "SEBI Certificate" and asks you to transfer ₹10,000 to an individual UPI handle. What is the most reliable way to verify their legitimacy?',
        options: [
          {
            id: 'a',
            text: 'Accept the photo as valid proof since it displays the official SEBI logo.',
            isCorrect: false,
            explanation: 'Logos and certificates are easily fabricated using graphic editing tools.',
            misconceptionSignal: 'TRUSTS_VISUAL_CREDENTIALS',
          },
          {
            id: 'b',
            text: 'Go independently to sebi.gov.in, search their registration number, and check if bank details match the registered firm.',
            isCorrect: true,
            explanation: 'Checking official government registries independently without relying on seller-provided links is the only foolproof verification method.',
          },
          {
            id: 'c',
            text: 'Ask the group members on Telegram if they have received their returns.',
            isCorrect: false,
            explanation: 'Group members in unauthorized channels are frequently coordinated accomplices or fake bot accounts.',
            misconceptionSignal: 'RELIES_ON_SOCIAL_PROOF',
          },
        ],
        learningTip: 'Never trust photos or links sent by the seller. Independent verification on sebi.gov.in is mandatory.',
      },
    ],
    practicalScenarios: [
      {
        scenarioId: 'ps_sv_01',
        title: 'The High-Yield VIP Advisory Invite',
        situation: 'Rohan receives an invitation to a Telegram channel called "Institutional Wealth Matrix (SEBI Regd)". The admin offers daily equity options recommendations with 95% accuracy and asks for a quarterly subscription fee of ₹7,500 transferred to rohan.advisor@okaxis.',
        question: 'What immediate action should Rohan take?',
        options: [
          {
            id: 'a',
            text: 'Pay the fee quickly because quarterly pricing is discounted.',
            isCorrect: false,
            explanation: 'Transferring money without verification is the most common cause of financial loss.',
            misconceptionSignal: 'FEAR_OF_MISSING_OUT',
          },
          {
            id: 'b',
            text: 'Refuse payment. Demand their SEBI INA/INH registration number, verify it on sebi.gov.in, and confirm that fee payment is directed to an institutional bank account.',
            isCorrect: true,
            explanation: 'Demanding the registration number and checking on sebi.gov.in ensures complete statutory transparency.',
          },
          {
            id: 'c',
            text: 'Try with a 1-week trial first by paying ₹1,000.',
            isCorrect: false,
            explanation: 'Small trial payments still expose UPI credentials and validate the victim for further social engineering.',
            misconceptionSignal: 'BELIEVES_TRIAL_AMOUNTS_ARE_SAFE',
          },
        ],
        reflectionNote: 'Registered analysts will always have their credentials published on official regulatory portals and never mandate UPI payments to personal accounts.',
      },
    ],
    misconceptionTargets: [
      'TRUSTS_VISUAL_CREDENTIALS',
      'RELIES_ON_SOCIAL_PROOF',
      'BELIEVES_TRIAL_AMOUNTS_ARE_SAFE',
    ],
    prerequisites: [],
    nextTopics: ['recognizing-guaranteed-return-myths', 'spotting-telegram-task-scams'],
    officialSources: [
      {
        name: 'SEBI Recognized Intermediaries Portal',
        url: 'https://www.sebi.gov.in',
        description: 'Official database of all licensed brokers, advisors, and investment institutions in India.',
      },
      {
        name: 'RBI Sachet Portal',
        url: 'https://sachet.rbi.org.in',
        description: 'RBI regulatory alert portal for public warnings against unapproved financial schemes.',
      },
    ],
    active: true,
  },

  // ── 2. riskReturn: Recognizing Guaranteed Return Myths ─────────────────────
  {
    topicId: 'recognizing-guaranteed-return-myths',
    domain: 'riskReturn',
    title: 'The Truth About Risk: Why Guaranteed High Returns Are a Myth',
    shortDescription: 'Understanding the fundamental risk-return tradeoff and SEBI legal restrictions on assured yields.',
    learningObjective: 'Understand why no market-linked security can guarantee fixed returns, and recognize assured yield claims as an immediate regulatory red flag.',
    difficulty: 'Fundamental',
    estimatedMinutes: 5,
    sections: [
      {
        heading: '1. The Universal Risk-Return Tradeoff',
        explanation: 'In real economic markets, higher potential returns inherently require taking on greater possibility of loss or volatility. Risk-free assets like Government Treasury Bills or RBI Sovereign Bonds set the baseline yield in India (historically around 6.5% - 7.5% per annum). Any investment offering returns substantially above this rate without downside risk is economically impossible.',
        example: 'If Indian sovereign bonds yield 7% yearly, an offer claiming 3% to 5% monthly (36% to 60% yearly) carries either immense speculative risk or is a fraudulent Ponzi construct.',
        warning: 'Inflation-beating returns require patience and market risk tolerance; there are no shortcuts.',
      },
      {
        heading: '2. The Legal Reality Under SEBI Regulations',
        explanation: 'Under SEBI regulations (including the SEBI Prohibition of Fraudulent and Unfair Trade Practices Regulations), registered market intermediaries are strictly prohibited from promising, guaranteeing, or assuring any fixed returns on equity, derivatives, or mutual fund products.',
        example: 'Even top mutual fund houses cannot assure that a fund will generate 12% next year. They must state: "Mutual funds are subject to market risks."',
        warning: 'Any entity stating "100% Capital Protection with 25% Fixed Monthly Gain" is operating outside Indian law.',
      },
      {
        heading: '3. How Ponzi and Pyramid Schemes Emulate Returns',
        explanation: 'Schemes promising guaranteed high returns often pay initial "dividends" using money deposited by newer investors, creating an illusion of high profits. When fresh inflows cease, the organizers freeze withdrawals and vanish.',
        example: 'A friend shows you an app showing ₹50,000 profit from ₹1 lakh invested last month. That paper profit cannot be withdrawn when the scheme collapses.',
        warning: 'Paper profits inside an unverified app or dashboard do not represent real assets.',
      },
    ],
    keyTakeaways: [
      'In India, risk-free baseline rates are ~7% per year (RBI sovereign bonds / bank FDs).',
      'SEBI strictly bans registered market intermediaries from assuring fixed returns on equities.',
      'Guaranteed returns on market-linked securities are legally prohibited in regulated markets.',
      'Paper profits on private app dashboards are frequently manipulated in Ponzi schemes.',
    ],
    comprehensionQuestions: [
      {
        questionId: 'cq_rr_01',
        question: 'Under Indian securities regulations, can a SEBI-registered portfolio manager or broker legally guarantee a fixed 20% annual return on an equity portfolio?',
        options: [
          {
            id: 'a',
            text: 'Yes, provided they submit an affidavit to SEBI.',
            isCorrect: false,
            explanation: 'SEBI regulations contain no provision for guaranteeing equity returns under any affidavit.',
            misconceptionSignal: 'BELIEVES_EXCEPTIONS_EXIST_FOR_GUARANTEES',
          },
          {
            id: 'b',
            text: 'No. SEBI regulations strictly prohibit promising or guaranteeing returns on market-linked products.',
            isCorrect: true,
            explanation: 'Market returns fluctuate with economic conditions; guaranteed returns on market-linked products are illegal under SEBI regulations.',
          },
          {
            id: 'c',
            text: 'Yes, but only for investments exceeding ₹50 lakh.',
            isCorrect: false,
            explanation: 'Even Portfolio Management Services (PMS) with ₹50 lakh minimums cannot legally assure fixed yields.',
            misconceptionSignal: 'HIGH_NET_WORTH_EXCEPTION_MISCONCEPTION',
          },
        ],
        learningTip: 'No registered entity in India has the legal authority to guarantee market-linked equity yields.',
      },
    ],
    practicalScenarios: [
      {
        scenarioId: 'ps_rr_01',
        title: 'The College Fee Fund Dilemma',
        situation: 'Sunita has ₹1,00,000 saved for her son\'s university admission due in 60 days. A colleague urges her to put it into a private "smart automated crypto-equity arbitrage pool" that promises "Guaranteed 12% return in 45 days with zero risk of capital loss."',
        question: 'What is Sunita\'s safest and most rational decision?',
        options: [
          {
            id: 'a',
            text: 'Invest ₹50,000 to earn enough profit to buy her son a new laptop, leaving ₹50,000 in the bank.',
            isCorrect: false,
            explanation: 'Short-term critical goal money should never be placed in speculative or unverified schemes.',
            misconceptionSignal: 'PARTIAL_RISK_FALLACY',
          },
          {
            id: 'b',
            text: 'Keep the entire ₹1,00,000 in a safe bank account or short-term liquid instrument, and decline the scheme because market guarantees are mathematically and legally flawed.',
            isCorrect: true,
            explanation: 'When the timeline is immediate (60 days) and the money is critical, absolute safety takes precedence over speculative claims.',
          },
          {
            id: 'c',
            text: 'Invest the entire amount because 12% in 45 days is too good an opportunity to miss.',
            isCorrect: false,
            explanation: 'This action risks 100% loss of essential college fee capital.',
            misconceptionSignal: 'FEAR_OF_MISSING_OUT',
          },
        ],
        reflectionNote: 'Essential capital required within 12 months should never be placed in high-risk or unregulated return promises.',
      },
    ],
    misconceptionTargets: [
      'BELIEVES_EXCEPTIONS_EXIST_FOR_GUARANTEES',
      'PARTIAL_RISK_FALLACY',
      'FEAR_OF_MISSING_OUT',
    ],
    prerequisites: ['verify-before-you-trust'],
    nextTopics: ['spotting-telegram-task-scams', 'investor-charter-and-rights'],
    officialSources: [
      {
        name: 'SEBI Investor Education Portal (Saarthi)',
        url: 'https://investor.sebi.gov.in',
        description: 'SEBI national investor awareness resources and cautionary advisories against assured returns.',
      },
    ],
    active: true,
  },

  // ── 3. fraudAwareness: Spotting Telegram Task & Tip Scams ─────────────────
  {
    topicId: 'spotting-telegram-task-scams',
    domain: 'fraudAwareness',
    title: 'Spotting Unsolicited Tips, Task Scams & Fake Trading Pools',
    shortDescription: 'How modern digital investment fraud operates, from YouTube like tasks to fake institutional trading terminals.',
    learningObjective: 'Identify key psychological triggers (artificial urgency, social proof, advance withdrawal fees) used by cyber criminals in online investment fraud.',
    difficulty: 'Intermediate',
    estimatedMinutes: 6,
    sections: [
      {
        heading: '1. The Anatomy of the Digital Task Scam',
        explanation: 'Scammers begin by offering micro-payments (₹150 - ₹500) for simple tasks like rating hotels or liking YouTube videos. Once trust is established, victims are moved to a Telegram "VIP Group" for "cryptocurrency trading" or "institutional stock allocation" requiring upfront deposits.',
        example: 'You receive ₹200 for 3 reviews on Day 1. On Day 2, you are asked to deposit ₹5,000 to "unlock" an institutional trading order paying ₹8,000.',
        warning: 'The small initial payment is bait designed to disarm your skepticism.',
      },
      {
        heading: '2. The Advance Withdrawal Fee Trap',
        explanation: 'When victims try to withdraw their profits, the dashboard displays an error: "Account Frozen", "TDS Payment Required", or "Security Escrow Needed". The victim is told to deposit additional funds (e.g., 20% or 30% of profit) to release their money.',
        example: 'Admin: "Your profit of ₹4,50,000 is ready. Deposit ₹90,000 GST to unlock your bank transfer."',
        warning: 'Legitimate financial intermediaries in India deduct statutory TDS directly; they never ask you to pay separate upfront tax into private bank accounts.',
      },
      {
        heading: '3. What to Do If You Encounter This',
        explanation: 'Stop all communication immediately. Never send additional money to "recover" previous funds. Call 1930 (National Cybercrime Reporting Portal helpline) and report the incident at cybercrime.gov.in within the first 2 hours (the "Golden Hour").',
        example: 'Reporting within 2 hours allows banks to freeze the fraudster\'s account before the money is moved through multiple beneficiary layers.',
        warning: 'Beware of "recovery agents" online claiming they can hack back your stolen funds for an advance fee; this is a secondary scam.',
      },
    ],
    keyTakeaways: [
      'Micro-payments for liking videos or rating maps are bait for high-yield investment scams.',
      'Legitimate platforms deduct taxes at source (TDS); they never ask for separate advance tax deposits.',
      'Never pay money to withdraw your own money; this is a hallmark advance-fee fraud signal.',
      'Report cyber fraud within the first 2 hours at cybercrime.gov.in or helpline 1930.',
    ],
    comprehensionQuestions: [
      {
        questionId: 'cq_fa_01',
        question: 'An online investment platform displays ₹2,00,000 in your account dashboard, but the administrator states you must transfer ₹40,000 (20% tax) to an individual account before funds can be released. What does this indicate?',
        options: [
          {
            id: 'a',
            text: 'A standard Indian tax procedure required by SEBI.',
            isCorrect: false,
            explanation: 'Under Indian law, taxes (TDS) are deducted from earnings, never collected as an upfront separate transfer.',
            misconceptionSignal: 'BELIEVES_ADVANCE_TAX_TRANSFERS_ARE_LEGITIMATE',
          },
          {
            id: 'b',
            text: 'A classic advance-fee fraud pattern. You should cease transfers and report immediately to cybercrime.gov.in (1930).',
            isCorrect: true,
            explanation: 'Demanding upfront money to release existing funds is a confirmed advance-fee fraud indicator.',
          },
          {
            id: 'c',
            text: 'A minor administrative delay that will resolve after paying half the fee.',
            isCorrect: false,
            explanation: 'Paying any portion of the fee will result in immediate financial loss.',
            misconceptionSignal: 'COMPROMISE_FEE_FALLACY',
          },
        ],
        learningTip: 'Never pay fees to unlock funds. Legitimate brokers deduct applicable charges automatically.',
      },
    ],
    practicalScenarios: [
      {
        scenarioId: 'ps_fa_01',
        title: 'The WhatsApp Work-From-Home Offer',
        situation: 'Vikram receives a WhatsApp message offering ₹2,000 per day for rating travel apps. After completing 5 ratings, he receives ₹500 in his UPI. The team leader then directs him to a Telegram group where participants share screenshots of ₹50,000 profits from an "AI Crypto Arbitrage Pool" and asks him to invest ₹10,000.',
        question: 'How should Vikram respond?',
        options: [
          {
            id: 'a',
            text: 'Invest ₹5,000 using the ₹500 earned, as he is only risking ₹4,500 of his own money.',
            isCorrect: false,
            explanation: 'The ₹500 was deliberate psychological bait to draw Vikram into a major scam.',
            misconceptionSignal: 'HOUSE_MONEY_FALLACY',
          },
          {
            id: 'b',
            text: 'Recognize the transition from micro-tasks to investment solicitations as a classic task scam, block the contacts, and do not transfer any funds.',
            isCorrect: true,
            explanation: 'Cutting off contact at the transition phase protects capital before significant loss occurs.',
          },
          {
            id: 'c',
            text: 'Ask the group members for their Aadhaar cards to ensure they are real Indians.',
            isCorrect: false,
            explanation: 'Scammers frequently use stolen identity documents of innocent third parties.',
            misconceptionSignal: 'BELIEVES_ID_CARDS_PREVENT_ONLINE_SCAMS',
          },
        ],
        reflectionNote: 'Small initial payouts are a deliberate psychological grooming tactic used to disarm investor caution.',
      },
    ],
    misconceptionTargets: [
      'BELIEVES_ADVANCE_TAX_TRANSFERS_ARE_LEGITIMATE',
      'HOUSE_MONEY_FALLACY',
      'BELIEVES_ID_CARDS_PREVENT_ONLINE_SCAMS',
    ],
    prerequisites: ['recognizing-guaranteed-return-myths'],
    nextTopics: ['investor-charter-and-rights', 'official-escalation-scores-smartodr'],
    officialSources: [
      {
        name: 'National Cyber Crime Reporting Portal',
        url: 'https://cybercrime.gov.in',
        description: 'Government of India national cybercrime portal and 1930 toll-free financial fraud reporting helpline.',
      },
    ],
    active: true,
  },

  // ── 4. investorRights: Understanding the Investor Charter ──────────────────
  {
    topicId: 'investor-charter-and-rights',
    domain: 'investorRights',
    title: 'The Investor Charter: Rights and Protections You Have by Law',
    shortDescription: 'What SEBI-registered brokers, mutual funds, and depository participants must provide to every retail investor.',
    learningObjective: 'Familiarize retail investors with statutory rights regarding contract notes, holding statements, transparent brokerage fees, and privacy protections.',
    difficulty: 'Intermediate',
    estimatedMinutes: 5,
    sections: [
      {
        heading: '1. The Right to Transparent Information',
        explanation: 'Every investor in Indian securities markets has the legal right to receive clear, timely, and complete information regarding fees, charges, risks, and portfolio status. For every trade executed, your broker must issue an official Electronic Contract Note (ECN) within 24 hours containing SEBI registration numbers and trade breakdown.',
        example: 'If your broker executes an option trade on NSE, you must receive an ECN before the end of the next working day.',
        warning: 'Unregistered platforms only provide unofficial app balances without compliant ECNs or exchange trade confirmations.',
      },
      {
        heading: '2. Direct Confirmation from Depositories (CDSL & NSDL)',
        explanation: 'Shares and mutual fund units are held in your Demat account managed by NSDL or CDSL, not inside the broker\'s balance sheet. For every credit or debit, NSDL/CDSL sends direct SMS alerts to your registered mobile number.',
        example: 'When you buy shares via Zerodha or Groww, CDSL sends an SMS: "Debit/Credit of X shares in Demat a/c *1234 on DD/MM/YY".',
        warning: 'If you buy shares on an app but never receive SMS alerts from CDSL or NSDL, your money was never invested in the real exchange.',
      },
      {
        heading: '3. Segregation of Client Funds and Prohibition of Power Abuse',
        explanation: 'Brokers are strictly prohibited from utilizing client funds for proprietary trading or pledging client securities without specific authorized margin pledge agreements. Unused funds in your trading account must be periodically settled ("quarterly running account settlement") back to your bank account.',
        example: 'Under SEBI quarterly settlement, unused cash in your trading wallet is automatically credited back to your bank account every quarter.',
        warning: 'Never sign blank Power of Attorney (POA) agreements or share Demat T-PINs with advisors or relationship managers.',
      },
    ],
    keyTakeaways: [
      'Brokers must issue Electronic Contract Notes (ECNs) within 24 hours of every trade.',
      'All real securities are recorded at CDSL/NSDL; verify direct depository SMS alerts.',
      'Brokers cannot hold idle cash indefinitely; quarterly settlement returns funds to your bank.',
      'Never share Demat T-PIN or OTPs with brokers or relationship managers.',
    ],
    comprehensionQuestions: [
      {
        questionId: 'cq_ir_01',
        question: 'You deposit money into a new mobile trading application and purchase shares of a Nifty 50 company. Which official confirmation proves that the shares are safely held in your legal ownership?',
        options: [
          {
            id: 'a',
            text: 'A green profit screenshot on the app dashboard.',
            isCorrect: false,
            explanation: 'App dashboards can be simulated by unregulated operators without real market purchases.',
            misconceptionSignal: 'CONFUSES_UI_WITH_OWNERSHIP',
          },
          {
            id: 'b',
            text: 'Direct SMS/email transaction alerts and monthly holding statements from the depository (CDSL or NSDL).',
            isCorrect: true,
            explanation: 'Depositories (CDSL/NSDL) maintain the authoritative statutory record of share ownership in India.',
          },
          {
            id: 'c',
            text: 'A confirmation message from the app customer support representative.',
            isCorrect: false,
            explanation: 'Customer support messages have no legal standing as proof of securities ownership.',
            misconceptionSignal: 'RELIES_ON_UNVERIFIED_SUPPORT',
          },
        ],
        learningTip: 'Real share ownership is always confirmed directly by CDSL or NSDL, not just the broker app interface.',
      },
    ],
    practicalScenarios: [
      {
        scenarioId: 'ps_ir_01',
        title: 'The "Hassle-Free" Demat Management Request',
        situation: 'A relationship manager from a local franchise calls Rajiv and says: "Sir, to help you capitalize on fast market moves, please share your Demat T-PIN and account password with me so I can execute profitable block trades on your behalf while you are at work."',
        question: 'What is Rajiv\'s correct response under SEBI guidelines?',
        options: [
          {
            id: 'a',
            text: 'Share the T-PIN since the manager is an authorized employee of the brokerage.',
            isCorrect: false,
            explanation: 'No intermediary or employee is permitted to solicit client passwords or authorization credentials.',
            misconceptionSignal: 'TRUSTS_RELATIONSHIP_MANAGERS_BLINDLY',
          },
          {
            id: 'b',
            text: 'Refuse firmly. Retain exclusive control of Demat T-PIN and passwords, as SEBI regulations prohibit brokers from discretionary trading on client accounts without explicit order instructions.',
            isCorrect: true,
            explanation: 'Investor credentials must remain strictly confidential under the SEBI Investor Charter.',
          },
          {
            id: 'c',
            text: 'Change the password to something simple and share it temporarily.',
            isCorrect: false,
            explanation: 'Temporary sharing still results in total vulnerability to unauthorized transactions.',
            misconceptionSignal: 'TEMPORARY_SHARING_FALLACY',
          },
        ],
        reflectionNote: 'Your T-PIN and login credentials are your personal signature. SEBI regulations forbid brokers from executing discretionary trades without verified order instructions.',
      },
    ],
    misconceptionTargets: [
      'CONFUSES_UI_WITH_OWNERSHIP',
      'TRUSTS_RELATIONSHIP_MANAGERS_BLINDLY',
      'TEMPORARY_SHARING_FALLACY',
    ],
    prerequisites: ['verify-before-you-trust'],
    nextTopics: ['official-escalation-scores-smartodr'],
    officialSources: [
      {
        name: 'SEBI Investor Charter for Securities Markets',
        url: 'https://investor.sebi.gov.in/charter.html',
        description: 'Statutory charter specifying rights, responsibilities, and do’s and don’ts for investors in Indian capital markets.',
      },
    ],
    active: true,
  },

  // ── 5. grievanceAwareness: Escalating Complaints (SCORES & SMART ODR) ──────
  {
    topicId: 'official-escalation-scores-smartodr',
    domain: 'grievanceAwareness',
    title: 'Resolving Disputes: How to Use SEBI SCORES & SMART ODR',
    shortDescription: 'The step-by-step statutory escalation pathway when a broker, depository, or mutual fund fails to resolve your issue.',
    learningObjective: 'Learn the exact legal escalation ladder: from company grievance officer to SEBI SCORES, and finally to binding online dispute resolution via SMART ODR.',
    difficulty: 'Advanced',
    estimatedMinutes: 6,
    sections: [
      {
        heading: '1. Step 1: Formal Complaint with the Entity First',
        explanation: 'Under SEBI rules, you must first lodge a formal complaint directly with the registered intermediary (broker, depository participant, or mutual fund house). Every registered firm must have a dedicated Compliance Officer / Grievance Redressal Officer whose email is publicly listed on their website and SEBI portal. Entities have 21 calendar days to address your grievance.',
        example: 'Send an email to grievance@brokerage.com with transaction date, ECN number, and specific issue description. Retain all acknowledgement numbers.',
        warning: 'Complaining casually on Twitter/X or app reviews is not a legally tracked grievance pathway.',
      },
      {
        heading: '2. Step 2: Escalating to SEBI SCORES 2.0',
        explanation: 'If the entity fails to resolve your issue within 21 days or provides an unsatisfactory resolution, escalate to SEBI SCORES (scores.sebi.gov.in or SCORES mobile app). SCORES directly routes the complaint to the designated authority and monitors compliance with statutory timeframes.',
        example: 'File a complaint on scores.sebi.gov.in attaching your initial email complaint and the broker\'s response.',
        warning: 'SCORES only handles grievances against registered intermediaries. Unregistered scam channels cannot be resolved through SCORES (those must go to 1930 / cybercrime.gov.in).',
      },
      {
        heading: '3. Step 3: Binding Resolution Through SMART ODR',
        explanation: 'If your dispute remains unresolved after SCORES, SEBI provides SMART ODR (smartodr.in) — a seamless online dispute resolution platform. Independent conciliators and arbitrators review the documentation and pass legally binding awards.',
        example: 'A dispute regarding unauthorized brokerage debit of ₹35,000 can be referred to SMART ODR for independent conciliation.',
        warning: 'Keep all electronic contract notes, bank statements, and email correspondence properly archived as documentary evidence.',
      },
    ],
    keyTakeaways: [
      'Step 1: Complain directly to the entity\'s designated Grievance Officer (21-day timeline).',
      'Step 2: Escalate unresolved issues to SEBI SCORES 2.0 (scores.sebi.gov.in).',
      'Step 3: Access binding conciliation and arbitration through SMART ODR (smartodr.in).',
      'Unregistered frauds go to cybercrime.gov.in (1930); regulated disputes go to SCORES/ODR.',
    ],
    comprehensionQuestions: [
      {
        questionId: 'cq_ga_01',
        question: 'Your SEBI-registered stockbroker debited unauthorized advisory fees of ₹15,000 from your trading balance. You complained to their grievance cell, but 25 days have passed with no response. What is the statutory next step?',
        options: [
          {
            id: 'a',
            text: 'Post complaints on consumer forums and wait for community advice.',
            isCorrect: false,
            explanation: 'Unofficial forums have no statutory enforcement powers over market intermediaries.',
            misconceptionSignal: 'RELIES_ON_UNOFFICIAL_FORUMS',
          },
          {
            id: 'b',
            text: 'File a formal complaint on the SEBI SCORES portal (scores.sebi.gov.in) with your complaint details and transaction proof.',
            isCorrect: true,
            explanation: 'SCORES is the statutory grievance portal of SEBI that mandates registered entities to resolve complaints within fixed timelines.',
          },
          {
            id: 'c',
            text: 'Close the account and accept the loss as normal trading risk.',
            isCorrect: false,
            explanation: 'Unauthorized debits violate SEBI regulations and are fully recoverable through legal dispute mechanisms.',
            misconceptionSignal: 'HELPLESSNESS_BIAS',
          },
        ],
        learningTip: 'Registered entities are accountable to SEBI. Use scores.sebi.gov.in when internal redress fails.',
      },
    ],
    practicalScenarios: [
      {
        scenarioId: 'ps_ga_01',
        title: 'The Unreturned Quarterly Settlement Funds',
        situation: 'Naveen noticed that ₹28,000 in unused funds remained in his trading wallet for over 5 months without mandatory quarterly settlement back to his bank account. He emailed the broker\'s support team twice, but received only automated generic replies.',
        question: 'How should Naveen handle this escalation efficiently?',
        options: [
          {
            id: 'a',
            text: 'Email the broker\'s designated Compliance Officer directly with a formal notice citing SEBI circular on mandatory quarterly settlement, and escalate to scores.sebi.gov.in if not resolved in 21 days.',
            isCorrect: true,
            explanation: 'Following the structured escalation path ensures documented evidence for regulatory enforcement.',
          },
          {
            id: 'b',
            text: 'File a police complaint against the customer support executive who answered the call.',
            isCorrect: false,
            explanation: 'Individual support executives are not the legal entity responsible for institutional compliance.',
            misconceptionSignal: 'MISDIRECTED_ESCALATION',
          },
          {
            id: 'c',
            text: 'Execute risky option trades to consume the balance so the broker cannot hold it.',
            isCorrect: false,
            explanation: 'Gambling with funds to avoid holding issues causes certain capital loss.',
            misconceptionSignal: 'AVOIDANCE_RECKLESSNESS',
          },
        ],
        reflectionNote: 'Statutory escalation via compliance officers and SEBI SCORES provides strong legal backing without the need for unmonitored litigation.',
      },
    ],
    misconceptionTargets: [
      'RELIES_ON_UNOFFICIAL_FORUMS',
      'HELPLESSNESS_BIAS',
      'MISDIRECTED_ESCALATION',
    ],
    prerequisites: ['investor-charter-and-rights'],
    nextTopics: ['basic-investment-building-blocks'],
    officialSources: [
      {
        name: 'SEBI SCORES 2.0 Portal',
        url: 'https://scores.sebi.gov.in',
        description: 'Centralized SEBI grievance redress system for complaints against listed companies and registered market intermediaries.',
      },
      {
        name: 'SMART ODR Portal',
        url: 'https://smartodr.in',
        description: 'Securities Market Approach for Resolution Through Online Dispute Resolution portal.',
      },
    ],
    active: true,
  },

  // ── 6. basicConcepts: Basic Investment Building Blocks ─────────────────────
  {
    topicId: 'basic-investment-building-blocks',
    domain: 'basicConcepts',
    title: 'Investment Building Blocks: FDs, Mutual Funds, Equities & Demat',
    shortDescription: 'The foundational mechanics of capital growth, liquidity, market volatility, and safe custody of financial assets in India.',
    learningObjective: 'Clarify the structural differences between guaranteed debt instruments and fluctuating equity assets, and understand the role of Demat accounts.',
    difficulty: 'Fundamental',
    estimatedMinutes: 5,
    sections: [
      {
        heading: '1. Cash Savings vs Capital Investment',
        explanation: 'Savings accounts and Fixed Deposits preserve nominal capital and provide liquidity, but after accounting for inflation and income tax, real purchasing power growth is modest. Capital investments (equities, index funds, real estate) aim for long-term purchasing power expansion, but require accepting short-term market value fluctuations.',
        example: 'A 7% FD in a 6% inflation environment yields ~1% real pre-tax return. Equities historically offer higher inflation premiums over 7-10 year horizons, with intermittent down years.',
        warning: 'Never invest emergency fund cash into market-linked instruments that can drop 20% right when you need liquidity.',
      },
      {
        heading: '2. The Structure of a Mutual Fund',
        explanation: 'A mutual fund pools money from thousands of investors to purchase a diversified basket of stocks, bonds, or money market instruments managed by SEBI-registered Asset Management Companies (AMCs). Net Asset Value (NAV) reflects the per-unit market value calculated daily.',
        example: 'Buying 1 unit of a Nifty 50 Index Fund gives you fractional exposure to India\'s top 50 listed companies, preventing total reliance on a single stock.',
        warning: 'Mutual funds are not bank accounts; NAVs fluctuate daily with underlying market prices.',
      },
      {
        heading: '3. What a Demat Account Actually Does',
        explanation: 'A Demat (Dematerialized) account is simply an electronic vault that holds your securities certificates in electronic form under CDSL or NSDL. Your trading account is the transactional interface used to place buy/sell orders on stock exchanges (NSE/BSE).',
        example: 'Trading Account = Shopping cart where you place orders. Demat Account = Your digital locker where bought shares are securely stored.',
        warning: 'The broker is only the gateway to your Demat locker; your actual shares reside safely with the national depositories.',
      },
    ],
    keyTakeaways: [
      'Savings accounts preserve capital for emergencies; investments aim for long-term purchasing power.',
      'Mutual funds offer diversification; NAV changes daily based on underlying market values.',
      'Demat accounts are digital lockers with CDSL/NSDL; trading accounts are order gateways.',
      'Always maintain a 3 to 6-month liquid emergency fund before beginning equity investments.',
    ],
    comprehensionQuestions: [
      {
        questionId: 'cq_bc_01',
        question: 'What is the primary function of a Demat account in the Indian financial system?',
        options: [
          {
            id: 'a',
            text: 'To guarantee that stock prices will increase every financial year.',
            isCorrect: false,
            explanation: 'Demat accounts hold records of securities; they have no influence on stock prices or market performance.',
            misconceptionSignal: 'ATTRIBUTES_RETURNS_TO_DEMAT',
          },
          {
            id: 'b',
            text: 'To serve as an electronic depository locker holding shares and mutual fund units in dematerialized form with NSDL or CDSL.',
            isCorrect: true,
            explanation: 'Demat accounts eliminate physical paper certificates and hold securities in safe electronic custody.',
          },
          {
            id: 'c',
            text: 'To provide automated personal loans without credit checks.',
            isCorrect: false,
            explanation: 'Demat accounts are custody accounts, not lending facilities.',
            misconceptionSignal: 'CONFUSES_DEMAT_WITH_BANK_LOAN',
          },
        ],
        learningTip: 'Demat = Digital Locker for your securities with national depositories (CDSL/NSDL).',
      },
    ],
    practicalScenarios: [
      {
        scenarioId: 'ps_bc_01',
        title: 'Building the First Investment Allocation',
        situation: 'Kavita started her first job with a net salary of ₹40,000 per month. She has zero emergency savings and wants to start investing ₹25,000 every month into speculative small-cap stocks because she heard stock markets multiply money fastest.',
        question: 'What foundational advice aligns best with investor safety principles?',
        options: [
          {
            id: 'a',
            text: 'Invest everything in small caps immediately to maximize youth advantage.',
            isCorrect: false,
            explanation: 'Investing without an emergency cushion leads to forced panic-selling at a loss if an unexpected expense arises.',
            misconceptionSignal: 'DISREGARDS_EMERGENCY_BUFFER',
          },
          {
            id: 'b',
            text: 'Build a liquid emergency fund covering 3 to 6 months of living expenses first in a safe bank account or liquid fund, and then systematically allocate surplus savings into broad diversified index funds.',
            isCorrect: true,
            explanation: 'Financial security requires building an emergency liquidity cushion before taking market volatility risk.',
          },
          {
            id: 'c',
            text: 'Borrow a personal loan to double her investment pool size.',
            isCorrect: false,
            explanation: 'Investing with borrowed money (leverage) compounds downside risk and is a common trap.',
            misconceptionSignal: 'LEVERAGE_FALLACY',
          },
        ],
        reflectionNote: 'Sound financial readiness begins with emergency liquidity before exposing capital to market volatility.',
      },
    ],
    misconceptionTargets: [
      'ATTRIBUTES_RETURNS_TO_DEMAT',
      'DISREGARDS_EMERGENCY_BUFFER',
      'LEVERAGE_FALLACY',
    ],
    prerequisites: [],
    nextTopics: ['recognizing-guaranteed-return-myths', 'verify-before-you-trust'],
    officialSources: [
      {
        name: 'AMFI Investor Education (Mutual Funds Sahi Hai)',
        url: 'https://www.amfiindia.com',
        description: 'Official association educational guides on mutual fund basics, NAV calculations, and SIP mechanics.',
      },
    ],
    active: true,
  },
];
