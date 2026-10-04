// Test gemini-3.8-flash - per error message guidance
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const key = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: key });

const modelsToTest = [
  'gemini-3.8-flash', 
  'gemini-3.8-flash-lite',
  'gemini-3.0-flash-lite',
];

for (const model of modelsToTest) {
  try {
    console.log(`Testing ${model}...`);
    const r = await Promise.race([
      client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }],
        config: { maxOutputTokens: 10, temperature: 0.1 },
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 20000)),
    ]);
    let txt = typeof r?.text === 'function' ? r.text() : (r?.text || r?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    console.log(`✅ ${model}: OK - "${txt.trim().slice(0, 30)}"`);
  } catch(e) {
    console.log(`❌ ${model}: ${e.message.slice(0, 200)}`);
  }
}

// Test the working one with a real query
console.log('\n--- Real query: How to verify investment platform ---');
try {
  const r = await Promise.race([
    client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: 'How do I verify an investment platform in India? Give a brief answer.' }] }],
      config: { maxOutputTokens: 300, temperature: 0.4 },
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 30000)),
  ]);
  let txt = typeof r?.text === 'function' ? r.text() : (r?.text || r?.candidates?.[0]?.content?.parts?.[0]?.text || '');
  console.log('✅ Response (first 400 chars):\n', txt.slice(0, 400));
} catch(e) {
  console.log('❌ Real query failed:', e.message.slice(0, 250));
}

process.exit(0);
