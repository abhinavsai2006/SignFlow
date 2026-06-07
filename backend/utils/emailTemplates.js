// Resolve frontend URL at render time so templates work in any environment
const getFrontendUrl = () => process.env.FRONTEND_URL || 'https://signflow.abhinavsai.com';

/**
 * Strips HTML to generate a clean plain-text fallback.
 */
const generatePlainText = ({ title, subtitle, message, ctaText, ctaUrl, detailsCard, isMarketing }) => {
  let text = `${title}\n`;
  if (subtitle) text += `${subtitle}\n\n`;
  text += `${message.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '')}\n\n`;

  if (detailsCard) {
    text += `--- ${detailsCard.title || 'DETAILS'} ---\n`;
    detailsCard.fields.forEach(f => {
      text += `${f.label}: ${f.value}\n`;
    });
    text += `----------------------\n\n`;
  }

  if (ctaText && ctaUrl) {
    text += `[ ${ctaText} ]\n${ctaUrl}\n\n`;
  }

  text += `Security & Compliance:\n✓ Tamper-Proof Audit Trail\n✓ End-to-End Encryption\n✓ Signer Identity Verification\n✓ Legally Binding Electronic Signatures\n✓ Timestamp Verification\n✓ Unique Document Hash Protection\n\n`;
  
  if (isMarketing) {
    text += `Manage Preferences | Unsubscribe\n`;
  }
  
  text += `© ${new Date().getFullYear()} SignFlow. All Rights Reserved.`;
  return text;
};

/**
 * Universal HTML Email Generator for SignFlow
 */
export const generateEmailTemplate = ({
  title,
  subtitle,
  message,
  ctaText,
  ctaUrl,
  badgeText,
  detailsCard,
  isMarketing = false
}) => {

  const badgeHtml = badgeText ? `
<span class="email-badge" style="
background:#f1f5f9;
color:#475569;
padding:6px 12px;
border-radius:6px;
font-size:11px;
font-weight:600;
letter-spacing:0.05em;
text-transform:uppercase;
display:inline-block;
border:1px solid #e2e8f0;">
${badgeText}
</span>` : '';

  let detailsCardHtml = '';
  if (detailsCard && detailsCard.fields && detailsCard.fields.length > 0) {
    let fieldsHtml = detailsCard.fields.map((field, index) => {
      const isLast = index === detailsCard.fields.length - 1;
      const divider = isLast ? '' : '<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">';
      return `
<p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:600;letter-spacing:0.05em;">
${field.label}
</p>
<p style="
margin:6px 0 0 0;
font-size:${index === 0 ? '18px' : '14px'};
font-weight:${index === 0 ? '600' : '500'};
color:#0f172a;">
${field.value}
</p>
${divider}`;
    }).join('\n');

    detailsCardHtml = `
<tr>
<td class="email-details-container" style="padding:0 24px 24px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:12px;
padding:20px;">
<tr>
<td>
${fieldsHtml}
</td>
</tr>
</table>
</td>
</tr>`;
  }

  const ctaHtml = ctaText && ctaUrl ? `
<tr>
<td class="email-cta-container" align="center" style="padding:8px 24px 32px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<a href="${ctaUrl}" class="email-button"
style="
background:#0f172a;
color:#ffffff;
text-decoration:none;
padding:0 24px;
height:48px;
line-height:48px;
border-radius:8px;
font-size:14px;
font-weight:500;
display:inline-block;
text-align:center;
box-sizing:border-box;
width:100%;
max-width:320px;">
${ctaText}
</a>
</td>
</tr>
</table>
</td>
</tr>` : '';

  const unsubscribeHtml = isMarketing ? `
<p style="
margin-top:16px;
font-size:11px;
line-height:1.6;
color:#64748b;">
<a href="${getFrontendUrl()}/unsubscribe" style="color:#64748b;text-decoration:underline;">Unsubscribe</a> • 
<a href="${getFrontendUrl()}/preferences" style="color:#64748b;text-decoration:underline;">Manage Preferences</a>
</p>
  ` : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - SignFlow</title>
<style type="text/css">
  @media only screen and (max-width: 600px) {
    .email-wrapper {
      width: 100% !important;
      padding: 12px !important;
    }
    .email-container {
      width: 100% !important;
      border-radius: 8px !important;
    }
    .email-header {
      padding: 24px 16px 16px 16px !important;
    }
    .email-body {
      padding: 20px 16px !important;
    }
    .email-details-container {
      padding: 0 16px 16px 16px !important;
    }
    .email-cta-container {
      padding: 8px 16px 24px 16px !important;
    }
    .email-button {
      max-width: 100% !important;
      width: 100% !important;
      display: block !important;
    }
    .email-card-section {
      padding: 0 16px 20px 16px !important;
    }
    .email-footer {
      padding: 24px 16px !important;
    }
  }
</style>
</head>

<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fafafa">
<tr>
<td class="email-wrapper" align="center" style="padding:40px 20px;">

<table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0"
style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;max-width:600px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,0.02);">

<!-- Header -->
<tr>
<td class="email-header" style="padding:32px 24px 20px 24px;border-bottom:1px solid #f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="left" valign="middle">
<h1 style="margin:0;color:#0f172a;font-size:20px;font-weight:700;letter-spacing:-0.02em;">
SignFlow
</h1>
<p style="margin:4px 0 0 0;color:#64748b;font-size:12px;">
Digitally Secure. Legally Trusted.
</p>
</td>
<td align="right" valign="middle">
${badgeHtml}
</td>
</tr>
</table>
</td>
</tr>

<!-- Title & Message -->
<tr>
<td class="email-body" style="padding:32px 24px 24px 24px;">
<h2 style="
margin:0 0 16px 0;
font-size:22px;
line-height:1.3;
font-weight:700;
letter-spacing:-0.01em;
color:#0f172a;">
${title}
</h2>
<p style="
font-size:15px;
line-height:1.6;
color:#334155;
margin:0;">
${message}
</p>
</td>
</tr>

<!-- Details Card -->
${detailsCardHtml}

<!-- CTA Button -->
${ctaHtml}

<!-- Security & Compliance -->
<tr>
<td class="email-card-section" style="padding:0 24px 24px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="
background:#ffffff;
border:1px solid #e2e8f0;
border-radius:12px;">
<tr>
<td style="padding:20px;">
<h3 style="
margin:0 0 12px 0;
font-size:14px;
font-weight:600;
color:#0f172a;">
Security & Compliance
</h3>
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:4px 0;font-size:13px;color:#475569;">✓ Tamper-Proof Audit Trail</td></tr>
  <tr><td style="padding:4px 0;font-size:13px;color:#475569;">✓ End-to-End Encryption</td></tr>
  <tr><td style="padding:4px 0;font-size:13px;color:#475569;">✓ Signer Identity Verification</td></tr>
  <tr><td style="padding:4px 0;font-size:13px;color:#475569;">✓ Legally Binding Electronic Signatures</td></tr>
  <tr><td style="padding:4px 0;font-size:13px;color:#475569;">✓ Timestamp Verification</td></tr>
  <tr><td style="padding:4px 0;font-size:13px;color:#475569;">✓ Unique Document Hash Protection</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>

<!-- Help Section -->
<tr>
<td class="email-card-section" style="padding:0 24px 24px 24px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="
background:#f8fafc;
border:1px solid #e2e8f0;
border-radius:12px;
padding:20px;">
<tr>
<td>
<h3 style="
margin:0 0 8px 0;
color:#0f172a;
font-size:14px;
font-weight:600;">
Need Help?
</h3>
<p style="
margin:0;
color:#475569;
font-size:13px;
line-height:1.5;">
If you have questions regarding this email or the SignFlow platform,
please contact support or your account administrator.
</p>
</td>
</tr>
</table>
</td>
</tr>

<!-- Footer -->
<tr>
<td class="email-footer" style="
padding:32px 24px;
border-top:1px solid #f1f5f9;
background:#fafafa;
text-align:center;">
<p style="
margin:0;
font-size:11px;
color:#64748b;">
© ${new Date().getFullYear()} SignFlow. All Rights Reserved.
</p>
<p style="
margin:8px 0 0 0;
font-size:11px;
color:#64748b;">
Privacy Policy • Terms of Service • Security Center
</p>
<p style="
margin:16px 0 0 0;
font-size:11px;
line-height:1.6;
color:#94a3b8;">
This email contains secure information generated through
SignFlow. Electronic signatures completed through SignFlow
include audit trails, signer verification, timestamps, and document
integrity protection mechanisms.
</p>
${unsubscribeHtml}
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

  const text = generatePlainText({ title, subtitle, message, ctaText, ctaUrl, detailsCard, isMarketing });

  return { html, text };
};


// ============================================================================
// 1. AUTHENTICATION EMAILS
// ============================================================================

export const getWelcomeTemplate = (name) => {
  return generateEmailTemplate({
    title: 'Welcome to SignFlow',
    message: `Hello ${name},<br><br>Welcome to the Future of e-Signatures! We are thrilled to welcome you to SignFlow—the enterprise-grade electronic signature platform designed for speed, security, and absolute compliance.<br><br>Get started by uploading your first document or exploring your dashboard.`,
    ctaText: 'Go to Dashboard',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'NEW ACCOUNT',
    detailsCard: {
      title: 'ACCOUNT INFORMATION',
      fields: [
         { label: 'WORKSPACE', value: 'SignFlow' },
         { label: 'PLAN', value: 'Free Trial' },
         { label: 'STATUS', value: 'Active' }
      ]
    },
    isMarketing: true
  });
};

export const getVerificationTemplate = (name, url) => {
  return generateEmailTemplate({
    title: 'Verify Your Email',
    message: `Hello ${name},<br><br>Thank you for signing up for SignFlow. To finalize your account setup and unlock all enterprise signature features, please verify your email address.`,
    ctaText: 'Verify Account',
    ctaUrl: url,
    badgeText: 'ACTION REQUIRED'
  });
};

export const getVerificationSuccessTemplate = (name) => {
  return generateEmailTemplate({
    title: 'Email Verified Successfully',
    message: `Hello ${name},<br><br>Your email address has been successfully verified. Your account is now fully active and ready to use.`,
    ctaText: 'Go to Dashboard',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'VERIFIED'
  });
};

export const getLoginOtpTemplate = (name, otp) => {
  return generateEmailTemplate({
    title: 'One-Time Verification Code',
    message: `Hello ${name},<br><br>Here is your one-time verification code (OTP) to complete your login. This code is valid for 10 minutes:<br><br><span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a; font-family: 'Courier New', Courier, monospace; background:#f1f5f9; padding:8px 16px; border-radius:6px; border:1px solid #e2e8f0; display:inline-block;">${otp}</span>`,
    badgeText: 'SECURITY VERIFICATION'
  });
};

export const getPasswordResetTemplate = (name, url) => {
  return generateEmailTemplate({
    title: 'Reset Your Password',
    message: `Hello ${name},<br><br>We received a request to reset your password for your SignFlow account. This link is valid for 1 hour.`,
    ctaText: 'Reset Password',
    ctaUrl: url,
    badgeText: 'SECURITY'
  });
};

export const getPasswordChangedTemplate = (name) => {
  return generateEmailTemplate({
    title: 'Password Changed Successfully',
    message: `Hello ${name},<br><br>Your SignFlow account password has been successfully updated. If you did not make this change, please contact support immediately.`,
    ctaText: 'Go to Login',
    ctaUrl: `${getFrontendUrl()}/login`,
    badgeText: 'SECURITY'
  });
};

export const getLoginAlertTemplate = (name, location, time) => {
  return generateEmailTemplate({
    title: 'Login Alert',
    message: `Hello ${name},<br><br>We noticed a new login to your SignFlow account. If this was you, no further action is required.`,
    ctaText: 'Review Account Activity',
    ctaUrl: `${getFrontendUrl()}/settings/security`,
    badgeText: 'SECURITY ALERT',
    detailsCard: {
      title: 'SECURITY EVENT',
      fields: [
         { label: 'EVENT', value: 'Account Login' },
         { label: 'LOCATION', value: location || 'Unknown Location' },
         { label: 'TIME', value: time || new Date().toLocaleString() }
      ]
    }
  });
};

export const getNewDeviceLoginTemplate = (name, device, location, time) => {
  return generateEmailTemplate({
    title: 'New Device Login',
    message: `Hello ${name},<br><br>Your account was accessed from a new device. Please verify if this was you.`,
    ctaText: 'Secure My Account',
    ctaUrl: `${getFrontendUrl()}/settings/security`,
    badgeText: 'SECURITY ALERT',
    detailsCard: {
      title: 'SECURITY EVENT',
      fields: [
         { label: 'EVENT', value: 'New Device Login' },
         { label: 'DEVICE', value: device || 'Unknown Device' },
         { label: 'LOCATION', value: location || 'Unknown Location' },
         { label: 'TIME', value: time || new Date().toLocaleString() }
      ]
    }
  });
};


// ============================================================================
// 2. DOCUMENT WORKFLOW EMAILS
// ============================================================================

export const getSignatureRequestTemplate = (senderName, recipientName, docName, url, expiryDate = 'No expiration') => {
  return generateEmailTemplate({
    title: 'Document Awaiting Your Signature',
    message: `Hello ${recipientName},<br><br>You have received a secure document that requires your electronic signature. Review the document carefully and complete the signing process before the expiration date. No account is required.`,
    ctaText: 'Review & Sign Document',
    ctaUrl: url,
    badgeText: 'SIGNATURE REQUIRED',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'SENT BY', value: senderName },
         { label: 'EXPIRY DATE', value: expiryDate }
      ]
    }
  });
};

export const getReminderTemplate = (recipientName, docName, url, senderName = 'SignFlow Owner', expiryDate = 'No expiration') => {
  return generateEmailTemplate({
    title: 'Signature Reminder',
    message: `Hello ${recipientName},<br><br>This is a friendly reminder that you have pending fields to complete. Please review and sign the document using the secure link below to complete the transaction.`,
    ctaText: 'Review & Sign Document',
    ctaUrl: url,
    badgeText: 'REMINDER',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'SENT BY', value: senderName },
         { label: 'EXPIRY DATE', value: expiryDate }
      ]
    }
  });
};

export const getViewedTemplate = (ownerName, recipientEmail, docName) => {
  return generateEmailTemplate({
    title: 'Document Viewed',
    message: `Hello ${ownerName},<br><br>The recipient <strong>${recipientEmail}</strong> has securely viewed your document. We will notify you immediately once they place their signature and complete the process.`,
    ctaText: 'View Document Status',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'UPDATE',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'VIEWED BY', value: recipientEmail },
         { label: 'STATUS', value: 'Viewed - Pending Signature' }
      ]
    }
  });
};

export const getDocumentSignedTemplate = (ownerName, signerEmail, docName) => {
  return generateEmailTemplate({
    title: 'Document Signed',
    message: `Hello ${ownerName},<br><br>The recipient <strong>${signerEmail}</strong> has placed their electronic signature on your document.`,
    ctaText: 'View Document',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'UPDATE',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'SIGNED BY', value: signerEmail },
         { label: 'STATUS', value: 'Partially Signed' }
      ]
    }
  });
};

export const getAllSignersCompletedTemplate = (ownerName, docName, downloadUrl) => {
  return generateEmailTemplate({
    title: 'All Signers Completed',
    message: `Hello ${ownerName},<br><br>Great news! All required parties have completed and signed the document. It is now cryptographically sealed.`,
    ctaText: 'Download Final PDF',
    ctaUrl: downloadUrl,
    badgeText: 'COMPLETED',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'STATUS', value: 'Fully Executed' }
      ]
    }
  });
};

export const getCompletedOwnerTemplate = (ownerName, docName, downloadUrl) => {
  return getAllSignersCompletedTemplate(ownerName, docName, downloadUrl);
};

export const getCompletedSignerTemplate = (signerName, docName, downloadUrl) => {
  return generateEmailTemplate({
    title: 'Your Copy of the Completed Document',
    message: `Hello ${signerName},<br><br>Thank you for signing. The signing process is complete, and a cryptographically verified copy of the final executed document is available for download.`,
    ctaText: 'Download Completed PDF',
    ctaUrl: downloadUrl,
    badgeText: 'COMPLETED',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'STATUS', value: 'Fully Executed' }
      ]
    }
  });
};

export const getDocumentExpiredTemplate = (ownerName, docName) => {
  return generateEmailTemplate({
    title: 'Document Invitation Expired',
    message: `Hello ${ownerName},<br><br>Your document invitation has reached its expiration date and is no longer available for signing. You can duplicate and resend it from your dashboard.`,
    ctaText: 'Manage Documents',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'EXPIRED',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'STATUS', value: 'Expired' }
      ]
    }
  });
};

export const getRejectedTemplate = (ownerName, rejecterName, docName, reason) => {
  return generateEmailTemplate({
    title: 'Document Declined',
    message: `Hello ${ownerName},<br><br>The recipient <strong>${rejecterName}</strong> has declined to sign your document.<br><br><strong>Reason:</strong> ${reason || 'No reason provided.'}`,
    ctaText: 'View Document',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'DECLINED',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'DECLINED BY', value: rejecterName },
         { label: 'STATUS', value: 'Voided' }
      ]
    }
  });
};

export const getDownloadReadyTemplate = (userName, docName, downloadUrl) => {
  return generateEmailTemplate({
    title: 'Document Download Ready',
    message: `Hello ${userName},<br><br>Your requested document archive is ready for download. Please securely download it using the link below.`,
    ctaText: 'Download Files',
    ctaUrl: downloadUrl,
    badgeText: 'READY',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'ARCHIVE TYPE', value: 'ZIP' }
      ]
    }
  });
};

export const getShareLinkCreatedTemplate = (ownerName, docName, shareUrl) => {
  return generateEmailTemplate({
    title: 'Public Share Link Active',
    message: `Hello ${ownerName},<br><br>A public, secure sharing link has been successfully activated. Anyone with the link can review, reject, or sign the document.`,
    ctaText: 'View Public Link',
    ctaUrl: shareUrl,
    badgeText: 'ACTIVE',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'TYPE', value: 'Public Link' }
      ]
    }
  });
};

export const getDocumentCancelledTemplate = (recipientName, docName, cancelerName) => {
  return generateEmailTemplate({
    title: 'Document Cancelled',
    message: `Hello ${recipientName},<br><br>Please note that <strong>${cancelerName}</strong> has cancelled the document request. This document is no longer active and cannot be signed.`,
    ctaText: 'Go to SignFlow',
    ctaUrl: getFrontendUrl(),
    badgeText: 'CANCELLED',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'CANCELLED BY', value: cancelerName },
         { label: 'STATUS', value: 'Cancelled' }
      ]
    }
  });
};

export const getAuditReportGeneratedTemplate = (name, docName, url) => {
  return generateEmailTemplate({
    title: 'Audit Report Generated',
    message: `Hello ${name},<br><br>Your requested audit trail ledger and compliance report has been generated successfully.`,
    ctaText: 'Download Audit Report',
    ctaUrl: url,
    badgeText: 'READY',
    detailsCard: {
      title: 'DOCUMENT DETAILS',
      fields: [
         { label: 'DOCUMENT NAME', value: docName },
         { label: 'REPORT TYPE', value: 'Compliance Ledger' }
      ]
    }
  });
};


// ============================================================================
// 3. TEAM & ORGANIZATION EMAILS
// ============================================================================

export const getTeamInviteTemplate = (inviterName, workspaceName, inviteUrl) => {
  return generateEmailTemplate({
    title: 'Invitation to Join Workspace',
    message: `Hello,<br><br><strong>${inviterName}</strong> has invited you to join the team workspace on SignFlow. Click the link below to accept the invitation and begin collaborating on contracts and shared templates.`,
    ctaText: 'Accept Invitation',
    ctaUrl: inviteUrl,
    badgeText: 'INVITATION',
    detailsCard: {
      title: 'WORKSPACE DETAILS',
      fields: [
         { label: 'WORKSPACE', value: workspaceName },
         { label: 'INVITED BY', value: inviterName }
      ]
    }
  });
};

export const getTeamMemberAddedTemplate = (ownerName, newMemberEmail, workspaceName) => {
  return generateEmailTemplate({
    title: 'New Team Member Added',
    message: `Hello ${ownerName},<br><br>A new member has accepted your invitation and joined your workspace.`,
    ctaText: 'Manage Team',
    ctaUrl: `${getFrontendUrl()}/settings/team`,
    badgeText: 'TEAM UPDATE',
    detailsCard: {
      title: 'WORKSPACE DETAILS',
      fields: [
         { label: 'WORKSPACE', value: workspaceName },
         { label: 'NEW MEMBER', value: newMemberEmail }
      ]
    }
  });
};

export const getRoleChangedTemplate = (userName, newRole, workspaceName) => {
  return generateEmailTemplate({
    title: 'Your Role Has Been Updated',
    message: `Hello ${userName},<br><br>Your permissions and role within the workspace have been updated.`,
    ctaText: 'View Workspace',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'ROLE UPDATE',
    detailsCard: {
      title: 'WORKSPACE DETAILS',
      fields: [
         { label: 'WORKSPACE', value: workspaceName },
         { label: 'NEW ROLE', value: newRole }
      ]
    }
  });
};


// ============================================================================
// 4. BILLING EMAILS
// ============================================================================

export const getSubscriptionActivatedTemplate = (name, planName, amount) => {
  return generateEmailTemplate({
    title: 'Subscription Activated',
    message: `Hello ${name},<br><br>Thank you for upgrading! Your subscription is now fully active, granting you access to all premium features.`,
    ctaText: 'Go to Dashboard',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'ACTIVATED',
    detailsCard: {
      title: 'PAYMENT DETAILS',
      fields: [
         { label: 'PLAN', value: planName },
         { label: 'AMOUNT', value: amount },
         { label: 'STATUS', value: 'Successful' }
      ]
    }
  });
};

export const getSubscriptionRenewedTemplate = (name, planName, amount) => {
  return generateEmailTemplate({
    title: 'Subscription Renewed',
    message: `Hello ${name},<br><br>Your subscription has been successfully renewed for another cycle.`,
    ctaText: 'View Billing History',
    ctaUrl: `${getFrontendUrl()}/settings/billing`,
    badgeText: 'RENEWED',
    detailsCard: {
      title: 'PAYMENT DETAILS',
      fields: [
         { label: 'PLAN', value: planName },
         { label: 'AMOUNT', value: amount },
         { label: 'STATUS', value: 'Successful' }
      ]
    }
  });
};

export const getPaymentSuccessfulTemplate = (name, amount, invoiceUrl) => {
  return generateEmailTemplate({
    title: 'Payment Successful',
    message: `Hello ${name},<br><br>We have successfully processed your recent payment.`,
    ctaText: 'View Invoice',
    ctaUrl: invoiceUrl,
    badgeText: 'RECEIPT',
    detailsCard: {
      title: 'PAYMENT DETAILS',
      fields: [
         { label: 'AMOUNT', value: amount },
         { label: 'STATUS', value: 'Processed' }
      ]
    }
  });
};

export const getPaymentFailedTemplate = (name, amount, updateUrl) => {
  return generateEmailTemplate({
    title: 'Payment Failed',
    message: `Hello ${name},<br><br>We were unable to process your recent payment. To avoid service interruption, please update your payment method.`,
    ctaText: 'Update Payment Method',
    ctaUrl: updateUrl,
    badgeText: 'ACTION REQUIRED',
    detailsCard: {
      title: 'PAYMENT DETAILS',
      fields: [
         { label: 'AMOUNT', value: amount },
         { label: 'STATUS', value: 'Failed' }
      ]
    }
  });
};

export const getTrialEndingTemplate = (name, planName, upgradeUrl) => {
  return generateEmailTemplate({
    title: 'Trial Ending Soon',
    message: `Hello ${name},<br><br>Your free trial is coming to an end soon. Upgrade now to ensure uninterrupted access to enterprise signature features.`,
    ctaText: 'Upgrade Now',
    ctaUrl: upgradeUrl,
    badgeText: 'TRIAL ENDING',
    detailsCard: {
      title: 'ACCOUNT DETAILS',
      fields: [
         { label: 'PLAN', value: planName },
         { label: 'STATUS', value: 'Trial Ending' }
      ]
    },
    isMarketing: true
  });
};

export const getPlanUpgradedTemplate = (name, planName) => {
  return generateEmailTemplate({
    title: 'Plan Upgraded',
    message: `Hello ${name},<br><br>Your account has been successfully upgraded to the ${planName} plan. Enjoy your new premium features!`,
    ctaText: 'Go to Dashboard',
    ctaUrl: `${getFrontendUrl()}/dashboard`,
    badgeText: 'UPGRADED',
    detailsCard: {
      title: 'ACCOUNT DETAILS',
      fields: [
         { label: 'NEW PLAN', value: planName },
         { label: 'STATUS', value: 'Active' }
      ]
    }
  });
};

export const getPlanDowngradedTemplate = (name, planName) => {
  return generateEmailTemplate({
    title: 'Plan Downgraded',
    message: `Hello ${name},<br><br>Your account has been downgraded to the ${planName} plan. Some features may no longer be available.`,
    ctaText: 'Manage Subscription',
    ctaUrl: `${getFrontendUrl()}/settings/billing`,
    badgeText: 'DOWNGRADED',
    detailsCard: {
      title: 'ACCOUNT DETAILS',
      fields: [
         { label: 'CURRENT PLAN', value: planName },
         { label: 'STATUS', value: 'Active' }
      ]
    }
  });
};


// ============================================================================
// 5. SECURITY EMAILS
// ============================================================================

export const getSecurityAlertTemplate = (name, eventDescription, time) => {
  return generateEmailTemplate({
    title: 'Security Alert',
    message: `Hello ${name},<br><br>A security event was detected on your account. If you did not authorize this action, please secure your account immediately.`,
    ctaText: 'Secure My Account',
    ctaUrl: `${getFrontendUrl()}/settings/security`,
    badgeText: 'SECURITY ALERT',
    detailsCard: {
      title: 'SECURITY EVENT',
      fields: [
         { label: 'EVENT', value: eventDescription },
         { label: 'TIME', value: time || new Date().toLocaleString() }
      ]
    }
  });
};

export const getSuspiciousLoginTemplate = (name, location, device, time) => {
  return generateEmailTemplate({
    title: 'Suspicious Login Attempt Blocked',
    message: `Hello ${name},<br><br>We blocked a suspicious login attempt to your account from an unrecognized device or location.`,
    ctaText: 'Change Password',
    ctaUrl: `${getFrontendUrl()}/settings/security`,
    badgeText: 'SECURITY ALERT',
    detailsCard: {
      title: 'SECURITY EVENT',
      fields: [
         { label: 'EVENT', value: 'Blocked Login Attempt' },
         { label: 'LOCATION', value: location || 'Unknown' },
         { label: 'DEVICE', value: device || 'Unknown' },
         { label: 'TIME', value: time || new Date().toLocaleString() }
      ]
    }
  });
};

export const getMfaEnabledTemplate = (name) => {
  return generateEmailTemplate({
    title: 'Two-Factor Authentication Enabled',
    message: `Hello ${name},<br><br>Two-Factor Authentication (2FA/MFA) has been successfully enabled on your account. Your account is now protected with an additional layer of security.`,
    ctaText: 'Manage Security',
    ctaUrl: `${getFrontendUrl()}/settings/security`,
    badgeText: 'SECURITY',
    detailsCard: {
      title: 'ACCOUNT DETAILS',
      fields: [
         { label: 'MFA STATUS', value: 'Enabled' }
      ]
    }
  });
};

export const getMfaDisabledTemplate = (name) => {
  return generateEmailTemplate({
    title: 'Two-Factor Authentication Disabled',
    message: `Hello ${name},<br><br>Two-Factor Authentication (2FA/MFA) has been disabled on your account. We strongly recommend keeping MFA enabled to protect your account from unauthorized access.`,
    ctaText: 'Re-enable MFA',
    ctaUrl: `${getFrontendUrl()}/settings/security`,
    badgeText: 'SECURITY ALERT',
    detailsCard: {
      title: 'ACCOUNT DETAILS',
      fields: [
         { label: 'MFA STATUS', value: 'Disabled' }
      ]
    }
  });
};
