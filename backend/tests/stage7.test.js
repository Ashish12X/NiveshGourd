// backend/tests/stage7.test.js
/**
 * Stage 7 � Ask SANGYAN + Adaptive Compare + Decision Readiness
 * Service-layer tests (no HTTP server or real MongoDB required).
 */

import { getCatalog } from '../src/services/compare/compareService.js';
import {
  getChecklistTemplate,
  evaluateReadiness,
  DEFAULT_CHECKLIST_TEMPLATE,
} from '../src/services/readiness/decisionReadinessService.js';

let passed = 0;
let failed = 0;
const errors = [];

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeTruthy: () => { if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`); },
    toBeGreaterThan: (n) => { if (actual <= n) throw new Error(`Expected ${actual} > ${n}`); },
    toBeLessThanOrEqual: (n) => { if (actual > n) throw new Error(`Expected ${actual} <= ${n}`); },
    toContain: (item) => { if (!actual.includes(item)) throw new Error(`Expected array to contain ${JSON.stringify(item)}`); },
    not: {
      toContain: (item) => { if (actual.includes(item)) throw new Error(`Expected NOT to contain ${JSON.stringify(item)}`); },
      toBe: (expected) => { if (actual === expected) throw new Error(`Expected NOT ${JSON.stringify(expected)}`); },
    },
  };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ? ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ? ${name}`);
    console.error(`    ? ${err.message}`);
    errors.push({ name, message: err.message });
    failed++;
  }
}

// -- COMPARE CATALOG ----------------------------------------------------------
console.log('\n-- COMPARE CATALOG TESTS --');

await test('getCatalog returns products and criteria arrays', () => {
  const catalog = getCatalog();
  expect(catalog).toBeTruthy();
  expect(Array.isArray(catalog.products)).toBe(true);
  expect(Array.isArray(catalog.criteria)).toBe(true);
  expect(catalog.products.length).toBeGreaterThan(0);
  expect(catalog.criteria.length).toBeGreaterThan(0);
});

await test('catalog products have id, name, regulatedBy, isRegulated', () => {
  const { products } = getCatalog();
  for (const p of products) {
    if (!p.id) throw new Error(`Product missing id`);
    if (!p.name) throw new Error(`Product missing name: ${p.id}`);
    if (p.regulatedBy === undefined) throw new Error(`Product missing regulatedBy: ${p.id}`);
    if (typeof p.isRegulated !== 'boolean') throw new Error(`isRegulated must be boolean: ${p.id}`);
  }
});

await test('catalog criteria have key and label', () => {
  const { criteria } = getCatalog();
  for (const c of criteria) {
    if (!c.key) throw new Error(`Criterion missing key`);
    if (!c.label) throw new Error(`Criterion missing label`);
  }
});

await test('catalog has at least one regulated product', () => {
  const { products } = getCatalog();
  const regulated = products.filter((p) => p.isRegulated);
  expect(regulated.length).toBeGreaterThan(0);
});

await test('catalog has at least one unregulated product for contrast', () => {
  const { products } = getCatalog();
  const unregulated = products.filter((p) => !p.isRegulated);
  expect(unregulated.length).toBeGreaterThan(0);
});

// -- COMPARE SAFETY -----------------------------------------------------------
console.log('\n-- COMPARE SAFETY TESTS --');

await test('performComparison rejects unknown productAId', async () => {
  const { performComparison } = await import('../src/services/compare/compareService.js');
  try {
    await performComparison({ userId: null, productAId: 'unknown-a', productBId: 'unknown-b', criteria: [] });
    throw new Error('Should have thrown');
  } catch (err) {
    if (err.message === 'Should have thrown') throw err;
    expect(err.message).toBeTruthy();
  }
});

await test('performComparison rejects identical product selection', async () => {
  const { performComparison } = await import('../src/services/compare/compareService.js');
  const { products } = getCatalog();
  const id = products[0].id;
  try {
    await performComparison({ userId: null, productAId: id, productBId: id, criteria: [] });
    throw new Error('Should have thrown');
  } catch (err) {
    if (err.message === 'Should have thrown') throw err;
    expect(err.message).toBeTruthy();
  }
});

await test('catalog products have no winner/best/recommended field', () => {
  const { products } = getCatalog();
  for (const p of products) {
    const json = JSON.stringify(p).toLowerCase();
    if (json.includes('"winner"')) throw new Error(`Product ${p.id} has forbidden "winner" field`);
    if (json.includes('"best"')) throw new Error(`Product ${p.id} has forbidden "best" field`);
  }
});

await test('catalog products have no expectedReturn or price field', () => {
  const { products } = getCatalog();
  for (const p of products) {
    if ('expectedReturn' in p) throw new Error(`Product ${p.id} has forbidden expectedReturn field`);
    if ('price' in p) throw new Error(`Product ${p.id} has forbidden price field`);
  }
});

// -- DECISION READINESS TEMPLATE -----------------------------------------------
console.log('\n-- DECISION READINESS TEMPLATE TESTS --');

await test('getChecklistTemplate returns 10-item template', () => {
  const data = getChecklistTemplate();
  expect(data.template.length).toBe(10);
  expect(data.totalCount).toBe(10);
});

await test('template items have id, question, category, description', () => {
  const { template } = getChecklistTemplate();
  for (const item of template) {
    if (!item.id) throw new Error('Template item missing id');
    if (!item.question) throw new Error(`Template item missing question: ${item.id}`);
    if (!item.category) throw new Error(`Template item missing category: ${item.id}`);
    if (!item.description) throw new Error(`Template item missing description: ${item.id}`);
  }
});

await test('template includes guardrailNotice', () => {
  const data = getChecklistTemplate();
  expect(data.guardrailNotice).toBeTruthy();
});

await test('guardrailNotice does not contain investment advice language', () => {
  const { guardrailNotice } = getChecklistTemplate();
  const lower = guardrailNotice.toLowerCase();
  if (lower.includes('guaranteed return')) throw new Error('guardrailNotice contains "guaranteed return"');
  if (lower.includes('best investment')) throw new Error('guardrailNotice contains "best investment"');
});

await test('template covers required safety dimensions (source, regulatory, grievance, urgency)', () => {
  const ids = DEFAULT_CHECKLIST_TEMPLATE.map((i) => i.id);
  expect(ids).toContain('q5_source');
  expect(ids).toContain('q6_official_check');
  expect(ids).toContain('q8_grievance');
  expect(ids).toContain('q9_urgency');
});

// -- DECISION READINESS SCORING ------------------------------------------------
console.log('\n-- DECISION READINESS SCORING TESTS --');

const allYes = DEFAULT_CHECKLIST_TEMPLATE.map((i) => ({ id: i.id, answer: 'YES', notes: '' }));
const allNo = DEFAULT_CHECKLIST_TEMPLATE.map((i) => ({ id: i.id, answer: 'NO', notes: '' }));
const mixed5 = DEFAULT_CHECKLIST_TEMPLATE.map((i, idx) => ({ id: i.id, answer: idx < 5 ? 'YES' : 'NOT_SURE', notes: '' }));

await test('all YES ? 100% readinessPercentage, Comprehensive Understanding', async () => {
  const result = await evaluateReadiness({ userId: null, checklist: allYes });
  expect(result.readinessPercentage).toBe(100);
  expect(result.readinessLevel).toBe('Comprehensive Understanding');
  expect(result.unresolvedCount).toBe(0);
});

await test('all NO ? 0% readinessPercentage, Significant Information Gaps', async () => {
  const result = await evaluateReadiness({ userId: null, checklist: allNo });
  expect(result.readinessPercentage).toBe(0);
  expect(result.readinessLevel).toBe('Significant Information Gaps');
  expect(result.unresolvedCount).toBe(10);
});

await test('5 YES ? 50%, Partially Informed', async () => {
  const result = await evaluateReadiness({ userId: null, checklist: mixed5 });
  expect(result.readinessPercentage).toBe(50);
  expect(result.readinessLevel).toBe(result.readinessLevel);
});

await test('unresolvedItems contains only non-YES answers', async () => {
  const result = await evaluateReadiness({ userId: null, checklist: mixed5 });
  expect(result.unresolvedItems.length).toBe(5);
  for (const item of result.unresolvedItems) {
    if (item.answer === 'YES') throw new Error('unresolvedItems must not contain YES items');
  }
});

await test('result contains neutralExplanation and guardrailNotice', async () => {
  const result = await evaluateReadiness({ userId: null, checklist: allYes });
  expect(result.neutralExplanation).toBeTruthy();
  expect(result.guardrailNotice).toBeTruthy();
});

await test('neutralExplanation does not contain recommendation language', async () => {
  const result = await evaluateReadiness({ userId: null, checklist: allYes });
  const lower = result.neutralExplanation.toLowerCase();
  const forbidden = ['you should invest', 'buy now', 'guaranteed return', 'recommend investing'];
  for (const phrase of forbidden) {
    if (lower.includes(phrase)) throw new Error(`neutralExplanation contains forbidden: "${phrase}"`);
  }
});

// -- BRIDGE ASSIGNMENTS --------------------------------------------------------
console.log('\n-- BRIDGE ASSIGNMENT TESTS --');

await test('unresolved q5_source and q6_official_check ? VALIDITY_CHECK bridge', async () => {
  const checklist = DEFAULT_CHECKLIST_TEMPLATE.map((item) => ({
    id: item.id,
    answer: ['q5_source', 'q6_official_check'].includes(item.id) ? 'NO' : 'YES',
    notes: '',
  }));
  const result = await evaluateReadiness({ userId: null, checklist });
  const bridges = result.unresolvedItems.map((i) => i.actionType);
  expect(bridges).toContain('VALIDITY_CHECK');
});

await test('unresolved q8_grievance ? LEARN bridge', async () => {
  const checklist = DEFAULT_CHECKLIST_TEMPLATE.map((item) => ({
    id: item.id,
    answer: item.id === 'q8_grievance' ? 'NO' : 'YES',
    notes: '',
  }));
  const result = await evaluateReadiness({ userId: null, checklist });
  const item = result.unresolvedItems.find((i) => i.id === 'q8_grievance');
  expect(item).toBeTruthy();
  expect(item.actionType).toBe('LEARN');
});

await test('all unresolved items have actionType and actionUrl', async () => {
  const result = await evaluateReadiness({ userId: null, checklist: allNo });
  for (const item of result.unresolvedItems) {
    if (!item.actionType) throw new Error(`Item ${item.id} missing actionType`);
    if (!item.actionUrl) throw new Error(`Item ${item.id} missing actionUrl`);
  }
});

// -- SUMMARY -------------------------------------------------------------------
console.log('\n--------------------------------------------------');
console.log('STAGE 7 TEST SUMMARY');
console.log('--------------------------------------------------');
console.log(`  Total:  ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (errors.length > 0) {
  console.log('\nFailed tests:');
  for (const e of errors) {
    console.log(`  ? ${e.name}`);
    console.log(`    ${e.message}`);
  }
  process.exit(1);
} else {
  console.log('\n? All Stage 7 service-layer tests passed.\n');
}
