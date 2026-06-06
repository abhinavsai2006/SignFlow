const emailWrapper = (title, content) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f6f9;
      color: #1c1e21;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f9;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e1e4e8;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #0064e0;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
      line-height: 1.6;
      font-size: 16px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 24px 32px;
      border-top: 1px solid #e1e4e8;
      text-align: center;
    }
    .features-grid {
      display: table;
      width: 100%;
      margin: 20px 0;
      border-top: 1px solid #e1e4e8;
      border-bottom: 1px solid #e1e4e8;
      padding: 16px 0;
    }
    .feature-col {
      display: table-cell;
      width: 50%;
      padding: 6px 0;
      font-size: 12px;
      color: #4b4f56;
      font-weight: 600;
      text-align: left;
    }
    .btn {
      display: inline-block;
      background-color: #0064e0;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 100px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
    }
    .btn:hover {
      background-color: #0457cb;
    }
    .meta-text {
      font-size: 11px;
      color: #90949c;
      margin-top: 16px;
    }
    h2 {
      color: #1c1e21;
      font-size: 20px;
      font-weight: 700;
      margin-top: 0;
    }
    p {
      margin: 0 0 16px 0;
    }
    blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      border-left: 4px solid #0064e0;
      background-color: #f0f7ff;
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>SignFlow AI</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <div class="features-grid">
          <div style="display: table-row;">
            <div class="feature-col">✓ End-to-End Encryption</div>
            <div class="feature-col">✓ Tamper-Proof Audit Trail</div>
          </div>
          <div style="display: table-row;">
            <div class="feature-col">✓ Identity Verification</div>
            <div class="feature-col">✓ Legally Binding Signature</div>
          </div>
        </div>
        <p class="meta-text">This is an automated notification from SignFlow AI. All transactions are legally binding and cryptographically signed.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const getWelcomeTemplate = (name) => {
  return emailWrapper(
    'Welcome to SignFlow AI',
    `<h2>Welcome to the Future of e-Signatures, ${name}!</h2>
     <p>We are thrilled to welcome you to SignFlow AI—the enterprise-grade electronic signature platform designed for speed, security, and absolute compliance.</p>
     <p>With SignFlow AI, you can now:</p>
     <ul>
       <li>Prepare and send documents for signing in seconds</li>
       <li>Track real-time viewer and signing events in an immutable ledger</li>
       <li>Build fully automated, sequential workflows for multiple signers</li>
       <li>Verify document integrity with SHA-256 cryptographic check-summing</li>
     </ul>
     <p>Ready to get started? Log in to your dashboard to upload your first document.</p>
     <div style="text-align: center;">
       <a href="http://localhost:5177/dashboard" class="btn">Go to Dashboard</a>
     </div>`
  );
};

export const getVerificationTemplate = (name, url) => {
  return emailWrapper(
    'Verify your Email Address',
    `<h2>Verify your Email Address</h2>
     <p>Hello ${name},</p>
     <p>Thank you for signing up for SignFlow AI. To finalize your account setup and unlock all enterprise signature features, please verify your email address by clicking the link below:</p>
     <div style="text-align: center;">
       <a href="${url}" class="btn">Verify Account</a>
     </div>
     <p>If you did not register for this account, you can safely ignore this email.</p>`
  );
};

export const getPasswordResetTemplate = (name, url) => {
  return emailWrapper(
    'Reset your SignFlow AI Password',
    `<h2>Reset Your Password</h2>
     <p>Hello ${name},</p>
     <p>We received a request to reset your password for your SignFlow AI account. Click the button below to configure a new password:</p>
     <div style="text-align: center;">
       <a href="${url}" class="btn">Reset Password</a>
     </div>
     <p>This password reset link is valid for 1 hour. If you did not request a password reset, please secure your account immediately.</p>`
  );
};

export const getSignatureRequestTemplate = (senderName, recipientName, docName, url) => {
  return emailWrapper(
    `Signature Request: ${docName}`,
    `<h2>Signature Request from ${senderName}</h2>
     <p>Hello ${recipientName},</p>
     <p><strong>${senderName}</strong> has invited you to review and electronically sign the document: <strong>${docName}</strong>.</p>
     <p>Please click the button below to open the secure document viewer, inspect the fields, and place your signature. No account registration is required to sign.</p>
     <div style="text-align: center;">
       <a href="${url}" class="btn">Review & Sign Document</a>
     </div>
     <p>By signing, you agree to execute this agreement electronically under the terms of the ESIGN Act and UETA regulations.</p>`
  );
};

export const getReminderTemplate = (recipientName, docName, url) => {
  return emailWrapper(
    `Reminder: Signature Pending for ${docName}`,
    `<h2>Signature Reminder</h2>
     <p>Hello ${recipientName},</p>
     <p>This is a friendly reminder that you have pending fields to complete on: <strong>${docName}</strong>.</p>
     <p>Please review and sign the document using the secure link below to complete the transaction:</p>
     <div style="text-align: center;">
       <a href="${url}" class="btn">Review & Sign Document</a>
     </div>`
  );
};

export const getViewedTemplate = (ownerName, recipientEmail, docName) => {
  return emailWrapper(
    `Document Viewed: ${docName}`,
    `<h2>Document Viewed</h2>
     <p>Hello ${ownerName},</p>
     <p>The recipient <strong>${recipientEmail}</strong> has viewed your document: <strong>${docName}</strong>.</p>
     <p>We will notify you immediately once they place their signature and complete the process.</p>
     <div style="text-align: center;">
       <a href="http://localhost:5177/dashboard" class="btn">View Document Status</a>
     </div>`
  );
};

export const getCompletedOwnerTemplate = (ownerName, docName, downloadUrl) => {
  return emailWrapper(
    `Completed: ${docName}`,
    `<h2>Document Completed & Finalized</h2>
     <p>Hello ${ownerName},</p>
     <p>Great news! All parties have completed and signed: <strong>${docName}</strong>.</p>
     <p>The document is now sealed with a cryptographic signature, audit ledger, and a Certificate of Completion.</p>
     <div style="text-align: center;">
       <a href="${downloadUrl}" class="btn">Download Final PDF</a>
     </div>`
  );
};

export const getCompletedSignerTemplate = (signerName, docName, downloadUrl) => {
  return emailWrapper(
    `Copy of Completed Document: ${docName}`,
    `<h2>Your Copy of the Completed Document</h2>
     <p>Hello ${signerName},</p>
     <p>Thank you for signing <strong>${docName}</strong>. The signing process is complete, and a cryptographically verified copy of the final executed document is available below:</p>
     <div style="text-align: center;">
       <a href="${downloadUrl}" class="btn">Download Completed PDF</a>
     </div>`
  );
};

export const getRejectedTemplate = (ownerName, rejecterName, docName, reason) => {
  return emailWrapper(
    `Declined: ${docName}`,
    `<h2>Document Declined by Signer</h2>
     <p>Hello ${ownerName},</p>
     <p>The recipient <strong>${rejecterName}</strong> has declined to sign your document: <strong>${docName}</strong>.</p>
     <p><strong>Reason provided:</strong></p>
     <blockquote>${reason || 'No comments left.'}</blockquote>
     <div style="text-align: center;">
       <a href="http://localhost:5177/dashboard" class="btn">View Document</a>
     </div>`
  );
};

export const getShareLinkCreatedTemplate = (ownerName, docName, shareUrl) => {
  return emailWrapper(
    `Public Share Link Active: ${docName}`,
    `<h2>Public Signing Link Created</h2>
     <p>Hello ${ownerName},</p>
     <p>A public, secure sharing link has been successfully activated for: <strong>${docName}</strong>.</p>
     <p>Anyone with access to the link below can review, reject, or sign the document without creating an account:</p>
     <div style="text-align: center;">
       <a href="${shareUrl}" class="btn">Public Share Link</a>
     </div>`
  );
};

export const getDocumentExpiredTemplate = (ownerName, docName) => {
  return emailWrapper(
    `Expired: ${docName}`,
    `<h2>Document Invitation Expired</h2>
     <p>Hello ${ownerName},</p>
     <p>Your document invitation <strong>${docName}</strong> has reached its expiration date and is no longer available for signing.</p>
     <p>If you wish to collect signatures for this document, you can duplicate and resend it from your dashboard.</p>
     <div style="text-align: center;">
       <a href="http://localhost:5177/dashboard" class="btn">Manage Documents</a>
     </div>`
  );
};

export const getDocumentCancelledTemplate = (recipientName, docName, cancelerName) => {
  return emailWrapper(
    `Cancelled: ${docName}`,
    `<h2>Document Cancelled</h2>
     <p>Hello ${recipientName},</p>
     <p>Please note that <strong>${cancelerName}</strong> has cancelled the document request for: <strong>${docName}</strong>. This document is no longer active and cannot be signed.</p>`
  );
};

export const getAuditReportGeneratedTemplate = (name, docName, url) => {
  return emailWrapper(
    `Audit Report Generated: ${docName}`,
    `<h2>Audit Report Generated</h2>
     <p>Hello ${name},</p>
     <p>Your requested audit trail ledger and compliance report for document: <strong>${docName}</strong> has been generated successfully.</p>
     <div style="text-align: center;">
       <a href="${url}" class="btn">Download Audit Report</a>
     </div>`
  );
};

export const getTeamInviteTemplate = (inviterName, workspaceName, inviteUrl) => {
  return emailWrapper(
    `Invitation to join ${workspaceName}`,
    `<h2>Join Workspace</h2>
     <p>Hello,</p>
     <p><strong>${inviterName}</strong> has invited you to join the team workspace: <strong>${workspaceName}</strong> on SignFlow AI.</p>
     <p>Click the link below to accept the invitation and begin collaborating on contracts and shared templates:</p>
     <div style="text-align: center;">
       <a href="${inviteUrl}" class="btn">Accept Invitation</a>
     </div>`
  );
};
