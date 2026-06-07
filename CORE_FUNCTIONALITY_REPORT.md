# SignFlow — Core Functionality Report

Date: 2026-06-07T07:15:22.543Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_bfb0a4@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a251a8afe25c1c044e958cf",
  "name": "Audit Tester",
  "email": "audit_user_bfb0a4@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxYThhZmUyNWMxYzA0NGU5NThjZiIsImlhdCI6MTc4MDgxNjUyMywiZXhwIjoxNzgwODE3NDIzfQ.y6ReCHJIEtPsqrtRfWEKe_pgnOCKejaxLMlnn6KOmlU",
  "isVerified": false,
  "verificationCode": "125867"
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
  "email": "audit_user_bfb0a4@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "125867"
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
  "code": "125867"
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
  "email": "audit_user_bfb0a4@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "message": "OTP sent to your email address",
  "requiresOtp": true,
  "email": "audit_user_bfb0a4@example.com",
  "loginOtp": "578746"
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
  "email": "audit_user_bfb0a4@example.com",
  "otp": "578746"
}
```
- **Response:**
```json
{
  "_id": "6a251a8afe25c1c044e958cf",
  "name": "Audit Tester",
  "email": "audit_user_bfb0a4@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxYThhZmUyNWMxYzA0NGU5NThjZiIsImlhdCI6MTc4MDgxNjUyMywiZXhwIjoxNzgwODE3NDIzfQ.y6ReCHJIEtPsqrtRfWEKe_pgnOCKejaxLMlnn6KOmlU",
  "isVerified": true
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 5: Google Login
- **Request URL:** `http://localhost:5000/api/auth/google`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "message": "OAuth Redirect to Google Identity Provider Initialized",
  "location": "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fauth%2Fgoogle%2Fcallback&scope=profile%20email&client_id=240832132036-43t3nd9aqqmnlq6v3iaibfhpm3t2668d.apps.googleusercontent.com"
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
  "ownerId": "6a251a8afe25c1c044e958cf",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780816523896.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780816523896.pdf",
  "finalizedFileUrl": null,
  "auditFileUrl": null,
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
      "path": "uploads/file-1780816523896.pdf",
      "_id": "6a251a8bfe25c1c044e958d7",
      "createdAt": "2026-06-07T07:15:23.955Z"
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
  "_id": "6a251a8bfe25c1c044e958d6",
  "createdAt": "2026-06-07T07:15:23.959Z",
  "updatedAt": "2026-06-07T07:15:23.959Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a251a8bfe25c1c044e958d6`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a251a8bfe25c1c044e958d6",
  "ownerId": "6a251a8afe25c1c044e958cf",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780816523896.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780816523896.pdf",
  "finalizedFileUrl": null,
  "auditFileUrl": null,
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
      "path": "uploads/file-1780816523896.pdf",
      "_id": "6a251a8bfe25c1c044e958d7",
      "createdAt": "2026-06-07T07:15:23.955Z"
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
  "createdAt": "2026-06-07T07:15:23.959Z",
  "updatedAt": "2026-06-07T07:15:23.959Z",
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
  "documentId": "6a251a8bfe25c1c044e958d6",
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
  "documentId": "6a251a8bfe25c1c044e958d6",
  "userId": "6a251a8afe25c1c044e958cf",
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
  "_id": "6a251a8cfe25c1c044e958dc",
  "createdAt": "2026-06-07T07:15:24.367Z",
  "updatedAt": "2026-06-07T07:15:24.367Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a251a8bfe25c1c044e958d6/recipients`
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
  "documentId": "6a251a8bfe25c1c044e958d6",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a251a8cfe25c1c044e958de",
  "token": "5066f214026dae3bd1923c0ca21f0225",
  "createdAt": "2026-06-07T07:15:24.509Z",
  "updatedAt": "2026-06-07T07:15:24.562Z",
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
- **Request URL:** `http://localhost:5000/api/docs/6a251a8bfe25c1c044e958d6/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a251a8bfe25c1c044e958d6",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780816523896.pdf",
  "status": "Pending",
  "createdAt": "2026-06-07T07:15:23.959Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a251a8cfe25c1c044e958dc",
      "documentId": "6a251a8bfe25c1c044e958d6",
      "userId": "6a251a8afe25c1c044e958cf",
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
      "createdAt": "2026-06-07T07:15:24.367Z",
      "updatedAt": "2026-06-07T07:15:24.367Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a251a8cfe25c1c044e958dc/sign-public`
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
    "_id": "6a251a8cfe25c1c044e958dc",
    "documentId": "6a251a8bfe25c1c044e958d6",
    "userId": "6a251a8afe25c1c044e958cf",
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
    "createdAt": "2026-06-07T07:15:24.367Z",
    "updatedAt": "2026-06-07T07:15:25.463Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-EF638F",
    "auditId": "AUD-A21B9A",
    "documentHash": "acca15c54b637c19b3807a6392b5b61e31634ac9f2be2004db227e1be5721733"
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
  "documentId": "6a251a8bfe25c1c044e958d6"
}
```
- **Response:**
```json
{
  "message": "PDF finalized with Certificate of Completion and cryptographic stamp.",
  "document": {
    "_id": "6a251a8bfe25c1c044e958d6",
    "ownerId": "6a251a8afe25c1c044e958cf",
    "filename": "temp_audit.pdf",
    "originalPath": "uploads/file-1780816523896.pdf",
    "finalizedPath": "uploads/finalized-1780816527335-temp_audit.pdf",
    "originalFileUrl": "/data/uploads/file-1780816523896.pdf",
    "finalizedFileUrl": "/data/uploads/finalized-1780816527335-temp_audit.pdf",
    "auditFileUrl": null,
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
        "path": "uploads/file-1780816523896.pdf",
        "_id": "6a251a8bfe25c1c044e958d7",
        "createdAt": "2026-06-07T07:15:23.955Z"
      }
    ],
    "rejectionReason": "",
    "remindersEnabled": false,
    "reminderInterval": 3,
    "signingOrder": "Parallel",
    "sha256Checksum": "a071ce222e85dcc673445011cb3ec93a452f936b9b13786396f466ad73681c0f",
    "isTemplate": false,
    "templateName": "",
    "reminderSent": false,
    "expiredEmailSent": false,
    "createdAt": "2026-06-07T07:15:23.959Z",
    "updatedAt": "2026-06-07T07:15:27.341Z",
    "__v": 0
  },
  "sha256Checksum": "a071ce222e85dcc673445011cb3ec93a452f936b9b13786396f466ad73681c0f",
  "downloadUrl": "/uploads/finalized-1780816527335-temp_audit.pdf"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a251a8bfe25c1c044e958d6/download`
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
- **Request URL:** `http://localhost:5000/api/audit/6a251a8bfe25c1c044e958d6`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a251a8ffe25c1c044e958ed",
    "documentId": "6a251a8bfe25c1c044e958d6",
    "userId": {
      "_id": "6a251a8afe25c1c044e958cf",
      "name": "Audit Tester",
      "email": "audit_user_bfb0a4@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:15:27.632Z",
    "updatedAt": "2026-06-07T07:15:27.632Z",
    "__v": 0
  },
  {
    "_id": "6a251a8ffe25c1c044e958e7",
    "documentId": "6a251a8bfe25c1c044e958d6",
    "userId": {
      "_id": "6a251a8afe25c1c044e958cf",
      "name": "Audit Tester",
      "email": "audit_user_bfb0a4@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T07:15:27.408Z",
    "updatedAt": "2026-06-07T07:15:27.408Z",
    "__v": 0
  },
  {
    "_id": "6a251a8dfe25c1c044e958e3",
    "documentId": "6a251a8bfe25c1c044e958d6",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T07:15:25.512Z",
    "updatedAt": "2026-06-07T07:15:25.512Z",
    "__v": 0
  },
  {
    "_id": "6a251a8dfe25c1c044e958e2",
    "documentId": "6a251a8bfe25c1c044e958d6",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:15:25.236Z",
    "updatedAt": "2026-06-07T07:15:25.236Z",
    "__v": 0
  },
  {
    "_id": "6a251a8cfe25c1c044e958da",
    "documentId": "6a251a8bfe25c1c044e958d6",
    "userId": {
      "_id": "6a251a8afe25c1c044e958cf",
      "name": "Audit Tester",
      "email": "audit_user_bfb0a4@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:15:24.208Z",
    "updatedAt": "2026-06-07T07:15:24.208Z",
    "__v": 0
  },
  {
    "_id": "6a251a8cfe25c1c044e958d8",
    "documentId": "6a251a8bfe25c1c044e958d6",
    "userId": {
      "_id": "6a251a8afe25c1c044e958cf",
      "name": "Audit Tester",
      "email": "audit_user_bfb0a4@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:15:24.067Z",
    "updatedAt": "2026-06-07T07:15:24.067Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

