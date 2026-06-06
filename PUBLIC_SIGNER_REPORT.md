# SignFlow AI Public Signer Flow Audit Report

Date: 2026-06-06

## Summary

The Public Signer Flow enables third-party recipients to view and sign documents without creating an account or logging in, while enforcing strict security, expiration, and identity checks.

---

## Security controls verified

1. **Password Protection:**
   - Enforced via `sharePassword` on the document schema.
   - Accessing `/api/docs/:id/public` returns a `401 Unauthorized` prompting for password verification if a password is set.
   - Enforced on document details, page renders, and PDF downloads.

2. **Expiration Validation:**
   - Enforced via `shareExpiresAt`.
   - Returns `410 Gone` if the current date exceeds the set expiration.

3. **One-Time Access Link:**
   - Enforced via `shareOneTimeOnly`.
   - Setting this to `true` sets `shareVisited` to `true` upon first access, and subsequent requests return `410 Gone`.

4. **Public Download Verification:**
   - Secured `/api/docs/:id/public-download` to require the correct password and check for expiration/enabled status before serving the PDF file (Fixed during audit).

5. **Audit Trail Logging:**
   - Actions by anonymous or public users (e.g. `View`, `Sign`, `Public Download`) are logged to the `AuditLog` collection with IP addresses and User-Agent info, but without a bound `userId` (recorded as `null` or `Anonymous`).

---

## Recommendations / Discovered Issues & Fixes
- **Vulnerability Fixed:** Previously, the `/public-download` endpoint did not check password protection, allowing anyone with the document ID to bypass security gates and download the PDF. We updated the route to inspect `sharePassword` in query parameters and validated expiration/enabled status.
- **Frontend Sync:** Updated `PublicShareView.tsx` to automatically pass the document's access password as a query parameter when downloading the PDF.
