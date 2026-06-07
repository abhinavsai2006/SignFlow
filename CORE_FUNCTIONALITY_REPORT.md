# SignFlow — Core Functionality Report

Date: 2026-06-07T07:04:16.640Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_50a41b@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a2517f0c125f79a65febe54",
  "name": "Audit Tester",
  "email": "audit_user_50a41b@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxN2YwYzEyNWY3OWE2NWZlYmU1NCIsImlhdCI6MTc4MDgxNTg1NiwiZXhwIjoxNzgwODE2NzU2fQ.44J-x7g3Ersoe-izR0n6IMtPuvPgwk8TTeneNnvnPz0",
  "isVerified": false,
  "verificationCode": "123230"
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
  "email": "audit_user_50a41b@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "123230"
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
  "code": "123230"
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
  "email": "audit_user_50a41b@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "message": "OTP sent to your email address",
  "requiresOtp": true,
  "email": "audit_user_50a41b@example.com",
  "loginOtp": "805836"
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
  "email": "audit_user_50a41b@example.com",
  "otp": "805836"
}
```
- **Response:**
```json
{
  "_id": "6a2517f0c125f79a65febe54",
  "name": "Audit Tester",
  "email": "audit_user_50a41b@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxN2YwYzEyNWY3OWE2NWZlYmU1NCIsImlhdCI6MTc4MDgxNTg1NywiZXhwIjoxNzgwODE2NzU3fQ.1pujj86LUQiUN4Qyf_gAKOV0b9H8UJd471xp0nliGvk",
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
  "ownerId": "6a2517f0c125f79a65febe54",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780815857541.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780815857541.pdf",
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
      "path": "uploads/file-1780815857541.pdf",
      "_id": "6a2517f1c125f79a65febe5c",
      "createdAt": "2026-06-07T07:04:17.583Z"
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
  "_id": "6a2517f1c125f79a65febe5b",
  "createdAt": "2026-06-07T07:04:17.583Z",
  "updatedAt": "2026-06-07T07:04:17.583Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a2517f1c125f79a65febe5b`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a2517f1c125f79a65febe5b",
  "ownerId": "6a2517f0c125f79a65febe54",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780815857541.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780815857541.pdf",
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
      "path": "uploads/file-1780815857541.pdf",
      "_id": "6a2517f1c125f79a65febe5c",
      "createdAt": "2026-06-07T07:04:17.583Z"
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
  "createdAt": "2026-06-07T07:04:17.583Z",
  "updatedAt": "2026-06-07T07:04:17.583Z",
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
  "documentId": "6a2517f1c125f79a65febe5b",
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
  "documentId": "6a2517f1c125f79a65febe5b",
  "userId": "6a2517f0c125f79a65febe54",
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
  "_id": "6a2517f1c125f79a65febe61",
  "createdAt": "2026-06-07T07:04:17.915Z",
  "updatedAt": "2026-06-07T07:04:17.915Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a2517f1c125f79a65febe5b/recipients`
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
  "documentId": "6a2517f1c125f79a65febe5b",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a2517f2c125f79a65febe63",
  "token": "8d99a784624d0466f472cc0d9616397a",
  "createdAt": "2026-06-07T07:04:18.037Z",
  "updatedAt": "2026-06-07T07:04:18.079Z",
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
- **Request URL:** `http://localhost:5000/api/docs/6a2517f1c125f79a65febe5b/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a2517f1c125f79a65febe5b",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780815857541.pdf",
  "status": "Pending",
  "createdAt": "2026-06-07T07:04:17.583Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a2517f1c125f79a65febe61",
      "documentId": "6a2517f1c125f79a65febe5b",
      "userId": "6a2517f0c125f79a65febe54",
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
      "createdAt": "2026-06-07T07:04:17.915Z",
      "updatedAt": "2026-06-07T07:04:17.915Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a2517f1c125f79a65febe61/sign-public`
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
    "_id": "6a2517f1c125f79a65febe61",
    "documentId": "6a2517f1c125f79a65febe5b",
    "userId": "6a2517f0c125f79a65febe54",
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
    "createdAt": "2026-06-07T07:04:17.915Z",
    "updatedAt": "2026-06-07T07:04:18.930Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-B38E8F",
    "auditId": "AUD-7C9917",
    "documentHash": "ac2516f01636dfa6134ebbb464d43a6401d4ab9fd7172acfde04651c65ba6556"
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
  "documentId": "6a2517f1c125f79a65febe5b"
}
```
- **Response:**
```json
{
  "message": "PDF finalized with Certificate of Completion and cryptographic stamp.",
  "document": {
    "_id": "6a2517f1c125f79a65febe5b",
    "ownerId": "6a2517f0c125f79a65febe54",
    "filename": "temp_audit.pdf",
    "originalPath": "uploads/file-1780815857541.pdf",
    "finalizedPath": "uploads/finalized-1780815859916-temp_audit.pdf",
    "originalFileUrl": "/data/uploads/file-1780815857541.pdf",
    "finalizedFileUrl": "/data/uploads/finalized-1780815859916-temp_audit.pdf",
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
        "path": "uploads/file-1780815857541.pdf",
        "_id": "6a2517f1c125f79a65febe5c",
        "createdAt": "2026-06-07T07:04:17.583Z"
      }
    ],
    "rejectionReason": "",
    "remindersEnabled": false,
    "reminderInterval": 3,
    "signingOrder": "Parallel",
    "sha256Checksum": "7eb2f4491ebb402f695034b8b60796345bbf3f1adf98706be188846161b15a3a",
    "isTemplate": false,
    "templateName": "",
    "reminderSent": false,
    "expiredEmailSent": false,
    "createdAt": "2026-06-07T07:04:17.583Z",
    "updatedAt": "2026-06-07T07:04:19.918Z",
    "__v": 0
  },
  "sha256Checksum": "7eb2f4491ebb402f695034b8b60796345bbf3f1adf98706be188846161b15a3a",
  "downloadUrl": "/uploads/finalized-1780815859916-temp_audit.pdf"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a2517f1c125f79a65febe5b/download`
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
- **Request URL:** `http://localhost:5000/api/audit/6a2517f1c125f79a65febe5b`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a2517f4c125f79a65febe72",
    "documentId": "6a2517f1c125f79a65febe5b",
    "userId": {
      "_id": "6a2517f0c125f79a65febe54",
      "name": "Audit Tester",
      "email": "audit_user_50a41b@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:04:20.178Z",
    "updatedAt": "2026-06-07T07:04:20.178Z",
    "__v": 0
  },
  {
    "_id": "6a2517f3c125f79a65febe6c",
    "documentId": "6a2517f1c125f79a65febe5b",
    "userId": {
      "_id": "6a2517f0c125f79a65febe54",
      "name": "Audit Tester",
      "email": "audit_user_50a41b@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T07:04:19.961Z",
    "updatedAt": "2026-06-07T07:04:19.961Z",
    "__v": 0
  },
  {
    "_id": "6a2517f2c125f79a65febe68",
    "documentId": "6a2517f1c125f79a65febe5b",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T07:04:18.980Z",
    "updatedAt": "2026-06-07T07:04:18.980Z",
    "__v": 0
  },
  {
    "_id": "6a2517f2c125f79a65febe67",
    "documentId": "6a2517f1c125f79a65febe5b",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:04:18.749Z",
    "updatedAt": "2026-06-07T07:04:18.749Z",
    "__v": 0
  },
  {
    "_id": "6a2517f1c125f79a65febe5f",
    "documentId": "6a2517f1c125f79a65febe5b",
    "userId": {
      "_id": "6a2517f0c125f79a65febe54",
      "name": "Audit Tester",
      "email": "audit_user_50a41b@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:04:17.793Z",
    "updatedAt": "2026-06-07T07:04:17.793Z",
    "__v": 0
  },
  {
    "_id": "6a2517f1c125f79a65febe5d",
    "documentId": "6a2517f1c125f79a65febe5b",
    "userId": {
      "_id": "6a2517f0c125f79a65febe54",
      "name": "Audit Tester",
      "email": "audit_user_50a41b@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:04:17.667Z",
    "updatedAt": "2026-06-07T07:04:17.667Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

