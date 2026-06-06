# SignFlow AI Email Trigger Audit Report

Date: 2026-06-06

## Email Service Call Sites and Triggers

We have audited the backend routes to identify where each email is triggered and verify if proper error handling is implemented.

| Function Name | Call Site (File:Line) | Trigger Event | Error Handling | Resend Provider Logged | Status |
| --- | --- | --- | --- | --- | --- |
| `sendWelcomeEmail` | `authRoutes.js:79` | User Registration | `.catch()` to console | Yes (via service) | Active |
| `sendWelcomeEmail` | `emailRoutes.js:23` | Dashboard Test Email | `try/catch` responding with JSON | Yes (via service & route) | Active |
| `sendVerificationEmail` | `authRoutes.js:80` | User Registration | `.catch()` to console | Yes (via service) | Active |
| `sendPasswordResetEmail` | `authRoutes.js:244` | Forgot Password Request | `.catch()` to console | Yes (via service) | Active |
| `sendInviteEmail` | `documentRoutes.js:513` | Adding Document Recipient | `try/catch` responding with JSON | Yes (via service) | Active |
| `sendInviteEmail` | `signatureRoutes.js:614` | Next sequential signer's turn | `try/catch` responding with JSON | Yes (via service) | Active |
| `sendRejectionEmail` | `documentRoutes.js:434` | Document Rejected | `try/catch` responding with JSON | Yes (via service) | Active |
| `sendCompletionEmail` | `signatureRoutes.js:702` | Finalize Document (Sequential) | `try/catch` responding with JSON | Yes (via service) | Active |
| `sendCompletionEmail` | `signatureRoutes.js:851` | Finalize Document (Standard) | `try/catch` responding with JSON | Yes (via service) | Active |
| `sendCompletedSignerEmail` | `signatureRoutes.js:712` | Finalize Document (Signers) | `try/catch` responding with JSON | Yes (via service) | Active |

---

## Unused / Dead Email Functions (defined in service but never called in routes)

The following functions are defined in `emailService.js` and have valid HTML/CSS templates, but are currently not triggered by any Express route:

1. `sendVerificationSuccessEmail`
2. `sendPasswordChangedEmail`
3. `sendLoginAlertEmail`
4. `sendNewDeviceLoginEmail`
5. `sendReminderEmail`
6. `sendViewedEmail`
7. `sendDocumentSignedEmail`
8. `sendAllSignersCompletedEmail`
9. `sendDocumentExpiredEmail`
10. `sendDownloadReadyEmail`
11. `sendShareLinkCreatedEmail`
12. `sendDocumentCancelledEmail`
13. `sendAuditReportGeneratedEmail`
14. `sendTeamInviteEmail`
15. `sendTeamMemberAddedEmail`
16. `sendRoleChangedEmail`
17. `sendSubscriptionActivatedEmail`
18. `sendSubscriptionRenewedEmail`
19. `sendPaymentSuccessfulEmail`
20. `sendPaymentFailedEmail`
21. `sendTrialEndingEmail`
22. `sendPlanUpgradedEmail`
23. `sendPlanDowngradedEmail`
24. `sendSecurityAlertEmail`
25. `sendSuspiciousLoginEmail`
26. `sendMfaEnabledEmail`
27. `sendMfaDisabledEmail`

## Recommendations
- **MFA and Security Alerts:** Connect `sendMfaEnabledEmail` and `sendMfaDisabledEmail` when 2FA features are fully integrated.
- **Reminders and Expiration:** Set up a cron task (using a worker or scheduler) to automatically trigger `sendReminderEmail` and `sendDocumentExpiredEmail` for documents near their expiration date.
- **Viewed Tracking:** Trigger `sendViewedEmail` when a public recipient first accesses the document page.
