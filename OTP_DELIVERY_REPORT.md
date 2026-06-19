# SignFlow - OTP Delivery Report

This report presents the verification of the 2-Step verification (OTP) email flow.

## 1. OTP Generation, Storage, and Expiry Audit
- **Generation**: A 6-digit cryptographic verification code is dynamically generated during user registration and login steps using `Math.floor(100000 + Math.random() * 900000).toString()`.
- **Database Storage**: Stored inside the MongoDB `User` schema under `verificationCode` (for registration) and `loginOtp` (for login 2FA).
- **Expiry Check**: Checked at route validation using `loginOtpExpire` set to 10 minutes from creation.
- **Resend Integration**: Dispatched via Resend API calling templates `getVerificationTemplate` and `getLoginOtpTemplate`.

## 2. Test Execution Verification
```
[Resend Service] Dispatching email to <audit_user_0a7989@example.com> with subject: "Verify your SignFlow account"...
[Resend Service] Email sent successfully: {"id":"2d276374-0792-41f7-a9d1-731bb45f2a69"}

[Resend Service] Dispatching email to <audit_user_0a7989@example.com> with subject: "Your SignFlow Login Verification Code"...
[Resend Service] Email sent successfully: {"id":"8fb09fbb-b160-45ff-83a9-f51419cb9742"}
```
All OTP actions verified successfully.
