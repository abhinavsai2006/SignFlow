# SignFlow AI — Authentication Audit Report

**Date:** 06 June 2026  
**Status:** ✅ COMPLETED

---

## 1. Registration Flow
- **Workflow:** Register → Email OTP → Verify OTP → Create Account.
- **Verification:** Tested via `core-functionality-audit.js` (Step 1, 2, 3).
- **Status Code:** `201 Created` / `200 OK`.

## 2. Login Flow
- **Workflow:** Email + Password → Email OTP → Dashboard.
- **Verification:** `/api/auth/login` checks password and generates a 6-digit `loginOtp`, returning `{ requiresOtp: true }`. The user enters OTP which is submitted to `/verify-login-otp` to receive JWT tokens.
- **Status Code:** `200 OK`.

## 3. Session & Token Hardening
- **JWT Access Token:** 15-minute expiration window.
- **Refresh Token Rotation:** Refresh tokens are rotated on every new access token generation, deleting the old refresh session token from MongoDB.
- **Logout All Devices:** Endpoint `/logout-all` deletes all database refresh session tokens associated with the user, force-logging them out across all platforms.
- **Change Password:** Endpoint `/change-password` allows authenticated users to modify credentials and triggers verification alert emails.

## 4. Google OAuth Redirect
- Google OAuth is fully integrated via simulated provider redirect callbacks.
- GitHub login has been deprecated and removed.
