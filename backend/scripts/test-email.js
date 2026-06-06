import { Resend } from 'resend';
import dotenv from 'dotenv';
import * as emailService from '../middleware/emailService.js';

dotenv.config();

const args = process.argv.slice(2);
const testAll = args.includes('--all');

async function runTests() {
  console.log('--- SIGNFLOW AI EMAIL TESTING ---');
  if (!process.env.RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY is not configured in .env');
    process.exit(1);
  }

  const testEmail = 'mndabhinavsai@gmail.com';
  
  const coreTests = [
    { name: 'Welcome Email', fn: () => emailService.sendWelcomeEmail(testEmail, 'Test User') },
    { name: 'Password Reset', fn: () => emailService.sendPasswordResetEmail(testEmail, 'Test User', 'https://signflow.abhinavsai.com/reset') },
    { name: 'Signature Request', fn: () => emailService.sendInviteEmail(testEmail, 'Test User', 'NDA.pdf', 'https://signflow.abhinavsai.com/sign', 'Sender', '2026-12-31') },
    { name: 'Document Completed', fn: () => emailService.sendCompletionEmail(testEmail, 'NDA.pdf', 'https://signflow.abhinavsai.com/download', 'Test User') },
    { name: 'Billing Success', fn: () => emailService.sendPaymentSuccessfulEmail(testEmail, 'Test User', '$19.00', 'https://signflow.abhinavsai.com/invoice') }
  ];

  const allTests = [
    ...coreTests,
    { name: 'Verification', fn: () => emailService.sendVerificationEmail(testEmail, 'Test User', 'https://signflow.abhinavsai.com/verify') },
    { name: 'Login Alert', fn: () => emailService.sendLoginAlertEmail(testEmail, 'Test User', 'Vijayawada, India', new Date().toLocaleString()) },
    { name: 'Team Invite', fn: () => emailService.sendTeamInviteEmail(testEmail, 'Test User', 'Engineering', 'https://signflow.abhinavsai.com/join') },
    { name: 'Security Alert', fn: () => emailService.sendSecurityAlertEmail(testEmail, 'Test User', 'New Device Added', new Date().toLocaleString()) },
    // Only testing a subset of "all" to prevent API rate limiting from bouncing 27 emails at once in real execution
    // unless strictly required. The script will dynamically call all exposed functions if --all is true.
  ];

  const targetTests = testAll ? Object.keys(emailService).filter(k => k.startsWith('send')).map(k => {
    return { name: k, fn: () => emailService[k](testEmail, 'TestParam1', 'TestParam2', 'TestParam3', 'TestParam4', 'TestParam5') }
  }) : coreTests;

  console.log(`Executing ${targetTests.length} email tests...\n`);
  
  let successCount = 0;
  let failureCount = 0;

  for (const test of targetTests) {
    try {
      const res = await test.fn();
      if (res && res.success) {
        console.log(`[✓ Success] ${test.name} -> Resend ID: ${res.id || 'Unknown'}`);
        successCount++;
      } else {
        console.error(`[✗ Failure] ${test.name} -> Error: ${res ? res.message : 'Unknown'}`);
        failureCount++;
      }
    } catch (e) {
      console.error(`[✗ Exception] ${test.name} -> Error: ${e.message}`);
      failureCount++;
    }
    // Add small delay to respect Resend rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Passed: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  
  if (failureCount > 0) process.exit(1);
}

runTests();
