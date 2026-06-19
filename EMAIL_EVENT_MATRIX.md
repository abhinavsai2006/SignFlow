# Email Event Matrix

Mapping of transactional/security events to email triggers, targets, and status codes.

| Category | Event Trigger | Function Name | Recipient Target |
| :--- | :--- | :--- | :--- |
| **Authentication** | Registration Welcome | `sendWelcomeEmail` | New User |
| **Authentication** | Email Verification | `sendVerificationEmail` | New User |
| **Authentication** | Verification Completed | `sendVerificationSuccessEmail` | Verified User |
| **Authentication** | Password Reset Request | `sendPasswordResetEmail` | Requesting User |
| **Authentication** | Password Changed | `sendPasswordChangedEmail` | User |
| **Authentication** | Login Alert (IP changed) | `sendLoginAlertEmail` | User |
| **Authentication** | New Device Login | `sendNewDeviceLoginEmail` | User |
| **Workflow** | Signer Invitation | `sendInviteEmail` | Signer |
| **Workflow** | Pending Reminder | `sendReminderEmail` | Signer |
| **Workflow** | Document Viewed | `sendViewedEmail` | Document Owner |
| **Workflow** | Signer Signed Document | `sendDocumentSignedEmail` | Document Owner |
| **Workflow** | All Signers Completed | `sendAllSignersCompletedEmail` | Document Owner |
| **Workflow** | Compilation Finished | `sendCompletionEmail` | Document Owner |
| **Workflow** | Signer Receives Copy | `sendCompletedSignerEmail` | Signer |
| **Workflow** | Document Expired | `sendDocumentExpiredEmail` | Document Owner |
| **Workflow** | Signer Rejected Document | `sendRejectionEmail` | Document Owner |
| **Workflow** | Download Ready | `sendDownloadReadyEmail` | Signer / Owner |
| **Workflow** | Share Link Settings Update | `sendShareLinkCreatedEmail` | Document Owner |
| **Workflow** | Document Workflow Cancelled | `sendDocumentCancelledEmail` | Recipients |
| **Workflow** | Audit Trail Exported | `sendAuditReportGeneratedEmail` | Exporting User |
| **Workspaces** | Team Invitation | `sendTeamInviteEmail` | Invited Member |
| **Workspaces** | Team Member Joins | `sendTeamMemberAddedEmail` | Workspace Owner |
| **Workspaces** | Workspace Member Role Changed | `sendRoleChangedEmail` | Member |
| **Billing** | Trial Sub Activated | `sendSubscriptionActivatedEmail` | User |
| **Billing** | Sub Renewed Successfully | `sendSubscriptionRenewedEmail` | User |
| **Billing** | Payment Succeeded | `sendPaymentSuccessfulEmail` | User |
| **Billing** | Payment Failed | `sendPaymentFailedEmail` | User |
| **Billing** | Free Trial Ending | `sendTrialEndingEmail` | User |
| **Billing** | Plan Upgraded | `sendPlanUpgradedEmail` | User |
| **Billing** | Plan Downgraded | `sendPlanDowngradedEmail` | User |
| **Security** | Sensitive Settings Modification | `sendSecurityAlertEmail` | User |
| **Security** | Multiple Failed Login Attempts | `sendSuspiciousLoginEmail` | User |
| **Security** | Multi-Factor Auth Enabled | `sendMfaEnabledEmail` | User |
| **Security** | Multi-Factor Auth Disabled | `sendMfaDisabledEmail` | User |

*Matrix mapping verified against the implemented codebase.*
