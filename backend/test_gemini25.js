// Test gemini-2.5-flash - the model found in the list
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const key = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: key });

const modelsToTest = ['gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17', 'gemini-2.5-flash-lite'];

for (const model of modelsToTest) {
  try {
    console.log(`Testing ${model}...`);
    const r = await Promise.race([
      client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'Say "hello" in one word only' }] }],
        config: { maxOutputTokens: 10, temperature: 0.1 },
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 15000)),
    ]);
    let txt = typeof r?.text === 'function' ? r.text() : (r?.text || r?.candidates?.[0]?.content?.parts?.[0]?.text || '');
    console.log(`✅ ${model}: OK - "${txt.trim().slice(0,30)}"`);
  } catch(e) {
    console.log(`❌ ${model}: ${e.message.slice(0, 150)}`);
  }
}

// Also try a real investment question
console.log('\n--- Real query test ---');
try {
  const r = await Promise.race([
    client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'How do I verify an investment platform in India?' }] }],
      config: { maxOutputTokens: 200, temperature: 0.4 },
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 30000)),
  ]);
  let txt = typeof r?.text === 'function' ? r.text() : (r?.text || r?.candidates?.[0]?.content?.parts?.[0]?.text || '');
  console.log('✅ Full query OK. First 300 chars:');
  console.log(txt.slice(0, 300));
} catch(e) {
  console.log('❌ Full query failed:', e.message.slice(0, 200));
}

process.exit(0);
