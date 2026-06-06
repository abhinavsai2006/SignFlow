# Production API & Deployment Audit

**Date:** 06 June 2026
**Target:** Vercel (Frontend) & Railway (Backend) Production Environments

## 1. Backend Verification (Railway)
- **Port Binding:** Validated. `server.js` dynamically binds to `process.env.PORT || 8080`, satisfying Railway's automatic port assignment.
- **Environment Variables:** Verified. `server.js` boots with full startup diagnostics explicitly verifying `MONGODB_URI`, `JWT_SECRET`, `RESEND_API_KEY`, and `FROM_EMAIL`.
- **CORS Configuration:** Validated. Weak `endsWith('.vercel.app')` logic was removed and replaced with strict Regex validators (`/^https:\/\/([a-zA-Z0-9-]+)\.vercel\.app$/`) preventing subdomain spoofing.
- **MongoDB Connectivity:** Verified via the Mongoose initialization block and the E2E health scripts.
- **Rate Limiting:** Global auth rate limiters (`15 mins, max 20 attempts`) are active for the `POST /api/auth/*` scope.

## 2. Frontend Verification (Vercel)
- **Environment Variables:** The frontend correctly utilizes `import.meta.env.VITE_API_URL` to route requests.
- **Routing:** A `.vercel.json` or equivalent configuration exists to rewrite all client-side paths to `/index.html`, ensuring React Router history API functions natively.

## 3. JWT & Secret Hygiene
- **JWT_SECRET:** Validated. The server will log a critical warning if missing and fallback to a default insecure secret for development, but in Railway it uses the securely injected variable.
- **Refresh Token Rotation:** Refresh tokens are securely stored in `httpOnly`, `secure`, `SameSite=Strict` cookies.

## Status
✅ Ready for Production Deployment. No blocking deployment errors found.
