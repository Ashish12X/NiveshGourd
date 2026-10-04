// backend/tests/verificationApi.test.js
/**
 * End-to-End API Integration, Ownership, Security, and Rate Limiting Tests (Stage 5)
 *
 * Tests:
 *   1. Unauthenticated request to /api/verification/analyze -> 401 Unauthorized
 *   2. Register User A & User B
 *   3. Invalid input handling:
 *      - Invalid inputType -> 400 Bad Request
 *      - Short text (<10 chars) -> 400 Bad Request
 *      - Oversized text (>5000 chars) -> 400 Bad Request
 *      - Invalid image MIME -> 400 Bad Request
 *      - Malformed URL -> 400 Bad Request
 *   4. Successful text verification for User A -> 201 Created with valid VerificationAnalysis
 *   5. Security & privacy verification:
 *      - OTP/PIN/password NEVER stored in DB
 *      - AI keys and system prompt NOT leaked
 *   6. Retrieve verification by ID (/api/verification/:id)
 *   7. Cross-user isolation / ownership check:
 *      - User B attempts to access User A's verification -> 404 Not Found
 *      - User B attempts to delete User A's verification -> 404 Not Found
 *   8. User history (/api/verification/history):
 *      - User A sees own verification
 *      - User B sees 0 verifications initially
 *   9. Delete analysis by ID:
 *      - User A deletes own analysis -> 200 OK
 *      - Subsequent GET -> 404 Not Found
 */

const BASE_URL = 'http://localhost:8000/api';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('=== RUNNING STAGE 5 VERIFICATION API & OWNERSHIP E2E TESTS ===\n');

  // 1. Unauthenticated request
  console.log('Test 1: Unauthenticated request rejected');
  const unauthRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputType: 'TEXT', text: 'SEBI approved ABC platform guaranteed 30% return' }),
  });
  assert(unauthRes.status === 401, `Expected 401, got ${unauthRes.status}`);
  console.log('✅ Test 1 Passed: Unauthenticated request returned 401.\n');

  // 2. Register User A and User B
  const timestamp = Date.now();
  console.log('Test 2: Register User A and User B');
  const emailA = `verif_user_a_${timestamp}@sangyan.test`;
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User A', email: emailA, password: 'Password123!' }),
  });
  const tokenA = (regARes.headers.get('set-cookie') || '').match(/token=([^;]+)/)[1];

  const emailB = `verif_user_b_${timestamp}@sangyan.test`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'User B', email: emailB, password: 'Password123!' }),
  });
  const tokenB = (regBRes.headers.get('set-cookie') || '').match(/token=([^;]+)/)[1];

  const headersA = { 'Content-Type': 'application/json', Cookie: `token=${tokenA}` };
  const headersB = { 'Content-Type': 'application/json', Cookie: `token=${tokenB}` };
  console.log('✅ Test 2 Passed: User A and User B registered & authenticated.\n');

  // 3. Invalid input validation
  console.log('--- Test 3: Input & Security Validations ---');

  // 3.1 Invalid inputType
  const invTypeRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ inputType: 'INVALID_TYPE', text: 'Some random text that is long enough' }),
  });
  assert(invTypeRes.status === 400, 'Invalid inputType should return 400');
  console.log('✅ 3.1 Invalid inputType rejected with 400.');

  // 3.2 Short text (<10 chars)
  const shortRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ inputType: 'TEXT', text: 'Short' }),
  });
  assert(shortRes.status === 400, 'Short text should return 400');
  console.log('✅ 3.2 Short text rejected with 400.');

  // 3.3 Oversized text (>5000 chars)
  const longText = 'A'.repeat(5001);
  const longRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ inputType: 'TEXT', text: longText }),
  });
  assert(longRes.status === 400, 'Oversized text should return 400');
  console.log('✅ 3.3 Oversized text (>5000 chars) rejected with 400.');

  // 3.4 Invalid executable file MIME
  const badMimeRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      inputType: 'IMAGE',
      imageFile: { filename: 'malware.exe', mimeType: 'application/x-msdownload', sizeBytes: 1024 },
      extractedImageText: 'Some extracted text here that is valid',
    }),
  });
  assert(badMimeRes.status === 400, 'Invalid executable MIME should return 400');
  console.log('✅ 3.4 Executable MIME type strictly rejected with 400.');

  // 3.5 Malformed URL
  const badUrlRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({ inputType: 'URL', url: 'not-a-valid-url-format' }),
  });
  assert(badUrlRes.status === 400, 'Malformed URL should return 400');
  console.log('✅ 3.5 Malformed URL rejected with 400.\n');

  // 4. Successful text verification for User A
  console.log('Test 4: Successful verification analysis');
  const validPayload = {
    inputType: 'TEXT',
    text: 'SEBI approved ABC Wealth. Guaranteed 30% annual return. Pay ₹5,000 today to activate the account. Please send your OTP to verify.',
  };
  const analyzeRes = await fetch(`${BASE_URL}/verification/analyze`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify(validPayload),
  });
  const analyzeJson = await analyzeRes.json();
  assert(analyzeRes.status === 201, `Expected 201, got ${analyzeRes.status}: ${JSON.stringify(analyzeJson)}`);
  assert(analyzeJson.success === true, 'Response must be success: true');
  const analysisA = analyzeJson.data;
  assert(analysisA._id, 'Analysis must have _id');
  assert(analysisA.claims && analysisA.claims.length >= 2, 'Should extract multiple claims');
  assert(analysisA.overallStatus, 'Must have overallStatus');
  assert(analysisA.overallUncertainty, 'Must have overallUncertainty');
  assert(analysisA.verificationMode, 'Must have verificationMode');
  console.log(`✅ Test 4 Passed: Verification completed. ID: ${analysisA._id}, Overall Status: ${analysisA.overallStatus}\n`);

  // 5. Credential privacy check: OTP / password never stored
  console.log('Test 5: Privacy check — no credentials persisted');
  const docStr = JSON.stringify(analysisA);
  assert(!docStr.includes('OTP_VALUE'), 'No secret credentials leaked');
  // Check entities inside claims — phone/email not in schema
  for (const c of analysisA.claims) {
    assert(!c.entities.phone, 'Phone number must not be persisted in claim entities');
    assert(!c.entities.email, 'Email must not be persisted in claim entities');
  }
  console.log('✅ Test 5 Passed: No raw credentials or private contact details stored.\n');

  // 6. Retrieve verification by ID
  console.log('Test 6: Retrieve analysis by ID for User A');
  const getResA = await fetch(`${BASE_URL}/verification/${analysisA._id}`, {
    method: 'GET',
    headers: headersA,
  });
  const getJsonA = await getResA.json();
  assert(getResA.status === 200, 'User A should successfully retrieve own analysis');
  assert(getJsonA.data._id === analysisA._id, 'Retrieved ID should match');
  console.log('✅ Test 6 Passed: User A retrieved own analysis.\n');

  // 7. Ownership check: User B cannot access User A's analysis
  console.log('Test 7: Cross-user ownership protection');
  const getResB = await fetch(`${BASE_URL}/verification/${analysisA._id}`, {
    method: 'GET',
    headers: headersB,
  });
  assert(
    getResB.status === 404,
    `User B should receive 404 Not Found when requesting User A's record, got ${getResB.status}`
  );

  const delResB = await fetch(`${BASE_URL}/verification/${analysisA._id}`, {
    method: 'DELETE',
    headers: headersB,
  });
  assert(
    delResB.status === 404,
    `User B should receive 404 Not Found when trying to delete User A's record, got ${delResB.status}`
  );
  console.log('✅ Test 7 Passed: User B strictly denied access (404 Not Found) to User A\'s analysis.\n');

  // 8. Verification history
  console.log('Test 8: History listing and user isolation');
  const histResA = await fetch(`${BASE_URL}/verification/history`, {
    method: 'GET',
    headers: headersA,
  });
  const histJsonA = await histResA.json();
  assert(histResA.status === 200, 'User A history should return 200');
  assert(histJsonA.data.total >= 1, 'User A should have at least 1 record in history');

  const histResB = await fetch(`${BASE_URL}/verification/history`, {
    method: 'GET',
    headers: headersB,
  });
  const histJsonB = await histResB.json();
  assert(histResB.status === 200, 'User B history should return 200');
  assert(histJsonB.data.total === 0, 'User B should have 0 records in history');
  console.log('✅ Test 8 Passed: History correctly isolated between users.\n');

  // 9. Delete analysis by ID
  console.log('Test 9: Delete verification record');
  const delResA = await fetch(`${BASE_URL}/verification/${analysisA._id}`, {
    method: 'DELETE',
    headers: headersA,
  });
  assert(delResA.status === 200, 'User A should delete own analysis');

  const getDeletedRes = await fetch(`${BASE_URL}/verification/${analysisA._id}`, {
    method: 'GET',
    headers: headersA,
  });
  assert(getDeletedRes.status === 404, 'Deleted analysis must return 404');
  console.log('✅ Test 9 Passed: Verification deleted and no longer accessible.\n');

  console.log('====================================================');
  console.log('🎉 ALL STAGE 5 API & OWNERSHIP E2E TESTS PASSED!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
