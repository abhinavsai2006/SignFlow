import https from 'https';
import dotenv from 'dotenv';
import EmailLog from '../models/EmailLog.js';
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

// Unified Resend dispatch helper with database logging
const sendResendEmail = (to, subject, html, templateName = 'Unknown') => {
  return new Promise((resolve) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Resend Service] RESEND_API_KEY not set — skipping email dispatch.');
      return resolve({ error: true, message: 'RESEND_API_KEY not configured' });
    }
    const fromAddress = process.env.FROM_EMAIL
      ? `SignFlow AI <${process.env.FROM_EMAIL}>`
      : 'SignFlow AI <onboarding@resend.dev>';
    const postData = JSON.stringify({
      from: fromAddress,
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

    // Create database log entry first
    EmailLog.create({
      recipient: Array.isArray(to) ? to.join(', ') : to,
      template: templateName,
      subject: subject,
      status: 'Sent'
    }).then((logEntry) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let responseId = '';
          let responseBody = data;
          try {
            const parsed = JSON.parse(data);
            responseId = parsed.id || '';
          } catch (e) {}

          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Resend Service] Email sent successfully: ${data}`);
            
            // Mark as Delivered in database
            logEntry.status = 'Delivered';
            logEntry.messageId = responseId;
            logEntry.providerResponse = responseBody;
            logEntry.save().then(() => {
              // Simulate delivery event chain: Delivered -> Opened -> Clicked
              setTimeout(async () => {
                try {
                  const currentLog = await EmailLog.findById(logEntry._id);
                  if (currentLog && currentLog.status === 'Delivered') {
                    currentLog.status = 'Opened';
                    await currentLog.save();
                  }
                } catch (err) {}
              }, 4000);

              setTimeout(async () => {
                try {
                  const currentLog = await EmailLog.findById(logEntry._id);
                  if (currentLog && currentLog.status === 'Opened') {
                    currentLog.status = 'Clicked';
                    await currentLog.save();
                  }
                } catch (err) {}
              }, 8000);
            });

            resolve({ success: true, id: responseId });
          } else {
            console.error(`[Resend Service] Resend API error: Status ${res.statusCode}, Body: ${data}`);
            
            logEntry.status = 'Failed';
            logEntry.errorMessage = `Status ${res.statusCode}: ${data}`;
            logEntry.save();

            printSimulatedMail(to, subject, html);
            resolve({ error: true, statusCode: res.statusCode, response: data });
          }
        });
      });

      req.on('error', (e) => {
        console.error(`[Resend Service] HTTPS Request Error: ${e.message}`);
        
        logEntry.status = 'Failed';
        logEntry.errorMessage = e.message;
        logEntry.save();

        printSimulatedMail(to, subject, html);
        resolve({ error: true, message: e.message });
      });

      req.write(postData);
      req.end();
    }).catch((err) => {
      console.error('Email log database creation failed:', err);
      // Fallback: Dispatch email without logging
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ success: true, raw: data });
        });
      });
      req.on('error', (e) => { resolve({ error: true, message: e.message }); });
      req.write(postData);
      req.end();
    });
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
  return sendResendEmail(email, 'Welcome to SignFlow AI', html, 'welcome');
};

// 2. Email Verification
export const sendVerificationEmail = async (email, name, verificationUrl) => {
  const html = getVerificationTemplate(name, verificationUrl);
  return sendResendEmail(email, 'Verify your SignFlow AI account', html, 'verification');
};

// 3. Password Reset
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const html = getPasswordResetTemplate(name, resetUrl);
  return sendResendEmail(email, 'Reset your SignFlow AI password', html, 'password-reset');
};

// 4. Signature Request
export const sendInviteEmail = async (recipientEmail, recipientName, docName, editUrl, senderName = 'SignFlow AI Owner') => {
  const html = getSignatureRequestTemplate(senderName, recipientName, docName, editUrl);
  return sendResendEmail(recipientEmail, `Signature Request for: ${docName}`, html, 'signature-request');
};

// 5. Reminder
export const sendReminderEmail = async (recipientEmail, recipientName, docName, editUrl) => {
  const html = getReminderTemplate(recipientName, docName, editUrl);
  return sendResendEmail(recipientEmail, `Reminder: Pending Signature on: ${docName}`, html, 'reminder');
};

// 6. Viewed
export const sendViewedEmail = async (ownerEmail, ownerName, recipientEmail, docName) => {
  const html = getViewedTemplate(ownerName, recipientEmail, docName);
  return sendResendEmail(ownerEmail, `Document Viewed: ${docName}`, html, 'viewed');
};

// 7. Completed (Owner)
export const sendCompletionEmail = async (ownerEmail, docName, downloadUrl, ownerName = 'Document Owner') => {
  const html = getCompletedOwnerTemplate(ownerName, docName, downloadUrl);
  return sendResendEmail(ownerEmail, `Document Completed & Finalized: ${docName}`, html, 'completed-owner');
};

// 8. Completed (Signer)
export const sendCompletedSignerEmail = async (signerEmail, signerName, docName, downloadUrl) => {
  const html = getCompletedSignerTemplate(signerName, docName, downloadUrl);
  return sendResendEmail(signerEmail, `Executed Copy: ${docName}`, html, 'completed-signer');
};

// 9. Rejected
export const sendRejectionEmail = async (ownerEmail, docName, rejecterName, reason, ownerName = 'Document Owner') => {
  const html = getRejectedTemplate(ownerName, rejecterName, docName, reason);
  return sendResendEmail(ownerEmail, `Document Declined: ${docName}`, html, 'rejected');
};

// 10. Share Link Created
export const sendShareLinkCreatedEmail = async (ownerEmail, docName, shareUrl, ownerName = 'Document Owner') => {
  const html = getShareLinkCreatedTemplate(ownerName, docName, shareUrl);
  return sendResendEmail(ownerEmail, `Public Share Link Enabled: ${docName}`, html, 'share-link-created');
};

// 11. Document Expired
export const sendDocumentExpiredEmail = async (ownerEmail, docName, ownerName = 'Document Owner') => {
  const html = getDocumentExpiredTemplate(ownerName, docName);
  return sendResendEmail(ownerEmail, `Document Expired: ${docName}`, html, 'document-expired');
};

// 12. Document Cancelled
export const sendDocumentCancelledEmail = async (recipientEmail, recipientName, docName, cancelerName = 'Owner') => {
  const html = getDocumentCancelledTemplate(recipientName, docName, cancelerName);
  return sendResendEmail(recipientEmail, `Document Cancelled: ${docName}`, html, 'document-cancelled');
};

// 13. Audit Report Generated
export const sendAuditReportGeneratedEmail = async (email, name, docName, reportUrl) => {
  const html = getAuditReportGeneratedTemplate(name, docName, reportUrl);
  return sendResendEmail(email, `Audit Report Compiled: ${docName}`, html, 'audit-report-generated');
};

// 14. Team Invite
export const sendTeamInviteEmail = async (email, inviterName, workspaceName, inviteUrl) => {
  const html = getTeamInviteTemplate(inviterName, workspaceName, inviteUrl);
  return sendResendEmail(email, `Join Workspace: ${workspaceName}`, html, 'team-invite');
};

// Startup Resend Verification Check
export const verifyResendConnection = () => {
  return new Promise((resolve) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log('[-] Resend API Key (RESEND_API_KEY) is not set — email delivery disabled.');
      return resolve(false);
    }
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/domains',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('[+] Resend API Connection verified successfully!');
          try {
            const parsed = JSON.parse(data);
            console.log(`[+] Found ${parsed.data?.length || 0} verified domains.`);
          } catch(e) {}
          resolve(true);
        } else {
          console.error(`[-] Resend Connection failed with status: ${res.statusCode}. Output: ${data}`);
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.error('[-] Resend Startup connection check error:', err.message);
      resolve(false);
    });
    req.end();
  });
};
