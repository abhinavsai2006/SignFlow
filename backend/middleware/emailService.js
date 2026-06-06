import https from 'https';
import dotenv from 'dotenv';
import {
  getWelcomeTemplate,
  getVerificationTemplate,
  getPasswordResetTemplate,
  getSignatureRequestTemplate,
  getReminderTemplate,
  getViewedTemplate,
  getCompletedOwnerTemplate,
  getCompletedSignerTemplate,
  getRejectedTemplate,
  getShareLinkCreatedTemplate,
  getDocumentExpiredTemplate,
  getDocumentCancelledTemplate,
  getAuditReportGeneratedTemplate,
  getTeamInviteTemplate
} from '../utils/emailTemplates.js';

dotenv.config();

// Unified Resend dispatch helper
const sendResendEmail = (to, subject, html) => {
  return new Promise((resolve) => {
    const apiKey = process.env.RESEND_API_KEY || 're_ZS133hRk_GL6e3sy5X4EF1HgZG3YTs3PA';
    const postData = JSON.stringify({
      from: 'SignFlow AI <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`[Resend Service] Dispatching email to <${to}> with subject: "${subject}"...`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[Resend Service] Email sent successfully: ${data}`);
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            resolve({ success: true, raw: data });
          }
        } else {
          console.error(`[Resend Service] Resend API error: Status ${res.statusCode}, Body: ${data}`);
          // Fallback simulation print
          printSimulatedMail(to, subject, html);
          resolve({ error: true, statusCode: res.statusCode, response: data });
        }
      });
    });

    req.on('error', (e) => {
      console.error(`[Resend Service] HTTPS Request Error: ${e.message}`);
      printSimulatedMail(to, subject, html);
      resolve({ error: true, message: e.message });
    });

    req.write(postData);
    req.end();
  });
};

// Console logger fallback if API fails
const printSimulatedMail = (to, subject, html) => {
  console.log('\n--- [SIMULATED EMAIL NOTIFICATION FALLBACK] ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('--- Body (HTML truncated) ---');
  console.log(html.substring(0, 300) + '...');
  console.log('-------------------------------------------------\n');
};

// 1. Welcome Email
export const sendWelcomeEmail = async (email, name) => {
  const html = getWelcomeTemplate(name);
  return sendResendEmail(email, 'Welcome to SignFlow AI', html);
};

// 2. Email Verification
export const sendVerificationEmail = async (email, name, verificationUrl) => {
  const html = getVerificationTemplate(name, verificationUrl);
  return sendResendEmail(email, 'Verify your SignFlow AI account', html);
};

// 3. Password Reset
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = getPasswordResetTemplate(name, resetUrl);
  return sendResendEmail(email, 'Reset your SignFlow AI password', html);
};

// 4. Signature Request
export const sendInviteEmail = async (recipientEmail, recipientName, docName, editUrl, senderName = 'SignFlow AI Owner') => {
  const html = getSignatureRequestTemplate(senderName, recipientName, docName, editUrl);
  return sendResendEmail(recipientEmail, `Signature Request for: ${docName}`, html);
};

// 5. Reminder
export const sendReminderEmail = async (recipientEmail, recipientName, docName, editUrl) => {
  const html = getReminderTemplate(recipientName, docName, editUrl);
  return sendResendEmail(recipientEmail, `Reminder: Pending Signature on: ${docName}`, html);
};

// 6. Viewed
export const sendViewedEmail = async (ownerEmail, ownerName, recipientEmail, docName) => {
  const html = getViewedTemplate(ownerName, recipientEmail, docName);
  return sendResendEmail(ownerEmail, `Document Viewed: ${docName}`, html);
};

// 7. Completed (Owner)
export const sendCompletionEmail = async (ownerEmail, docName, downloadUrl, ownerName = 'Document Owner') => {
  const html = getCompletedOwnerTemplate(ownerName, docName, downloadUrl);
  return sendResendEmail(ownerEmail, `Document Completed & Finalized: ${docName}`, html);
};

// 8. Completed (Signer)
export const sendCompletedSignerEmail = async (signerEmail, signerName, docName, downloadUrl) => {
  const html = getCompletedSignerTemplate(signerName, docName, downloadUrl);
  return sendResendEmail(signerEmail, `Executed Copy: ${docName}`, html);
};

// 9. Rejected
export const sendRejectionEmail = async (ownerEmail, docName, rejecterName, reason, ownerName = 'Document Owner') => {
  const html = getRejectedTemplate(ownerName, rejecterName, docName, reason);
  return sendResendEmail(ownerEmail, `Document Declined: ${docName}`, html);
};

// 10. Share Link Created
export const sendShareLinkCreatedEmail = async (ownerEmail, docName, shareUrl, ownerName = 'Document Owner') => {
  const html = getShareLinkCreatedTemplate(ownerName, docName, shareUrl);
  return sendResendEmail(ownerEmail, `Public Share Link Enabled: ${docName}`, html);
};

// 11. Document Expired
export const sendDocumentExpiredEmail = async (ownerEmail, docName, ownerName = 'Document Owner') => {
  const html = getDocumentExpiredTemplate(ownerName, docName);
  return sendResendEmail(ownerEmail, `Document Expired: ${docName}`, html);
};

// 12. Document Cancelled
export const sendDocumentCancelledEmail = async (recipientEmail, recipientName, docName, cancelerName = 'Owner') => {
  const html = getDocumentCancelledTemplate(recipientName, docName, cancelerName);
  return sendResendEmail(recipientEmail, `Document Cancelled: ${docName}`, html);
};

// 13. Audit Report Generated
export const sendAuditReportGeneratedEmail = async (email, name, docName, reportUrl) => {
  const html = getAuditReportGeneratedTemplate(name, docName, reportUrl);
  return sendResendEmail(email, `Audit Report Compiled: ${docName}`, html);
};

// 14. Team Invite
export const sendTeamInviteEmail = async (email, inviterName, workspaceName, inviteUrl) => {
  const html = getTeamInviteTemplate(inviterName, workspaceName, inviteUrl);
  return sendResendEmail(email, `Join Workspace: ${workspaceName}`, html);
};
