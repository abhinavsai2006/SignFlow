# HIGH PRIORITY FIXES REPORT

This report details security vulnerabilities, API issues, and system defects that require immediate remediation before deploying to production.

---

## 1. Permissive CORS Origin Verification via Weak Subdomain Matching

* **File:** [server.js](file:///e:/Labmetrix/Project-1/backend/server.js)
* **Line:** 67-75
* **Severity:** High / Medium
* **Description:** 
  The CORS configuration allows any origin that ends with `.vercel.app` or `.railway.app` to make authenticated cross-origin requests. An attacker can register a malicious domain such as `evilvercel.app` or `attackvercel.app` which ends with `vercel.app`, completely bypassing CORS controls.

### Exact Code Fix

Update the CORS check to strictly validate subdomains with a dot prefix.

```diff
-    // Allow any *.vercel.app subdomain (Vercel preview deployments)
-    if (origin.endsWith('.vercel.app')) {
-      return callback(null, origin);
-    }
-
-    // Allow any *.railway.app subdomain (Railway preview deployments)
-    if (origin.endsWith('.railway.app')) {
-      return callback(null, origin);
-    }
+    // Allow strict *.vercel.app subdomains
+    if (/^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin)) {
+      return callback(null, origin);
+    }
+
+    // Allow strict *.railway.app subdomains
+    if (/^https?:\/\/([a-z0-9-]+\.)*railway\.app$/i.test(origin)) {
+      return callback(null, origin);
+    }
```

---

## 2. Missing File Size Limit on PDF Upload Handler (DoS Vulnerability)

* **File:** [uploadMiddleware.js](file:///e:/Labmetrix/Project-1/backend/middleware/uploadMiddleware.js)
* **Line:** 35
* **Severity:** High / Medium
* **Description:** 
  The multer configuration lacks file size constraints (`limits`). Users can upload extremely large files (several Gigabytes), which leads to disk space exhaustion (Denial of Service) and server crashes.

### Exact Code Fix

Add a strict 10MB upload limit to protect backend resources.

```diff
 const upload = multer({
   storage,
+  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB limit
   fileFilter: function (req, file, cb) {
     checkFileType(file, cb);
   },
 });
```

---

## 3. Lack of Global Uncaught Exception Handler

* **File:** [server.js](file:///e:/Labmetrix/Project-1/backend/server.js)
* **Line:** 172
* **Severity:** Medium
* **Description:** 
  There is no error-handling middleware registered at the end of the Express middleware stack. Any uncaught exceptions (e.g., from Multer's file filter, database connection dropouts, or route handler errors) will drop back to the default Express handler, printing a full HTML-formatted trace detailing local file paths and node package folders.

### Exact Code Fix

Insert a JSON-based error interceptor directly before `app.listen`.

```javascript
// Register right before app.listen()
app.use((err, req, res, next) => {
  console.error('[Error Interceptor]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});
```
