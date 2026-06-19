// Node 18+ has native fetch
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const API_BASE = `http://localhost:${PORT}/api`;

async function runAudit() {
  console.log('--- SIGNFLOW E2E AUDIT ---');
  let token = '';
  let docId = '';

  try {
    // 1. Register User
    console.log('[~] Step 1: Registering E2E test user...');
    const email = `e2e_test_${Date.now()}@example.com`;
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Tester', email, password: 'Password123!', companyName: 'Test Inc' })
    });
    
    if (!regRes.ok && regRes.status !== 400) {
      const errText = await regRes.text();
      throw new Error(`Registration failed: ${regRes.status} - ${errText}`);
    }

    // 2. Login
    console.log('[~] Step 2: Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    if (!loginData.requiresOtp) {
      throw new Error('Login failed: Expected OTP requirement response');
    }
    
    // Verify OTP to get token
    console.log('[~] Step 2b: Verifying login OTP...');
    const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: loginData.loginOtp })
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.accessToken) throw new Error('OTP Verification failed: No token received');
    token = verifyData.accessToken;

    // 3. Document Flow Verification
    console.log('[~] Step 3: Verifying Document endpoints are secured...');
    const docRes = await fetch(`${API_BASE}/docs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!docRes.ok) throw new Error(`Fetch docs failed: ${docRes.status}`);
    const docs = await docRes.json();
    console.log(`[+] Found ${docs.length} documents for new user.`);

    console.log('[+] E2E API Verification Passed.');
    process.exit(0);

  } catch (err) {
    console.error('[-] E2E Audit Failed:', err.message);
    process.exit(1);
  }
}

runAudit();
