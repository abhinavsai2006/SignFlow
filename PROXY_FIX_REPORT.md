# SignFlow AI — Proxy Configuration Report

**Date:** 06 June 2026  
**Status:** ✅ FIXED

---

## Issue: `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
When routing requests through a reverse proxy or load balancer (like Railway's edge router), the client's IP address is passed in the `X-Forwarded-For` header. If Express is not configured to trust the proxy, libraries like `express-rate-limit` fail to detect the actual client IP, throwing configuration exceptions or rate-limiting all requests under a single proxy IP.

---

## Applied Resolution
We added trust proxy configuration to [server.js](file:///e:/Labmetrix/Project-1/backend/server.js) immediately after initialization:

```js
const app = express();
app.set('trust proxy', 1); // Trust first hop (Railway Edge Router)
```

This ensures:
1. `req.ip` is correctly set to the real client IP.
2. `express-rate-limit` tracks limits per client IP rather than server proxy.
3. Audit trails correctly record the client's true IP instead of `::1` or load balancer internal IPs.

---

## Verification
- **Express App Lint/Compilation:** PASS (0 syntax errors)
- **IP Detection:** Verified against incoming audit log generation. Rate-limit limits successfully parsed.
