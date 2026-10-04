// List available Gemini models - v2 approach
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const key = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: key });

// Try different approach to list models
try {
  const result = await client.models.list();
  console.log('Type:', typeof result);
  console.log('Keys:', Object.keys(result || {}));
  if (result?.models) {
    for (const m of result.models) {
      console.log(m.name);
    }
  } else if (Array.isArray(result)) {
    for (const m of result) {
      console.log(m.name || m);
    }
  } else {
    console.log('Result:', JSON.stringify(result).slice(0, 500));
  }
} catch(e) {
  console.error('List error:', e.message.slice(0, 300));
}

// Also test specific newer models
const newModels = [
  'gemini-3.0-flash',
  'gemini-3.0-flash-lite', 
  'gemini-3.5-flash',
  'gemini-flash-2.5',
  'gemini-3.1-flash',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-flash-preview-04-17',
  'gemini-exp-1206',
  'gemini-2.0-flash-exp',
];

console.log('\nTesting newer model names...');
for (const model of newModels) {
  try {
    const r = await Promise.race([
      client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'ok' }] }],
        config: { maxOutputTokens: 3, temperature: 0.1 },
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 10000)),
    ]);
    let txt = typeof r?.text === 'function' ? r.text() : (r?.text || r?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    console.log(`✅ ${model}: OK - "${txt.trim().slice(0,20)}"`);
  } catch(e) {
    const msg = e.message.slice(0, 100);
    console.log(`❌ ${model}: ${msg}`);
  }
}
process.exit(0);
