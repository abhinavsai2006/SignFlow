# SignFlow — Core Functionality Report

Date: 2026-06-06T20:00:33.465Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_baf9bb@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a247c61e1d77c7acb1e2815",
  "name": "Audit Tester",
  "email": "audit_user_baf9bb@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjQ3YzYxZTFkNzdjN2FjYjFlMjgxNSIsImlhdCI6MTc4MDc3NjAzMywiZXhwIjoxNzgwNzc2OTMzfQ.3pSZsabALBf3hiTJHZRXAn8NYRaYFDkfgG0XFnsxtxE",
  "isVerified": false,
  "verificationCode": "720168"
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
  "email": "audit_user_baf9bb@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "720168"
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
  "code": "720168"
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
  "email": "audit_user_baf9bb@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "requiresOtp": true,
  "email": "audit_user_baf9bb@example.com",
  "loginOtp": "952897"
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
  "email": "audit_user_baf9bb@example.com",
  "otp": "952897"
}
```
- **Response:**
```json
{
  "_id": "6a247c61e1d77c7acb1e2815",
  "name": "Audit Tester",
  "email": "audit_user_baf9bb@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjQ3YzYxZTFkNzdjN2FjYjFlMjgxNSIsImlhdCI6MTc4MDc3NjAzNCwiZXhwIjoxNzgwNzc2OTM0fQ.HVuZQzcJ3kduN_X6KyN1qm4gxAnzYm0bTs4sHV5P2k4",
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
  "message": "Redirect/HTML Response"
}
```
- **Status Code:** `404`
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
  "ownerId": "6a247c61e1d77c7acb1e2815",
  "filename": "temp_audit.pdf",
  "originalPath": "E:/Labmetrix/Project-1/backend/uploads/file-1780776034711.pdf",
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
      "path": "E:/Labmetrix/Project-1/backend/uploads/file-1780776034711.pdf",
      "_id": "6a247c62e1d77c7acb1e281d",
      "createdAt": "2026-06-06T20:00:34.798Z"
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
  "_id": "6a247c62e1d77c7acb1e281c",
  "createdAt": "2026-06-06T20:00:34.799Z",
  "updatedAt": "2026-06-06T20:00:34.799Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a247c62e1d77c7acb1e281c`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a247c62e1d77c7acb1e281c",
  "ownerId": "6a247c61e1d77c7acb1e2815",
  "filename": "temp_audit.pdf",
  "originalPath": "E:/Labmetrix/Project-1/backend/uploads/file-1780776034711.pdf",
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
      "path": "E:/Labmetrix/Project-1/backend/uploads/file-1780776034711.pdf",
      "_id": "6a247c62e1d77c7acb1e281d",
      "createdAt": "2026-06-06T20:00:34.798Z"
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
  "createdAt": "2026-06-06T20:00:34.799Z",
  "updatedAt": "2026-06-06T20:00:34.799Z",
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
  "documentId": "6a247c62e1d77c7acb1e281c",
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
  "documentId": "6a247c62e1d77c7acb1e281c",
  "userId": "6a247c61e1d77c7acb1e2815",
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
  "_id": "6a247c63e1d77c7acb1e2822",
  "createdAt": "2026-06-06T20:00:35.416Z",
  "updatedAt": "2026-06-06T20:00:35.416Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a247c62e1d77c7acb1e281c/recipients`
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
  "documentId": "6a247c62e1d77c7acb1e281c",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a247c63e1d77c7acb1e2824",
  "createdAt": "2026-06-06T20:00:35.673Z",
  "updatedAt": "2026-06-06T20:00:35.810Z",
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
- **Request URL:** `http://localhost:5000/api/docs/6a247c62e1d77c7acb1e281c/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a247c62e1d77c7acb1e281c",
  "filename": "temp_audit.pdf",
  "originalPath": "E:/Labmetrix/Project-1/backend/uploads/file-1780776034711.pdf",
  "status": "Pending",
  "createdAt": "2026-06-06T20:00:34.799Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a247c63e1d77c7acb1e2822",
      "documentId": "6a247c62e1d77c7acb1e281c",
      "userId": "6a247c61e1d77c7acb1e2815",
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
      "createdAt": "2026-06-06T20:00:35.416Z",
      "updatedAt": "2026-06-06T20:00:35.416Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a247c63e1d77c7acb1e2822/sign-public`
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
    "_id": "6a247c63e1d77c7acb1e2822",
    "documentId": "6a247c62e1d77c7acb1e281c",
    "userId": "6a247c61e1d77c7acb1e2815",
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
    "createdAt": "2026-06-06T20:00:35.416Z",
    "updatedAt": "2026-06-06T20:00:37.526Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-19D223",
    "auditId": "AUD-7D6795",
    "documentHash": "df4711416e9b5ed50f57c398894e1c147764ca298f1f9f40cc112c681deba360"
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
  "documentId": "6a247c62e1d77c7acb1e281c"
}
```
- **Response:**
```json
{
  "message": "Failed to finalize PDF document",
  "error": "relativePath is not defined"
}
```
- **Status Code:** `500`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a247c62e1d77c7acb1e281c/download`
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
- **Request URL:** `http://localhost:5000/api/audit/6a247c62e1d77c7acb1e281c`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a247c66e1d77c7acb1e2833",
    "documentId": "6a247c62e1d77c7acb1e281c",
    "userId": {
      "_id": "6a247c61e1d77c7acb1e2815",
      "name": "Audit Tester",
      "email": "audit_user_baf9bb@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T20:00:38.975Z",
    "updatedAt": "2026-06-06T20:00:38.975Z",
    "__v": 0
  },
  {
    "_id": "6a247c66e1d77c7acb1e282d",
    "documentId": "6a247c62e1d77c7acb1e281c",
    "userId": {
      "_id": "6a247c61e1d77c7acb1e2815",
      "name": "Audit Tester",
      "email": "audit_user_baf9bb@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-06T20:00:38.589Z",
    "updatedAt": "2026-06-06T20:00:38.589Z",
    "__v": 0
  },
  {
    "_id": "6a247c65e1d77c7acb1e2829",
    "documentId": "6a247c62e1d77c7acb1e281c",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-06T20:00:37.568Z",
    "updatedAt": "2026-06-06T20:00:37.568Z",
    "__v": 0
  },
  {
    "_id": "6a247c65e1d77c7acb1e2828",
    "documentId": "6a247c62e1d77c7acb1e281c",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T20:00:37.321Z",
    "updatedAt": "2026-06-06T20:00:37.321Z",
    "__v": 0
  },
  {
    "_id": "6a247c63e1d77c7acb1e2820",
    "documentId": "6a247c62e1d77c7acb1e281c",
    "userId": {
      "_id": "6a247c61e1d77c7acb1e2815",
      "name": "Audit Tester",
      "email": "audit_user_baf9bb@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T20:00:35.265Z",
    "updatedAt": "2026-06-06T20:00:35.265Z",
    "__v": 0
  },
  {
    "_id": "6a247c62e1d77c7acb1e281e",
    "documentId": "6a247c62e1d77c7acb1e281c",
    "userId": {
      "_id": "6a247c61e1d77c7acb1e2815",
      "name": "Audit Tester",
      "email": "audit_user_baf9bb@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T20:00:34.991Z",
    "updatedAt": "2026-06-06T20:00:34.991Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

