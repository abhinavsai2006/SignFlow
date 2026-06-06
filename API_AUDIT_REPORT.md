# SignFlow AI API Audit Report

Date: 2026-06-06

## Summary

The backend API routes have been audited for authentication middleware, input validation, error handling, rate limiting, and output consistency (JSON responses vs HTML traces).

---

## Route Overview & Protections

| Route Path | HTTP Method | Auth Required | Rate Limiting | Status Code on Success | Return Type |
| --- | --- | --- | --- | --- | --- |
| `/api/auth/register` | POST | No | `authLimiter` (20 req / 15m) | `201 Created` | JSON |
| `/api/auth/login` | POST | No | `authLimiter` (20 req / 15m) | `200 OK` | JSON |
| `/api/auth/verify-email` | POST | Yes | `authLimiter` | `200 OK` | JSON |
| `/api/auth/forgot-password`| POST | No | `authLimiter` | `200 OK` | JSON |
| `/api/docs` | GET/POST | Yes | `generalLimiter` (2000 req / 15m) | `200 OK / 201 Created` | JSON |
| `/api/docs/:id/settings` | PUT | Yes | `generalLimiter` | `200 OK` | JSON |
| `/api/docs/:id/recipients`| POST | Yes | `generalLimiter` | `201 Created` | JSON |
| `/api/signatures` | POST | Yes | `generalLimiter` | `201 Created` | JSON |
| `/api/signatures/:id/sign` | PUT | Yes | `generalLimiter` | `200 OK` | JSON |
| `/api/signatures/finalize`| POST | Yes | `generalLimiter` | `200 OK` | JSON |
| `/api/docs/:id/public` | GET | No | `generalLimiter` | `200 OK` | JSON |
| `/api/docs/:id/public-download`| GET | No | `generalLimiter` | `200 OK` | PDF (Binary) |
| `/api/admin/stats` | GET | Yes (Admin) | `generalLimiter` | `200 OK` | JSON |

---

## Security & Reliability Key Findings

1. **Authentication Gates:**
   - Secured endpoints utilize the `protect` middleware which verifies JWT signatures and attaches the validated User to `req.user`.
   - Admin routes use double-layered security: `protect` and `adminProtect` to restrict access to Admins only.

2. **Rate Limiting:**
   - Dedicated `authLimiter` implemented on `/api/auth/*` routes restricts brute force registration or login attempts.
   - General endpoints utilize a highly scalable `generalLimiter`.

3. **Error Handling & Output Consistency:**
   - Try/catch blocks cover all route handlers to catch uncaught runtime exceptions.
   - All errors are formatted as JSON responses with `res.status(500).json(...)`, preventing stack traces or HTML output from leaking to clients.

## Recommendations
- **Dynamic Port Selection:** The ESM load ordering issue has been successfully resolved in `server.js` by using `import 'dotenv/config'` to load `.env` variables before routes initialization.
