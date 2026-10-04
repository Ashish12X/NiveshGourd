import { validateAIResponse } from './src/services/ai/llmService.js';

const text = `I cannot provide stock recommendations, price targets, or advice on which stocks you should buy or sell. My purpose is to help you understand financial concepts and evaluate risks so you can make your own informed decisions.

Investing in the stock market involves inherent risks, and the "right" choice depends entirely on your personal financial goals, risk appetite, and investment horizon.

### Factors to Consider Before Investing
Instead of looking for a specific "buy" recommendation, consider evaluating any potential investment against these objective criteria:

*   **Business Fundamentals:** Does the company have a clear revenue model? Is it profitable? You can find this information in the company's annual reports and quarterly filings on the **[NSE](https://www.nseindia.com)** or **[BSE](https://www.bseindia.com)** websites.
*   **Risk Profile:** Every stock carries market risk. Consider if you are comfortable with the volatility associated with the specific sector or company.
*   **Investment Horizon:** Are you investing for the short term or the long term? Stocks are generally considered volatile assets and are often recommended for long-term horizons to ride out market fluctuations.
*   **Diversification:** Putting all your capital into a single stock increases your risk. Many investors look at how a potential investment fits into their overall portfolio to ensure they aren't over-exposed to one sector.
*   **Valuation Metrics:** Look at standard financial ratios (like P/E ratio, Debt-to-Equity ratio) to understand if the stock is priced reasonably relative to its earnings and debt, rather than relying on market sentiment.

### Practical Example: The "Demat" Verification
Before you invest in any stock, ensure you are using a registered intermediary. For example, if you are considering opening a trading account, you should verify if the broker is registered with **SEBI**. You can check the registration status of any broker or investment advisor on the **[SEBI SCORES portal](https://scores.sebi.gov.in/)**.

### Resources for Your Research
To conduct your own analysis, rely on official and transparent sources:
*   **[SEBI (Securities and Exchange Board of India)](https://www.sebi.gov.in):** For regulatory guidelines and investor protection information.
*   **[NSE/BSE Websites](https://www.nseindia.com / https://www.bseindia.com):** For corporate announcements, financial results, and historical price data.
*   **[Investor Education Portal (investor.sebi.gov.in)](https://investor.sebi.gov.in):** A dedicated resource by SEBI to help retail investors understand market mechanisms.

**A Note on Safety:** Be cautious of "stock tips" provided on social media, Telegram groups, or unsolicited messages. These are common channels for market manipulation and fraudulent schemes. Always perform your own due diligence using the official sources mentioned above.`;

console.log('VALIDATION RESULT:', validateAIResponse(text));
