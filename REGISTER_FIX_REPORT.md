# Registration Fix Report

**Date:** 06 June 2026
**Target Route:** `POST /api/auth/register`

## Audit Findings
The registration route was returning a `400 Bad Request` unexpectedly for users. The root cause was a combination of insufficient frontend validation mapping and missing specific error messages in the backend. 
When any validation failed (e.g., short password, invalid email structure, or duplicate email), the backend returned generic `400` errors like `"All fields are required"` or `"User already exists"`, which didn't provide enough context for the frontend to display properly. Furthermore, MongoDB was saving emails with mixed casing, leading to duplicate account vulnerabilities.

## Resolution

The backend `/register` route has been refactored with the following fixes:

1. **Request Validation:** Added explicit checks for `name` (length >= 2), `email` (Regex validation), and `password` (length >= 6).
2. **Duplicate Email Handling:** Emails are now converted to `.toLowerCase()` before checking the database to prevent `Test@email.com` and `test@email.com` from being registered separately. The error message is now a clear `400 Bad Request: An account with this email already exists`.
3. **OTP Generation:** `verificationCode` generation is preserved, generating a secure 6-digit string.
4. **OTP Persistence:** The OTP is correctly saved to the newly created `User` document.
5. **Password Hashing:** Verified that `User.js` utilizes a `pre('save')` hook with `bcrypt` (salt rounds: 10) to hash the password securely before saving.
6. **MongoDB Write Operations:** Handled correctly via `User.create()`.
7. **Email Delivery:** Resend integration dispatches both a Welcome Email and the Verification OTP Email async natively.

## Testing Status
✅ Tested with valid inputs (`201 Created`).
✅ Tested with duplicate email (`400 Bad Request`).
✅ Tested with invalid email format (`400 Bad Request`).
✅ Tested with short password (`400 Bad Request`).
