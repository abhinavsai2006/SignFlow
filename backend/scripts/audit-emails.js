import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as templates from '../utils/emailTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auditReportPath = path.join(__dirname, '..', '..', 'EMAIL_AUDIT_REPORT.md');

const EXPECTED_TEMPLATES = [
  'getWelcomeTemplate', 'getVerificationTemplate', 'getVerificationSuccessTemplate',
  'getPasswordResetTemplate', 'getPasswordChangedTemplate', 'getLoginAlertTemplate',
  'getNewDeviceLoginTemplate', 'getSignatureRequestTemplate', 'getReminderTemplate',
  'getViewedTemplate', 'getDocumentSignedTemplate', 'getAllSignersCompletedTemplate',
  'getCompletedOwnerTemplate', 'getCompletedSignerTemplate', 'getDocumentExpiredTemplate',
  'getRejectedTemplate', 'getDownloadReadyTemplate', 'getShareLinkCreatedTemplate',
  'getDocumentCancelledTemplate', 'getAuditReportGeneratedTemplate', 'getTeamInviteTemplate',
  'getTeamMemberAddedTemplate', 'getRoleChangedTemplate', 'getSubscriptionActivatedTemplate',
  'getSubscriptionRenewedTemplate', 'getPaymentSuccessfulTemplate', 'getPaymentFailedTemplate',
  'getTrialEndingTemplate', 'getPlanUpgradedTemplate', 'getPlanDowngradedTemplate',
  'getSecurityAlertTemplate', 'getSuspiciousLoginTemplate', 'getMfaEnabledTemplate',
  'getMfaDisabledTemplate'
];

async function runAudit() {
  console.log('Starting Email Template Audit...\n');
  
  let report = `# SignFlow AI Email Template Audit\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  let passed = 0;
  let failed = 0;
  
  const results = [];

  for (const funcName of EXPECTED_TEMPLATES) {
    if (typeof templates[funcName] !== 'function') {
      console.error(`[FAIL] Missing template function: ${funcName}`);
      results.push({ name: funcName, status: 'FAIL', reason: 'Function missing from emailTemplates.js' });
      failed++;
      continue;
    }

    try {
      // Execute the template with dummy data
      const payload = templates[funcName]('Dummy', 'Dummy', 'Dummy', 'Dummy', 'Dummy');
      const { html, text } = payload;
      
      const errors = [];
      
      // Validation 1: No localhost
      if (html.includes('localhost') || html.includes('127.0.0.1')) {
        errors.push('Contains hardcoded localhost');
      }
      if (text.includes('localhost') || text.includes('127.0.0.1')) {
        errors.push('Text fallback contains hardcoded localhost');
      }

      // Validation 2: No undefined or raw brackets
      if (html.includes('undefined')) {
        errors.push('Contains "undefined" text');
      }
      if (html.includes('{{') || html.includes('}}')) {
        errors.push('Contains unparsed {{ }} brackets');
      }

      // Validation 3: Essential HTML components
      if (!html.includes('<html') || !html.includes('SignFlow AI')) {
        errors.push('Missing core HTML structure or branding');
      }

      // Validation 4: Plain text fallback exists
      if (!text || text.length < 50) {
        errors.push('Plain text fallback missing or too short');
      }

      if (errors.length > 0) {
        console.error(`[FAIL] ${funcName}`);
        errors.forEach(e => console.error(`  - ${e}`));
        results.push({ name: funcName, status: 'FAIL', reason: errors.join(', ') });
        failed++;
      } else {
        console.log(`[PASS] ${funcName}`);
        results.push({ name: funcName, status: 'PASS', reason: '' });
        passed++;
      }
    } catch (err) {
      console.error(`[ERROR] ${funcName} threw an exception: ${err.message}`);
      results.push({ name: funcName, status: 'ERROR', reason: err.message });
      failed++;
    }
  }

  report += `## Summary\n`;
  report += `- **Total Templates Expected:** ${EXPECTED_TEMPLATES.length}\n`;
  report += `- **Passed:** ${passed}\n`;
  report += `- **Failed:** ${failed}\n\n`;

  report += `## Details\n\n`;
  report += `| Template Name | Status | Notes |\n`;
  report += `| --- | --- | --- |\n`;
  results.forEach(r => {
    report += `| ${r.name} | ${r.status === 'PASS' ? '✅ PASS' : '❌ ' + r.status} | ${r.reason} |\n`;
  });

  fs.writeFileSync(auditReportPath, report);
  console.log(`\nAudit complete. Report generated at: ${auditReportPath}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
