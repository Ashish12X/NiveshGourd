// backend/test_gemini_models.js
// Tests which Gemini models are available with current API key
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error('No API key'); process.exit(1); }
const client = new GoogleGenAI({ apiKey: key });

const MODELS_TO_TEST = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

async function testModel(model) {
  try {
    const result = await Promise.race([
      client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'Say "ok" in one word' }] }],
        config: { maxOutputTokens: 5, temperature: 0.1 },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 12000)),
    ]);
    let txt = '';
    if (typeof result?.text === 'function') txt = result.text();
    else if (typeof result?.text === 'string') txt = result.text;
    else txt = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { model, status: 'OK', response: txt.trim().slice(0, 30) };
  } catch (e) {
    return { model, status: 'FAIL', error: e.message.slice(0, 120) };
  }
}

console.log('Testing Gemini models with current API key...\n');
for (const model of MODELS_TO_TEST) {
  const result = await testModel(model);
  console.log(`${result.status === 'OK' ? '✅' : '❌'} ${model}: ${result.status}${result.response ? ' → "' + result.response + '"' : ''}${result.error ? ' → ' + result.error : ''}`);
}
process.exit(0);
