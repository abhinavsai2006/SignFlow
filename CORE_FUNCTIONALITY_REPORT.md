# SignFlow — Core Functionality Report

Date: 2026-06-07T06:05:21.989Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_83b120@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a250a22c0ed23809580d4e8",
  "name": "Audit Tester",
  "email": "audit_user_83b120@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUwYTIyYzBlZDIzODA5NTgwZDRlOCIsImlhdCI6MTc4MDgxMjMyMiwiZXhwIjoxNzgwODEzMjIyfQ.j2L372SyxOQLQ8VHbRfx4QNsOHy2rCiGVAkbE_fNTL0",
  "isVerified": false,
  "verificationCode": "227427"
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
  "email": "audit_user_83b120@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "227427"
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
  "code": "227427"
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
  "email": "audit_user_83b120@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "message": "OTP sent to your email address",
  "requiresOtp": true,
  "email": "audit_user_83b120@example.com",
  "loginOtp": "529015"
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
  "email": "audit_user_83b120@example.com",
  "otp": "529015"
}
```
- **Response:**
```json
{
  "_id": "6a250a22c0ed23809580d4e8",
  "name": "Audit Tester",
  "email": "audit_user_83b120@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUwYTIyYzBlZDIzODA5NTgwZDRlOCIsImlhdCI6MTc4MDgxMjMyMywiZXhwIjoxNzgwODEzMjIzfQ.foSIK5_e8Hv9OAPz93Beg-O6ycqEM_0a2UR_h5jXAV0",
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
  "ownerId": "6a250a22c0ed23809580d4e8",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780812323866.pdf",
  "finalizedPath": null,
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
      "path": "uploads/file-1780812323866.pdf",
      "_id": "6a250a23c0ed23809580d4f0",
      "createdAt": "2026-06-07T06:05:23.909Z"
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
  "_id": "6a250a23c0ed23809580d4ef",
  "createdAt": "2026-06-07T06:05:23.910Z",
  "updatedAt": "2026-06-07T06:05:23.910Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a250a23c0ed23809580d4ef`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a250a23c0ed23809580d4ef",
  "ownerId": "6a250a22c0ed23809580d4e8",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780812323866.pdf",
  "finalizedPath": null,
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
      "path": "uploads/file-1780812323866.pdf",
      "_id": "6a250a23c0ed23809580d4f0",
      "createdAt": "2026-06-07T06:05:23.909Z"
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
  "createdAt": "2026-06-07T06:05:23.910Z",
  "updatedAt": "2026-06-07T06:05:23.910Z",
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
  "documentId": "6a250a23c0ed23809580d4ef",
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
  "documentId": "6a250a23c0ed23809580d4ef",
  "userId": "6a250a22c0ed23809580d4e8",
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
  "_id": "6a250a24c0ed23809580d4f5",
  "createdAt": "2026-06-07T06:05:24.527Z",
  "updatedAt": "2026-06-07T06:05:24.527Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a250a23c0ed23809580d4ef/recipients`
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
  "documentId": "6a250a23c0ed23809580d4ef",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a250a24c0ed23809580d4f7",
  "createdAt": "2026-06-07T06:05:24.731Z",
  "updatedAt": "2026-06-07T06:05:24.854Z",
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
- **Request URL:** `http://localhost:5000/api/docs/6a250a23c0ed23809580d4ef/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a250a23c0ed23809580d4ef",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780812323866.pdf",
  "status": "Pending",
  "createdAt": "2026-06-07T06:05:23.910Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a250a24c0ed23809580d4f5",
      "documentId": "6a250a23c0ed23809580d4ef",
      "userId": "6a250a22c0ed23809580d4e8",
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
      "createdAt": "2026-06-07T06:05:24.527Z",
      "updatedAt": "2026-06-07T06:05:24.527Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a250a24c0ed23809580d4f5/sign-public`
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
    "_id": "6a250a24c0ed23809580d4f5",
    "documentId": "6a250a23c0ed23809580d4ef",
    "userId": "6a250a22c0ed23809580d4e8",
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
    "createdAt": "2026-06-07T06:05:24.527Z",
    "updatedAt": "2026-06-07T06:05:25.896Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-24DEDE",
    "auditId": "AUD-99B988",
    "documentHash": "092933e6ac5363275e1c3e2f82db75891282acb737ad4e80c886b237c4043178"
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
  "documentId": "6a250a23c0ed23809580d4ef"
}
```
- **Response:**
```json
{
  "message": "PDF finalized with Certificate of Completion and cryptographic stamp.",
  "document": {
    "_id": "6a250a23c0ed23809580d4ef",
    "ownerId": "6a250a22c0ed23809580d4e8",
    "filename": "temp_audit.pdf",
    "originalPath": "uploads/file-1780812323866.pdf",
    "finalizedPath": "uploads/finalized-1780812327815-temp_audit.pdf",
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
        "path": "uploads/file-1780812323866.pdf",
        "_id": "6a250a23c0ed23809580d4f0",
        "createdAt": "2026-06-07T06:05:23.909Z"
      }
    ],
    "rejectionReason": "",
    "remindersEnabled": false,
    "reminderInterval": 3,
    "signingOrder": "Parallel",
    "sha256Checksum": "155608c9521dcc1bcd87efd4a50b12796ca493da667253c873b5170756ea63ce",
    "isTemplate": false,
    "templateName": "",
    "reminderSent": false,
    "expiredEmailSent": false,
    "createdAt": "2026-06-07T06:05:23.910Z",
    "updatedAt": "2026-06-07T06:05:27.817Z",
    "__v": 0
  },
  "sha256Checksum": "155608c9521dcc1bcd87efd4a50b12796ca493da667253c873b5170756ea63ce",
  "downloadUrl": "/uploads/finalized-1780812327815-temp_audit.pdf"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a250a23c0ed23809580d4ef/download`
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
- **Request URL:** `http://localhost:5000/api/audit/6a250a23c0ed23809580d4ef`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a250a28c0ed23809580d506",
    "documentId": "6a250a23c0ed23809580d4ef",
    "userId": {
      "_id": "6a250a22c0ed23809580d4e8",
      "name": "Audit Tester",
      "email": "audit_user_83b120@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:05:28.378Z",
    "updatedAt": "2026-06-07T06:05:28.378Z",
    "__v": 0
  },
  {
    "_id": "6a250a27c0ed23809580d500",
    "documentId": "6a250a23c0ed23809580d4ef",
    "userId": {
      "_id": "6a250a22c0ed23809580d4e8",
      "name": "Audit Tester",
      "email": "audit_user_83b120@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T06:05:27.965Z",
    "updatedAt": "2026-06-07T06:05:27.965Z",
    "__v": 0
  },
  {
    "_id": "6a250a25c0ed23809580d4fc",
    "documentId": "6a250a23c0ed23809580d4ef",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T06:05:25.939Z",
    "updatedAt": "2026-06-07T06:05:25.939Z",
    "__v": 0
  },
  {
    "_id": "6a250a25c0ed23809580d4fb",
    "documentId": "6a250a23c0ed23809580d4ef",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:05:25.728Z",
    "updatedAt": "2026-06-07T06:05:25.728Z",
    "__v": 0
  },
  {
    "_id": "6a250a24c0ed23809580d4f3",
    "documentId": "6a250a23c0ed23809580d4ef",
    "userId": {
      "_id": "6a250a22c0ed23809580d4e8",
      "name": "Audit Tester",
      "email": "audit_user_83b120@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:05:24.314Z",
    "updatedAt": "2026-06-07T06:05:24.314Z",
    "__v": 0
  },
  {
    "_id": "6a250a24c0ed23809580d4f1",
    "documentId": "6a250a23c0ed23809580d4ef",
    "userId": {
      "_id": "6a250a22c0ed23809580d4e8",
      "name": "Audit Tester",
      "email": "audit_user_83b120@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T06:05:24.078Z",
    "updatedAt": "2026-06-07T06:05:24.078Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

