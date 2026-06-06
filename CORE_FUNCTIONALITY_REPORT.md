# SignFlow — Core Functionality Report

Date: 2026-06-06T19:00:20.503Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_0a7989@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a246e44a37bb97881d9b21f",
  "name": "Audit Tester",
  "email": "audit_user_0a7989@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjQ2ZTQ0YTM3YmI5Nzg4MWQ5YjIxZiIsImlhdCI6MTc4MDc3MjQyMCwiZXhwIjoxNzgwNzczMzIwfQ.ld-VGhAfyL2lMIGa_uwFvUqsmS1rfkI9BttCkCwQBt4",
  "isVerified": false,
  "verificationCode": "508960"
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 2: Receive OTP Email
- **Request URL:** `MongoDB Query (verificationCode)`
- **Method:** `SELECT`
- **Payload:**
```json
{
  "email": "audit_user_0a7989@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "508960"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 3: Verify OTP
- **Request URL:** `http://localhost:5000/api/auth/verify-email`
- **Method:** `POST`
- **Payload:**
```json
{
  "code": "508960"
}
```
- **Response:**
```json
{
  "message": "Email verified successfully",
  "isVerified": true
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 4: Login
- **Request URL:** `http://localhost:5000/api/auth/login`
- **Method:** `POST`
- **Payload:**
```json
{
  "email": "audit_user_0a7989@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "requiresOtp": true,
  "email": "audit_user_0a7989@example.com",
  "loginOtp": "706539"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 4.5: Verify Login OTP
- **Request URL:** `http://localhost:5000/api/auth/verify-login-otp`
- **Method:** `POST`
- **Payload:**
```json
{
  "email": "audit_user_0a7989@example.com",
  "otp": "706539"
}
```
- **Response:**
```json
{
  "_id": "6a246e44a37bb97881d9b21f",
  "name": "Audit Tester",
  "email": "audit_user_0a7989@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjQ2ZTQ0YTM3YmI5Nzg4MWQ5YjIxZiIsImlhdCI6MTc4MDc3MjQyMSwiZXhwIjoxNzgwNzczMzIxfQ.nq12i2dmNVmosigvv52dar7QlVVYhnY8uNHcRzJwvqw",
  "isVerified": true
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 5: Google Login
- **Request URL:** `http://localhost:5000/api/auth/oauth-callback?provider=google`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "message": "OAuth Success Redirect",
  "headers": {
    "access-control-allow-credentials": "true",
    "connection": "keep-alive",
    "content-length": "404",
    "content-security-policy": "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
    "content-type": "text/plain; charset=utf-8",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "cross-origin",
    "date": "Sat, 06 Jun 2026 19:00:22 GMT",
    "keep-alive": "timeout=5",
    "location": "http://localhost:5177/login?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjMxNjdjZDFmMzlhNjJkZjQ0YWQ0MSIsImlhdCI6MTc4MDc3MjQyMSwiZXhwIjoxNzgwNzczMzIxfQ.FDBwUHzWOVBd4aaJ6UWsvcHxVFSI0mwYX3PA_BRNCho&user=%7B%22_id%22%3A%226a23167cd1f39a62df44ad41%22%2C%22name%22%3A%22OAuth%20Google%20User%22%2C%22email%22%3A%22oauth_google_user%40example.com%22%2C%22isVerified%22%3Atrue%7D",
    "origin-agent-cluster": "?1",
    "ratelimit-limit": "20",
    "ratelimit-policy": "20;w=900",
    "ratelimit-remaining": "11",
    "ratelimit-reset": "863",
    "referrer-policy": "no-referrer",
    "set-cookie": "refreshToken=8f1c29382bdab82446b31f9d8fc360c01ec74ec6531288ea5bae5473959e02d5737870e04bae682e; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "vary": "Origin, Accept",
    "x-content-type-options": "nosniff",
    "x-dns-prefetch-control": "off",
    "x-download-options": "noopen",
    "x-frame-options": "SAMEORIGIN",
    "x-permitted-cross-domain-policies": "none",
    "x-xss-protection": "0"
  }
}
```
- **Status Code:** `302`
- **Console Errors / Warnings:** `None`

---

### Step 6: Upload PDF
- **Request URL:** `http://localhost:5000/api/docs/upload`
- **Method:** `POST`
- **Payload:**
```json
"Multipart/FormData (temp_audit.pdf)"
```
- **Response:**
```json
{
  "ownerId": "6a246e44a37bb97881d9b21f",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780772422138.pdf",
  "status": "Pending",
  "isArchived": false,
  "isDeleted": false,
  "sharingEnabled": false,
  "sharePassword": "",
  "shareOneTimeOnly": false,
  "shareVisited": false,
  "versions": [
    {
      "versionNumber": 1,
      "filename": "temp_audit.pdf",
      "path": "uploads/file-1780772422138.pdf",
      "_id": "6a246e46a37bb97881d9b228",
      "createdAt": "2026-06-06T19:00:22.186Z"
    }
  ],
  "rejectionReason": "",
  "remindersEnabled": false,
  "reminderInterval": 3,
  "signingOrder": "Parallel",
  "sha256Checksum": null,
  "isTemplate": false,
  "templateName": "",
  "reminderSent": false,
  "expiredEmailSent": false,
  "_id": "6a246e46a37bb97881d9b227",
  "createdAt": "2026-06-06T19:00:22.187Z",
  "updatedAt": "2026-06-06T19:00:22.187Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a246e46a37bb97881d9b227`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a246e46a37bb97881d9b227",
  "ownerId": "6a246e44a37bb97881d9b21f",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780772422138.pdf",
  "status": "Pending",
  "isArchived": false,
  "isDeleted": false,
  "sharingEnabled": false,
  "sharePassword": "",
  "shareOneTimeOnly": false,
  "shareVisited": false,
  "versions": [
    {
      "versionNumber": 1,
      "filename": "temp_audit.pdf",
      "path": "uploads/file-1780772422138.pdf",
      "_id": "6a246e46a37bb97881d9b228",
      "createdAt": "2026-06-06T19:00:22.186Z"
    }
  ],
  "rejectionReason": "",
  "remindersEnabled": false,
  "reminderInterval": 3,
  "signingOrder": "Parallel",
  "sha256Checksum": null,
  "isTemplate": false,
  "templateName": "",
  "reminderSent": false,
  "expiredEmailSent": false,
  "createdAt": "2026-06-06T19:00:22.187Z",
  "updatedAt": "2026-06-06T19:00:22.187Z",
  "__v": 0
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 8: Add Signature Field
- **Request URL:** `http://localhost:5000/api/signatures`
- **Method:** `POST`
- **Payload:**
```json
{
  "documentId": "6a246e46a37bb97881d9b227",
  "recipientEmail": "signer_test@example.com",
  "type": "Signature",
  "xPercent": 10,
  "yPercent": 20,
  "widthPercent": 15,
  "heightPercent": 5,
  "page": 1
}
```
- **Response:**
```json
{
  "documentId": "6a246e46a37bb97881d9b227",
  "userId": "6a246e44a37bb97881d9b21f",
  "recipientEmail": "signer_test@example.com",
  "type": "Signature",
  "xPercent": 10,
  "yPercent": 20,
  "widthPercent": 15,
  "heightPercent": 5,
  "page": 1,
  "status": "Pending",
  "ipAddress": "Unavailable",
  "userAgent": "Unavailable",
  "location": "Unavailable",
  "tamperStatus": "Verified",
  "_id": "6a246e46a37bb97881d9b22d",
  "createdAt": "2026-06-06T19:00:22.687Z",
  "updatedAt": "2026-06-06T19:00:22.687Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a246e46a37bb97881d9b227/recipients`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Test Signer",
  "email": "signer_test@example.com",
  "role": "Signer",
  "sequence": 1
}
```
- **Response:**
```json
{
  "documentId": "6a246e46a37bb97881d9b227",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a246e46a37bb97881d9b22f",
  "createdAt": "2026-06-06T19:00:22.894Z",
  "updatedAt": "2026-06-06T19:00:22.955Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 10: Receive Email Notification
- **Request URL:** `MongoDB Query (EmailLog)`
- **Method:** `SELECT`
- **Payload:**
```json
{
  "recipient": "signer_test@example.com"
}
```
- **Response:**
```json
{
  "_id": "6a246607e054287932fbdd1a",
  "recipient": "signer_test@example.com",
  "template": "signature-request",
  "subject": "Signature Request: temp_audit.pdf",
  "provider": "Resend",
  "status": "Delivered",
  "createdAt": "2026-06-06T18:25:11.536Z",
  "updatedAt": "2026-06-06T18:25:11.858Z",
  "__v": 0,
  "messageId": "60b1b0cb-2018-4999-8951-556aa6959296",
  "providerResponse": "{\"id\":\"60b1b0cb-2018-4999-8951-556aa6959296\"}"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 11: Open Share Link
- **Request URL:** `http://localhost:5000/api/docs/6a246e46a37bb97881d9b227/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a246e46a37bb97881d9b227",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780772422138.pdf",
  "status": "Pending",
  "createdAt": "2026-06-06T19:00:22.187Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a246e46a37bb97881d9b22d",
      "documentId": "6a246e46a37bb97881d9b227",
      "userId": "6a246e44a37bb97881d9b21f",
      "recipientEmail": "signer_test@example.com",
      "type": "Signature",
      "xPercent": 10,
      "yPercent": 20,
      "widthPercent": 15,
      "heightPercent": 5,
      "page": 1,
      "status": "Pending",
      "ipAddress": "Unavailable",
      "userAgent": "Unavailable",
      "location": "Unavailable",
      "tamperStatus": "Verified",
      "createdAt": "2026-06-06T19:00:22.687Z",
      "updatedAt": "2026-06-06T19:00:22.687Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a246e46a37bb97881d9b22d/sign-public`
- **Method:** `POST`
- **Payload:**
```json
{
  "signatureValue": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "signerEmail": "signer_test@example.com",
  "signerName": "Test Signer"
}
```
- **Response:**
```json
{
  "message": "Signature submitted successfully",
  "field": {
    "_id": "6a246e46a37bb97881d9b22d",
    "documentId": "6a246e46a37bb97881d9b227",
    "userId": "6a246e44a37bb97881d9b21f",
    "recipientEmail": "signer_test@example.com",
    "type": "Signature",
    "xPercent": 10,
    "yPercent": 20,
    "widthPercent": 15,
    "heightPercent": 5,
    "page": 1,
    "status": "Signed",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "location": "Local Development Environment",
    "tamperStatus": "Verified",
    "createdAt": "2026-06-06T19:00:22.687Z",
    "updatedAt": "2026-06-06T19:00:24.122Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-1CFEC8",
    "auditId": "AUD-32C8AF",
    "documentHash": "973855767d58aa6df2e3cee925eff008b06d052b41c7277a91b4248c05ac0543"
  }
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 13: Generate Certificate
- **Request URL:** `http://localhost:5000/api/signatures/finalize`
- **Method:** `POST`
- **Payload:**
```json
{
  "documentId": "6a246e46a37bb97881d9b227"
}
```
- **Response:**
```json
{
  "message": "PDF finalized with Certificate of Completion and cryptographic stamp.",
  "document": {
    "_id": "6a246e46a37bb97881d9b227",
    "ownerId": "6a246e44a37bb97881d9b21f",
    "filename": "temp_audit.pdf",
    "originalPath": "uploads/finalized-1780772425578-temp_audit.pdf",
    "status": "Signed",
    "isArchived": false,
    "isDeleted": false,
    "sharingEnabled": true,
    "sharePassword": "",
    "shareOneTimeOnly": false,
    "shareVisited": false,
    "versions": [
      {
        "versionNumber": 1,
        "filename": "temp_audit.pdf",
        "path": "uploads/file-1780772422138.pdf",
        "_id": "6a246e46a37bb97881d9b228",
        "createdAt": "2026-06-06T19:00:22.186Z"
      }
    ],
    "rejectionReason": "",
    "remindersEnabled": false,
    "reminderInterval": 3,
    "signingOrder": "Parallel",
    "sha256Checksum": "3a98095a10447112a4736faae71d88baaea0417f231f30be1fdca18bf74ad336",
    "isTemplate": false,
    "templateName": "",
    "reminderSent": false,
    "expiredEmailSent": false,
    "createdAt": "2026-06-06T19:00:22.187Z",
    "updatedAt": "2026-06-06T19:00:25.580Z",
    "__v": 0
  },
  "sha256Checksum": "3a98095a10447112a4736faae71d88baaea0417f231f30be1fdca18bf74ad336",
  "downloadUrl": "/uploads/finalized-1780772425578-temp_audit.pdf"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a246e46a37bb97881d9b227/download`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "fileBytesLength": "Buffer Received"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 15: View Audit Trail
- **Request URL:** `http://localhost:5000/api/audit/6a246e46a37bb97881d9b227`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a246e4aa37bb97881d9b23e",
    "documentId": "6a246e46a37bb97881d9b227",
    "userId": {
      "_id": "6a246e44a37bb97881d9b21f",
      "name": "Audit Tester",
      "email": "audit_user_0a7989@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T19:00:26.251Z",
    "updatedAt": "2026-06-06T19:00:26.251Z",
    "__v": 0
  },
  {
    "_id": "6a246e49a37bb97881d9b238",
    "documentId": "6a246e46a37bb97881d9b227",
    "userId": {
      "_id": "6a246e44a37bb97881d9b21f",
      "name": "Audit Tester",
      "email": "audit_user_0a7989@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-06T19:00:25.660Z",
    "updatedAt": "2026-06-06T19:00:25.660Z",
    "__v": 0
  },
  {
    "_id": "6a246e48a37bb97881d9b234",
    "documentId": "6a246e46a37bb97881d9b227",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-06T19:00:24.184Z",
    "updatedAt": "2026-06-06T19:00:24.184Z",
    "__v": 0
  },
  {
    "_id": "6a246e47a37bb97881d9b233",
    "documentId": "6a246e46a37bb97881d9b227",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T19:00:23.877Z",
    "updatedAt": "2026-06-06T19:00:23.877Z",
    "__v": 0
  },
  {
    "_id": "6a246e46a37bb97881d9b22b",
    "documentId": "6a246e46a37bb97881d9b227",
    "userId": {
      "_id": "6a246e44a37bb97881d9b21f",
      "name": "Audit Tester",
      "email": "audit_user_0a7989@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T19:00:22.547Z",
    "updatedAt": "2026-06-06T19:00:22.547Z",
    "__v": 0
  },
  {
    "_id": "6a246e46a37bb97881d9b229",
    "documentId": "6a246e46a37bb97881d9b227",
    "userId": {
      "_id": "6a246e44a37bb97881d9b21f",
      "name": "Audit Tester",
      "email": "audit_user_0a7989@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T19:00:22.340Z",
    "updatedAt": "2026-06-06T19:00:22.340Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

