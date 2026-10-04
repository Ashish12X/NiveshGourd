// backend/tests/aiApi.test.js
/**
 * End-to-End API Integration & Security Tests for AI Endpoints (Stage 4)
 *
 * Tests:
 *  1. Unauthenticated request to /api/ai/chat -> 401 Unauthorized
 *  2. Register & login test user
 *  3. Empty message validation -> 400 Bad Request
 *  4. Oversized message (>2000 chars) -> 400 Bad Request
 *  5. Valid message -> returns 200 with conversationId, message, and safe metadata
 *  6. Safe metadata check: no systemPrompt, no AI_API_KEY, no chain-of-thought in response
 *  7. Multi-turn continuation on same conversationId
 *  8. Conversation listing /api/ai/conversations
 *  9. Cross-user isolation: User B cannot access User A's conversation
 *  10. Soft deletion of conversation
 */

const BASE_URL = 'http://localhost:8000/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('=== RUNNING AI API END-TO-END SECURITY & ROUTE TESTS ===\n');

  // 1. Unauthenticated request to /api/ai/chat
  console.log('Test 1: Unauthenticated request rejected');
  const unauthRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello' }),
  });
  assert(unauthRes.status === 401, `Expected 401, got ${unauthRes.status}`);
  console.log('✅ Test 1 Passed: Unauthenticated request returned 401 Unauthorized.\n');

  // 2. Register User A
  console.log('Test 2: Register & authenticate User A');
  const userAEmail = `user_a_${Date.now()}@sangyan.test`;
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User Alpha',
      email: userAEmail,
      password: 'Password123!',
    }),
  });
  const regAData = await regARes.json();
  assert(regARes.status === 201, `Expected 201, got ${regARes.status}: ${JSON.stringify(regAData)}`);
  
  // Extract token from Set-Cookie header
  const setCookieA = regARes.headers.get('set-cookie') || '';
  const tokenMatchA = setCookieA.match(/token=([^;]+)/);
  assert(tokenMatchA, 'Set-Cookie must contain token');
  const tokenA = tokenMatchA[1];
  console.log('✅ Test 2 Passed: User A registered and authenticated.\n');

  const headersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenA}`,
  };

  // 3. Empty message validation
  console.log('Test 3: Empty message validation');
  const emptyRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ message: '   ' }),
  });
  assert(emptyRes.status === 400, `Expected 400, got ${emptyRes.status}`);
  console.log('✅ Test 3 Passed: Empty message rejected with 400.\n');

  // 4. Oversized message validation
  console.log('Test 4: Oversized message validation');
  const hugeMessage = 'a'.repeat(2500);
  const hugeRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ message: hugeMessage }),
  });
  assert(hugeRes.status === 400, `Expected 400, got ${hugeRes.status}`);
  console.log('✅ Test 4 Passed: Oversized message rejected with 400.\n');

  // 5. Valid chat request
  console.log('Test 5: Valid chat message via adaptive AI engine');
  const chatRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      message: 'What is investment risk in Indian stock markets?',
      uiMode: 'Explain',
    }),
  });
  const chatData = await chatRes.json();
  assert(chatRes.status === 200, `Expected 200, got ${chatRes.status}: ${JSON.stringify(chatData)}`);
  assert(chatData.success === true, 'Response success must be true');
  assert(chatData.conversationId, 'Must return conversationId');
  assert(typeof chatData.message === 'string' && chatData.message.length > 10, 'Must return non-empty message');
  assert(chatData.metadata, 'Must return safe metadata');
  assert(chatData.metadata.intent === 'explain', `Expected intent 'explain', got '${chatData.metadata.intent}'`);
  assert(chatData.metadata.adaptation, 'Must return adaptation plan');
  const convIdA = chatData.conversationId;
  console.log('✅ Test 5 Passed: AI chat executed successfully, returned response and conversation ID.\n');

  // 6. Security verification on response payload
  console.log('Test 6: Verify no sensitive data leaked in response');
  assert(!chatData.systemPrompt, 'System prompt must NEVER be returned');
  assert(!chatData.apiKey, 'API key must NEVER be returned');
  assert(!chatData.chainOfThought, 'Chain of thought must NEVER be returned');
  assert(!chatData.rawPrompt, 'Raw prompt must NEVER be returned');
  assert(!JSON.stringify(chatData).includes('Password123!'), 'Password must never leak');
  console.log('✅ Test 6 Passed: No sensitive keys, prompts, or credentials in payload.\n');

  // 7. Multi-turn continuation
  console.log('Test 7: Multi-turn continuation');
  const turn2Res = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      conversationId: convIdA,
      message: 'Can you give me an example of that?',
      uiMode: 'Explain',
    }),
  });
  const turn2Data = await turn2Res.json();
  assert(turn2Res.status === 200, `Expected 200, got ${turn2Res.status}`);
  assert(turn2Data.conversationId === convIdA, 'Should maintain same conversation ID');
  console.log('✅ Test 7 Passed: Multi-turn continuation succeeded on same conversation.\n');

  // 8. List conversations
  console.log('Test 8: List conversations');
  const listRes = await fetch(`${BASE_URL}/ai/conversations`, {
    headers: headersA,
  });
  const listData = await listRes.json();
  assert(listRes.status === 200, `Expected 200, got ${listRes.status}`);
  assert(Array.isArray(listData.data), 'Conversations must be array');
  assert(listData.data.some((c) => c._id === convIdA), 'Must include created conversation');
  console.log(`✅ Test 8 Passed: Listed ${listData.data.length} conversation(s).\n`);

  // 9. Register User B and verify cross-user isolation
  console.log('Test 9: Cross-user isolation (User B cannot access User A conversation)');
  const userBEmail = `user_b_${Date.now()}@sangyan.test`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User Beta',
      email: userBEmail,
      password: 'Password123!',
    }),
  });
  const regBData = await regBRes.json();
  const setCookieB = regBRes.headers.get('set-cookie') || '';
  const tokenMatchB = setCookieB.match(/token=([^;]+)/);
  assert(tokenMatchB, 'Set-Cookie must contain token for User B');
  const tokenB = tokenMatchB[1];
  const headersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenB}`,
  };

  // User B tries to read User A's conversation
  const stealRes = await fetch(`${BASE_URL}/ai/conversations/${convIdA}`, {
    headers: headersB,
  });
  assert(stealRes.status === 404, `User B should get 404 on User A conversation, got ${stealRes.status}`);

  // User B tries to chat into User A's conversation
  const hijackRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: headersB,
    body: JSON.stringify({
      conversationId: convIdA,
      message: 'Hijacking test',
    }),
  });
  assert(hijackRes.status === 404, `User B should get 404 on hijacking attempt, got ${hijackRes.status}`);
  console.log('✅ Test 9 Passed: Cross-user isolation verified (404 returned on unauthorized conversation).\n');

  // 10. Delete conversation
  console.log('Test 10: Soft delete conversation');
  const delRes = await fetch(`${BASE_URL}/ai/conversations/${convIdA}`, {
    method: 'DELETE',
    headers: headersA,
  });
  assert(delRes.status === 200, `Expected 200, got ${delRes.status}`);

  // Verify it is no longer returned in list
  const listAfterDel = await fetch(`${BASE_URL}/ai/conversations`, { headers: headersA });
  const listAfterData = await listAfterDel.json();
  assert(!listAfterData.data.some((c) => c._id === convIdA), 'Deleted conversation must not appear in list');
  console.log('✅ Test 10 Passed: Conversation soft deletion verified.\n');

  console.log('========================================================');
  console.log('🎉 ALL AI API & SECURITY TESTS PASSED PERFECTLY!');
  console.log('========================================================\n');
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
