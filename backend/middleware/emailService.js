import https from 'https';
import dotenv from 'dotenv';
import EmailLog from '../models/EmailLog.js';
import {
  getWelcomeTemplate,
  getVerificationTemplate,
  getVerificationSuccessTemplate,
  getPasswordResetTemplate,
  getPasswordChangedTemplate,
  getLoginAlertTemplate,
  getNewDeviceLoginTemplate,
  
  getSignatureRequestTemplate,
  getReminderTemplate,
  getViewedTemplate,
  getDocumentSignedTemplate,
  getAllSignersCompletedTemplate,
  getCompletedOwnerTemplate,
  getCompletedSignerTemplate,
  getDocumentExpiredTemplate,
  getRejectedTemplate,
  getDownloadReadyTemplate,
  getShareLinkCreatedTemplate,
  getDocumentCancelledTemplate,
  getAuditReportGeneratedTemplate,

  getTeamInviteTemplate,
  getTeamMemberAddedTemplate,
  getRoleChangedTemplate,

  getSubscriptionActivatedTemplate,
  getSubscriptionRenewedTemplate,
  getPaymentSuccessfulTemplate,
  getPaymentFailedTemplate,
  getTrialEndingTemplate,
  getPlanUpgradedTemplate,
  getPlanDowngradedTemplate,

  getSecurityAlertTemplate,
  getSuspiciousLoginTemplate,
  getMfaEnabledTemplate,
  getMfaDisabledTemplate
} from '../utils/emailTemplates.js';

dotenv.config();

/**
 * Unified Resend dispatch helper with database logging, plain-text fallback, and tracking
 */
const sendResendEmail = (to, subject, payload, templateName = 'Unknown') => {
  return new Promise((resolve) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[Resend Service] RESEND_API_KEY not set — skipping email dispatch.');
      return resolve({ error: true, message: 'RESEND_API_KEY not configured' });
    }
    const fromAddress = process.env.FROM_EMAIL
      ? `SignFlow AI <${process.env.FROM_EMAIL}>`
      : 'SignFlow AI <onboarding@resend.dev>';
      
    // Resend Payload Construction
    const postData = JSON.stringify({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: payload.html,
      text: payload.text,
      // User tracking request
      tracking_options: {
        click_tracking: true,
        open_tracking: true
      }
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

    EmailLog.create({
      recipient: Array.isArray(to) ? to.join(', ') : to,
      template: templateName,
      subject: subject,
      status: 'Sent'
    }).then((logEntry) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          let responseId = '';
          try {
            const parsed = JSON.parse(data);
            responseId = parsed.id || '';
          } catch (e) {}

          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Resend Service] Email sent successfully: ${data}`);
            logEntry.status = 'Delivered';
            logEntry.messageId = responseId;
            logEntry.providerResponse = data;
            logEntry.save().catch(()=>{});
            resolve({ success: true, id: responseId });
          } else {
            console.error(`[Resend Service] Resend API error: Status ${res.statusCode}, Body: ${data}`);
            logEntry.status = 'Failed';
            logEntry.errorMessage = `Status ${res.statusCode}: ${data}`;
            logEntry.save().catch(()=>{});
            resolve({ error: true, statusCode: res.statusCode, response: data });
          }
        });
      });

      req.on('error', (e) => {
        console.error(`[Resend Service] HTTPS Request Error: ${e.message}`);
        logEntry.status = 'Failed';
        logEntry.errorMessage = e.message;
        logEntry.save().catch(()=>{});
        resolve({ error: true, message: e.message });
      });

      req.write(postData);
      req.end();
    }).catch((err) => {
      console.error('Email log database creation failed:', err);
      // Fallback without logging
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ success: true, raw: data }));
      });
      req.on('error', (e) => resolve({ error: true, message: e.message }));
      req.write(postData);
      req.end();
    });
  });
};


// ============================================================================
// 1. AUTHENTICATION EMAILS
// ============================================================================

export const sendWelcomeEmail = async (email, name) => {
  return sendResendEmail(email, 'Welcome to SignFlow AI', getWelcomeTemplate(name), 'welcome');
};

export const sendVerificationEmail = async (email, name, verificationUrl) => {
  return sendResendEmail(email, 'Verify your SignFlow AI account', getVerificationTemplate(name, verificationUrl), 'verification');
};

export const sendVerificationSuccessEmail = async (email, name) => {
  return sendResendEmail(email, 'Email Verified Successfully', getVerificationSuccessTemplate(name), 'verification-success');
};

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  return sendResendEmail(email, 'Reset your SignFlow AI password', getPasswordResetTemplate(name, resetUrl), 'password-reset');
};

export const sendPasswordChangedEmail = async (email, name) => {
  return sendResendEmail(email, 'Password Changed Successfully', getPasswordChangedTemplate(name), 'password-changed');
};

export const sendLoginAlertEmail = async (email, name, location, time) => {
  return sendResendEmail(email, 'Login Alert', getLoginAlertTemplate(name, location, time), 'login-alert');
};

export const sendNewDeviceLoginEmail = async (email, name, device, location, time) => {
  return sendResendEmail(email, 'New Device Login', getNewDeviceLoginTemplate(name, device, location, time), 'new-device-login');
};

// ============================================================================
// 2. DOCUMENT WORKFLOW EMAILS
// ============================================================================

export const sendInviteEmail = async (recipientEmail, recipientName, docName, editUrl, senderName = 'SignFlow AI Owner', expiryDate) => {
  return sendResendEmail(recipientEmail, `Signature Request: ${docName}`, getSignatureRequestTemplate(senderName, recipientName, docName, editUrl, expiryDate), 'signature-request');
};

export const sendReminderEmail = async (recipientEmail, recipientName, docName, editUrl, senderName = 'SignFlow AI Owner', expiryDate) => {
  return sendResendEmail(recipientEmail, `Reminder: Pending Signature on: ${docName}`, getReminderTemplate(recipientName, docName, editUrl, senderName, expiryDate), 'reminder');
};

export const sendViewedEmail = async (ownerEmail, ownerName, recipientEmail, docName) => {
  return sendResendEmail(ownerEmail, `Document Viewed: ${docName}`, getViewedTemplate(ownerName, recipientEmail, docName), 'viewed');
};

export const sendDocumentSignedEmail = async (ownerEmail, ownerName, signerEmail, docName) => {
  return sendResendEmail(ownerEmail, `Document Signed: ${docName}`, getDocumentSignedTemplate(ownerName, signerEmail, docName), 'document-signed');
};

export const sendAllSignersCompletedEmail = async (ownerEmail, ownerName, docName, downloadUrl) => {
  return sendResendEmail(ownerEmail, `All Signers Completed: ${docName}`, getAllSignersCompletedTemplate(ownerName, docName, downloadUrl), 'all-signers-completed');
};

export const sendCompletionEmail = async (ownerEmail, docName, downloadUrl, ownerName = 'Document Owner') => {
  return sendResendEmail(ownerEmail, `Document Completed & Finalized: ${docName}`, getCompletedOwnerTemplate(ownerName, docName, downloadUrl), 'completed-owner');
};

export const sendCompletedSignerEmail = async (signerEmail, signerName, docName, downloadUrl) => {
  return sendResendEmail(signerEmail, `Executed Copy: ${docName}`, getCompletedSignerTemplate(signerName, docName, downloadUrl), 'completed-signer');
};

export const sendDocumentExpiredEmail = async (ownerEmail, docName, ownerName = 'Document Owner') => {
  return sendResendEmail(ownerEmail, `Document Expired: ${docName}`, getDocumentExpiredTemplate(ownerName, docName), 'document-expired');
};

export const sendRejectionEmail = async (ownerEmail, docName, rejecterName, reason, ownerName = 'Document Owner') => {
  return sendResendEmail(ownerEmail, `Document Declined: ${docName}`, getRejectedTemplate(ownerName, rejecterName, docName, reason), 'rejected');
};

export const sendDownloadReadyEmail = async (email, userName, docName, downloadUrl) => {
  return sendResendEmail(email, `Download Ready: ${docName}`, getDownloadReadyTemplate(userName, docName, downloadUrl), 'download-ready');
};

export const sendShareLinkCreatedEmail = async (ownerEmail, docName, shareUrl, ownerName = 'Document Owner') => {
  return sendResendEmail(ownerEmail, `Public Share Link Enabled: ${docName}`, getShareLinkCreatedTemplate(ownerName, docName, shareUrl), 'share-link-created');
};

export const sendDocumentCancelledEmail = async (recipientEmail, recipientName, docName, cancelerName = 'Owner') => {
  return sendResendEmail(recipientEmail, `Document Cancelled: ${docName}`, getDocumentCancelledTemplate(recipientName, docName, cancelerName), 'document-cancelled');
};

export const sendAuditReportGeneratedEmail = async (email, name, docName, reportUrl) => {
  return sendResendEmail(email, `Audit Report Compiled: ${docName}`, getAuditReportGeneratedTemplate(name, docName, reportUrl), 'audit-report-generated');
};

// ============================================================================
// 3. TEAM & ORGANIZATION EMAILS
// ============================================================================

export const sendTeamInviteEmail = async (email, inviterName, workspaceName, inviteUrl) => {
  return sendResendEmail(email, `Join Workspace: ${workspaceName}`, getTeamInviteTemplate(inviterName, workspaceName, inviteUrl), 'team-invite');
};

export const sendTeamMemberAddedEmail = async (ownerEmail, ownerName, newMemberEmail, workspaceName) => {
  return sendResendEmail(ownerEmail, 'New Team Member Added', getTeamMemberAddedTemplate(ownerName, newMemberEmail, workspaceName), 'team-member-added');
};

export const sendRoleChangedEmail = async (email, userName, newRole, workspaceName) => {
  return sendResendEmail(email, 'Your Role Has Been Updated', getRoleChangedTemplate(userName, newRole, workspaceName), 'role-changed');
};

// ============================================================================
// 4. BILLING EMAILS
// ============================================================================

export const sendSubscriptionActivatedEmail = async (email, name, planName, amount) => {
  return sendResendEmail(email, 'Subscription Activated', getSubscriptionActivatedTemplate(name, planName, amount), 'subscription-activated');
};

export const sendSubscriptionRenewedEmail = async (email, name, planName, amount) => {
  return sendResendEmail(email, 'Subscription Renewed', getSubscriptionRenewedTemplate(name, planName, amount), 'subscription-renewed');
};

export const sendPaymentSuccessfulEmail = async (email, name, amount, invoiceUrl) => {
  return sendResendEmail(email, 'Payment Successful', getPaymentSuccessfulTemplate(name, amount, invoiceUrl), 'payment-successful');
};

export const sendPaymentFailedEmail = async (email, name, amount, updateUrl) => {
  return sendResendEmail(email, 'Payment Failed', getPaymentFailedTemplate(name, amount, updateUrl), 'payment-failed');
};

export const sendTrialEndingEmail = async (email, name, planName, upgradeUrl) => {
  return sendResendEmail(email, 'Trial Ending Soon', getTrialEndingTemplate(name, planName, upgradeUrl), 'trial-ending');
};

export const sendPlanUpgradedEmail = async (email, name, planName) => {
  return sendResendEmail(email, 'Plan Upgraded', getPlanUpgradedTemplate(name, planName), 'plan-upgraded');
};

export const sendPlanDowngradedEmail = async (email, name, planName) => {
  return sendResendEmail(email, 'Plan Downgraded', getPlanDowngradedTemplate(name, planName), 'plan-downgraded');
};

// ============================================================================
// 5. SECURITY EMAILS
// ============================================================================

export const sendSecurityAlertEmail = async (email, name, eventDescription, time) => {
  return sendResendEmail(email, 'Security Alert', getSecurityAlertTemplate(name, eventDescription, time), 'security-alert');
};

export const sendSuspiciousLoginEmail = async (email, name, location, device, time) => {
  return sendResendEmail(email, 'Suspicious Login Attempt Blocked', getSuspiciousLoginTemplate(name, location, device, time), 'suspicious-login');
};

export const sendMfaEnabledEmail = async (email, name) => {
  return sendResendEmail(email, 'Two-Factor Authentication Enabled', getMfaEnabledTemplate(name), 'mfa-enabled');
};

export const sendMfaDisabledEmail = async (email, name) => {
  return sendResendEmail(email, 'Two-Factor Authentication Disabled', getMfaDisabledTemplate(name), 'mfa-disabled');
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
