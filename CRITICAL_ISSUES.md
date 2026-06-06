# CRITICAL ISSUES REPORT

This report details the critical security flaws and system risks discovered during the final production audit of SignFlow AI.

---

## 1. Administrative Authorization Bypass via Email Matching

* **File:** [adminRoutes.js](file:///e:/Labmetrix/Project-1/backend/routes/adminRoutes.js)
* **Line:** 17
* **Severity:** Critical / High
* **Description:** 
  The admin authentication middleware allows bypassing role-based access checks if a user's email contains the string `'admin'`. Any registered user who registers with an email like `hacker-admin@gmail.com` or `spam_admin_account@example.com` can access admin-only endpoints, exposing system metrics, database statistics, user counts, document data, and financial analytics.

### Exact Code Fix

Replace the bypass checks with strict database role validations.

```diff
-  if (req.user && (req.user.role === 'Admin' || req.user.email.includes('admin') || req.user.email === 'owner@signflow.ai')) {
+  if (req.user && req.user.role === 'Admin') {
     next();
   } else {
     res.status(403).json({ message: 'Not authorized as an admin' });
   }
```

---

## 2. Missing Expiration Check on Refresh Token Rotation

* **File:** [authRoutes.js](file:///e:/Labmetrix/Project-1/backend/routes/authRoutes.js)
* **Line:** 194
* **Severity:** High
* **Description:** 
  During session token rotation via `/api/auth/refresh`, the database lookup checks if the refresh token exists, but never verifies whether the token has expired (`activeSession.expiresAt < new Date()`). An attacker who obtains an expired refresh token can indefinitely rotate it for fresh access tokens, completely bypassing session longevity limits.

### Exact Code Fix

```diff
     const activeSession = await RefreshToken.findOne({ token });
     if (!activeSession) {
       return res.status(403).json({ message: 'Invalid session' });
     }
+
+    if (activeSession.expiresAt && activeSession.expiresAt < new Date()) {
+      await activeSession.deleteOne();
+      return res.status(403).json({ message: 'Session expired. Please log in again.' });
+    }
 
     // Refresh Token Rotation
     await activeSession.deleteOne();
```

---

## 3. Unsanitized HTML/XSS Injection inside Transmitted Emails

* **File:** [emailTemplates.js](file:///e:/Labmetrix/Project-1/backend/utils/emailTemplates.js)
* **Line:** 61-75, 89
* **Severity:** High / Medium
* **Description:** 
  User-controlled inputs, such as signer names (`signerName`), document names (`docName`), and email subjects are rendered directly inside HTML strings without escaping special characters. An attacker could register or upload a document with malicious scripts (e.g. `<img src=x onerror=alert(1)>`) or custom HTML, causing HTML injection or Cross-Site Scripting (XSS) inside email clients reading transaction notifications.

### Exact Code Fix

Add a utility to escape HTML, and wrap all user-controlled values inside templates:

```javascript
// Add helper function to the top of utils/emailTemplates.js
const escapeHtml = (unsafe) => {
  if (!unsafe || typeof unsafe !== 'string') return unsafe || '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
```

Update template interpolations to wrap untrusted inputs:

```diff
- <p style="margin-top:8px;font-size:${index === 0 ? '20px' : '16px'};font-weight:${index === 0 ? '700' : '600'};color:#0A1317;">
- ${field.value}
- </p>
+ <p style="margin-top:8px;font-size:${index === 0 ? '20px' : '16px'};font-weight:${index === 0 ? '700' : '600'};color:#0A1317;">
+ ${escapeHtml(field.value)}
+ </p>
```
