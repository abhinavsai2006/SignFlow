# SignFlow — Core Functionality Report

Date: 2026-06-07T06:57:11.800Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_cb0569@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a2516473854207a9c8d50e3",
  "name": "Audit Tester",
  "email": "audit_user_cb0569@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxNjQ3Mzg1NDIwN2E5YzhkNTBlMyIsImlhdCI6MTc4MDgxNTQzMiwiZXhwIjoxNzgwODE2MzMyfQ.IHAw54oPKkWZiGXwda9rB2gSP2UamlvVCdo_XgwQc1I",
  "isVerified": false,
  "verificationCode": "488598"
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
  "email": "audit_user_cb0569@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "488598"
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
  "code": "488598"
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
  "email": "audit_user_cb0569@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "message": "OTP sent to your email address",
  "requiresOtp": true,
  "email": "audit_user_cb0569@example.com",
  "loginOtp": "437216"
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
  "email": "audit_user_cb0569@example.com",
  "otp": "437216"
}
```
- **Response:**
```json
{
  "_id": "6a2516473854207a9c8d50e3",
  "name": "Audit Tester",
  "email": "audit_user_cb0569@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxNjQ3Mzg1NDIwN2E5YzhkNTBlMyIsImlhdCI6MTc4MDgxNTQzMiwiZXhwIjoxNzgwODE2MzMyfQ.IHAw54oPKkWZiGXwda9rB2gSP2UamlvVCdo_XgwQc1I",
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
  "ownerId": "6a2516473854207a9c8d50e3",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780815432726.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780815432726.pdf",
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
      "path": "uploads/file-1780815432726.pdf",
      "_id": "6a2516483854207a9c8d50eb",
      "createdAt": "2026-06-07T06:57:12.774Z"
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
  "_id": "6a2516483854207a9c8d50ea",
  "createdAt": "2026-06-07T06:57:12.775Z",
  "updatedAt": "2026-06-07T06:57:12.775Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a2516483854207a9c8d50ea`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a2516483854207a9c8d50ea",
  "ownerId": "6a2516473854207a9c8d50e3",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780815432726.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780815432726.pdf",
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
      "path": "uploads/file-1780815432726.pdf",
      "_id": "6a2516483854207a9c8d50eb",
      "createdAt": "2026-06-07T06:57:12.774Z"
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
  "createdAt": "2026-06-07T06:57:12.775Z",
  "updatedAt": "2026-06-07T06:57:12.775Z",
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
  "documentId": "6a2516483854207a9c8d50ea",
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
  "documentId": "6a2516483854207a9c8d50ea",
  "userId": "6a2516473854207a9c8d50e3",
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
  "_id": "6a2516493854207a9c8d50f0",
  "createdAt": "2026-06-07T06:57:13.130Z",
  "updatedAt": "2026-06-07T06:57:13.130Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a2516483854207a9c8d50ea/recipients`
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
  "documentId": "6a2516483854207a9c8d50ea",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a2516493854207a9c8d50f2",
  "token": "9bf258182212434a8b6fa46b07e694a8",
  "createdAt": "2026-06-07T06:57:13.267Z",
  "updatedAt": "2026-06-07T06:57:13.310Z",
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
- **Request URL:** `http://localhost:5000/api/docs/6a2516483854207a9c8d50ea/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a2516483854207a9c8d50ea",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780815432726.pdf",
  "status": "Pending",
  "createdAt": "2026-06-07T06:57:12.775Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a2516493854207a9c8d50f0",
      "documentId": "6a2516483854207a9c8d50ea",
      "userId": "6a2516473854207a9c8d50e3",
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
      "createdAt": "2026-06-07T06:57:13.130Z",
      "updatedAt": "2026-06-07T06:57:13.130Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a2516493854207a9c8d50f0/sign-public`
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
    "_id": "6a2516493854207a9c8d50f0",
    "documentId": "6a2516483854207a9c8d50ea",
    "userId": "6a2516473854207a9c8d50e3",
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
    "createdAt": "2026-06-07T06:57:13.130Z",
    "updatedAt": "2026-06-07T06:57:14.110Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-82EBA3",
    "auditId": "AUD-131672",
    "documentHash": "10adedf54cadc291d27f9e3de6a0b59821323c536af9f0ae5b945aecfd01fedb"
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
  "documentId": "6a2516483854207a9c8d50ea"
}
```
- **Response:**
```json
{
  "message": "PDF finalized with Certificate of Completion and cryptographic stamp.",
  "document": {
    "_id": "6a2516483854207a9c8d50ea",
    "ownerId": "6a2516473854207a9c8d50e3",
    "filename": "temp_audit.pdf",
    "originalPath": "uploads/file-1780815432726.pdf",
    "finalizedPath": "uploads/finalized-1780815435694-temp_audit.pdf",
    "originalFileUrl": "/data/uploads/file-1780815432726.pdf",
    "finalizedFileUrl": "/data/uploads/finalized-1780815435694-temp_audit.pdf",
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
        "path": "uploads/file-1780815432726.pdf",
        "_id": "6a2516483854207a9c8d50eb",
        "createdAt": "2026-06-07T06:57:12.774Z"
      }
    ],
    "rejectionReason": "",
    "remindersEnabled": false,
    "reminderInterval": 3,
    "signingOrder": "Parallel",
    "sha256Checksum": "7c28c46bd8af6c22a8264b8b45c9aa8162860aa5373a03b136d89b92a5d72441",
    "isTemplate": false,
    "templateName": "",
    "reminderSent": false,
    "expiredEmailSent": false,
    "createdAt": "2026-06-07T06:57:12.775Z",
    "updatedAt": "2026-06-07T06:57:15.696Z",
    "__v": 0
  },
  "sha256Checksum": "7c28c46bd8af6c22a8264b8b45c9aa8162860aa5373a03b136d89b92a5d72441",
  "downloadUrl": "/uploads/finalized-1780815435694-temp_audit.pdf"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a2516483854207a9c8d50ea/download`
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
- **Request URL:** `http://localhost:5000/api/audit/6a2516483854207a9c8d50ea`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a25164d3854207a9c8d5101",
    "documentId": "6a2516483854207a9c8d50ea",
    "userId": {
      "_id": "6a2516473854207a9c8d50e3",
      "name": "Audit Tester",
      "email": "audit_user_cb0569@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:57:17.143Z",
    "updatedAt": "2026-06-07T06:57:17.143Z",
    "__v": 0
  },
  {
    "_id": "6a25164b3854207a9c8d50fb",
    "documentId": "6a2516483854207a9c8d50ea",
    "userId": {
      "_id": "6a2516473854207a9c8d50e3",
      "name": "Audit Tester",
      "email": "audit_user_cb0569@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T06:57:15.740Z",
    "updatedAt": "2026-06-07T06:57:15.740Z",
    "__v": 0
  },
  {
    "_id": "6a25164a3854207a9c8d50f7",
    "documentId": "6a2516483854207a9c8d50ea",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T06:57:14.159Z",
    "updatedAt": "2026-06-07T06:57:14.159Z",
    "__v": 0
  },
  {
    "_id": "6a2516493854207a9c8d50f6",
    "documentId": "6a2516483854207a9c8d50ea",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:57:13.939Z",
    "updatedAt": "2026-06-07T06:57:13.939Z",
    "__v": 0
  },
  {
    "_id": "6a2516483854207a9c8d50ee",
    "documentId": "6a2516483854207a9c8d50ea",
    "userId": {
      "_id": "6a2516473854207a9c8d50e3",
      "name": "Audit Tester",
      "email": "audit_user_cb0569@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:57:12.996Z",
    "updatedAt": "2026-06-07T06:57:12.996Z",
    "__v": 0
  },
  {
    "_id": "6a2516483854207a9c8d50ec",
    "documentId": "6a2516483854207a9c8d50ea",
    "userId": {
      "_id": "6a2516473854207a9c8d50e3",
      "name": "Audit Tester",
      "email": "audit_user_cb0569@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:57:12.861Z",
    "updatedAt": "2026-06-07T06:57:12.861Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

