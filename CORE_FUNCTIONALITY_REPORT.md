# SignFlow — Core Functionality Report

Date: 2026-06-07T07:33:26.170Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_0e37eb@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a251ec62ea51100be137153",
  "name": "Audit Tester",
  "email": "audit_user_0e37eb@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxZWM2MmVhNTExMDBiZTEzNzE1MyIsImlhdCI6MTc4MDgxNzYwNiwiZXhwIjoxNzgwODE4NTA2fQ.0g9vecL-EYz9IB00DpVMMiTrNNqtN0SQ1CN7t9YkxaA",
  "isVerified": false,
  "verificationCode": "653650"
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
  "email": "audit_user_0e37eb@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "653650"
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
  "code": "653650"
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
  "email": "audit_user_0e37eb@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "message": "OTP sent to your email address",
  "requiresOtp": true,
  "email": "audit_user_0e37eb@example.com",
  "loginOtp": "442888"
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
  "email": "audit_user_0e37eb@example.com",
  "otp": "442888"
}
```
- **Response:**
```json
{
  "_id": "6a251ec62ea51100be137153",
  "name": "Audit Tester",
  "email": "audit_user_0e37eb@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjUxZWM2MmVhNTExMDBiZTEzNzE1MyIsImlhdCI6MTc4MDgxNzYwNywiZXhwIjoxNzgwODE4NTA3fQ.xlbv7Tl6H3eVH0tSQJl-vH91Yl5JrkUw8wSYaIa3lk0",
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
  "ownerId": "6a251ec62ea51100be137153",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780817607311.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780817607311.pdf",
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
      "path": "uploads/file-1780817607311.pdf",
      "_id": "6a251ec72ea51100be13715b",
      "createdAt": "2026-06-07T07:33:27.364Z"
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
  "_id": "6a251ec72ea51100be13715a",
  "createdAt": "2026-06-07T07:33:27.367Z",
  "updatedAt": "2026-06-07T07:33:27.367Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a251ec72ea51100be13715a`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a251ec72ea51100be13715a",
  "ownerId": "6a251ec62ea51100be137153",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780817607311.pdf",
  "finalizedPath": null,
  "originalFileUrl": "/data/uploads/file-1780817607311.pdf",
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
      "path": "uploads/file-1780817607311.pdf",
      "_id": "6a251ec72ea51100be13715b",
      "createdAt": "2026-06-07T07:33:27.364Z"
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
  "createdAt": "2026-06-07T07:33:27.367Z",
  "updatedAt": "2026-06-07T07:33:27.367Z",
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
  "documentId": "6a251ec72ea51100be13715a",
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
  "documentId": "6a251ec72ea51100be13715a",
  "userId": "6a251ec62ea51100be137153",
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
  "_id": "6a251ec72ea51100be137160",
  "createdAt": "2026-06-07T07:33:27.729Z",
  "updatedAt": "2026-06-07T07:33:27.729Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a251ec72ea51100be13715a/recipients`
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
  "documentId": "6a251ec72ea51100be13715a",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a251ec72ea51100be137162",
  "token": "248521682109b7dc3efa115181a4c601",
  "createdAt": "2026-06-07T07:33:27.864Z",
  "updatedAt": "2026-06-07T07:33:27.910Z",
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
- **Request URL:** `http://localhost:5000/api/docs/6a251ec72ea51100be13715a/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a251ec72ea51100be13715a",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780817607311.pdf",
  "status": "Pending",
  "createdAt": "2026-06-07T07:33:27.367Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a251ec72ea51100be137160",
      "documentId": "6a251ec72ea51100be13715a",
      "userId": "6a251ec62ea51100be137153",
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
      "createdAt": "2026-06-07T07:33:27.729Z",
      "updatedAt": "2026-06-07T07:33:27.729Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a251ec72ea51100be137160/sign-public`
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
    "_id": "6a251ec72ea51100be137160",
    "documentId": "6a251ec72ea51100be13715a",
    "userId": "6a251ec62ea51100be137153",
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
    "createdAt": "2026-06-07T07:33:27.729Z",
    "updatedAt": "2026-06-07T07:33:29.642Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-73B660",
    "auditId": "AUD-6923D9",
    "documentHash": "a9ae2a724634a36aa829d6600f7531bb46f9d0d9228bdbc4db1cd7081bd1d169"
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
  "documentId": "6a251ec72ea51100be13715a"
}
```
- **Response:**
```json
{
  "message": "PDF finalized with Certificate of Completion and cryptographic stamp.",
  "document": {
    "_id": "6a251ec72ea51100be13715a",
    "ownerId": "6a251ec62ea51100be137153",
    "filename": "temp_audit.pdf",
    "originalPath": "uploads/file-1780817607311.pdf",
    "finalizedPath": "uploads/finalized-1780817611381-temp_audit.pdf",
    "originalFileUrl": "/data/uploads/file-1780817607311.pdf",
    "finalizedFileUrl": "/data/uploads/finalized-1780817611381-temp_audit.pdf",
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
        "path": "uploads/file-1780817607311.pdf",
        "_id": "6a251ec72ea51100be13715b",
        "createdAt": "2026-06-07T07:33:27.364Z"
      }
    ],
    "rejectionReason": "",
    "remindersEnabled": false,
    "reminderInterval": 3,
    "signingOrder": "Parallel",
    "sha256Checksum": "a8fcf3a34e3d8480a9829acebe2f7eb0898324dd70182ae0aeb3993ce55205c1",
    "isTemplate": false,
    "templateName": "",
    "reminderSent": false,
    "expiredEmailSent": false,
    "createdAt": "2026-06-07T07:33:27.367Z",
    "updatedAt": "2026-06-07T07:33:31.386Z",
    "__v": 0
  },
  "sha256Checksum": "a8fcf3a34e3d8480a9829acebe2f7eb0898324dd70182ae0aeb3993ce55205c1",
  "downloadUrl": "/uploads/finalized-1780817611381-temp_audit.pdf"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a251ec72ea51100be13715a/download`
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
- **Request URL:** `http://localhost:5000/api/audit/6a251ec72ea51100be13715a`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a251ecb2ea51100be137171",
    "documentId": "6a251ec72ea51100be13715a",
    "userId": {
      "_id": "6a251ec62ea51100be137153",
      "name": "Audit Tester",
      "email": "audit_user_0e37eb@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:33:31.896Z",
    "updatedAt": "2026-06-07T07:33:31.896Z",
    "__v": 0
  },
  {
    "_id": "6a251ecb2ea51100be13716b",
    "documentId": "6a251ec72ea51100be13715a",
    "userId": {
      "_id": "6a251ec62ea51100be137153",
      "name": "Audit Tester",
      "email": "audit_user_0e37eb@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T07:33:31.484Z",
    "updatedAt": "2026-06-07T07:33:31.484Z",
    "__v": 0
  },
  {
    "_id": "6a251ec92ea51100be137167",
    "documentId": "6a251ec72ea51100be13715a",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-07T07:33:29.707Z",
    "updatedAt": "2026-06-07T07:33:29.707Z",
    "__v": 0
  },
  {
    "_id": "6a251ec92ea51100be137166",
    "documentId": "6a251ec72ea51100be13715a",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:33:29.372Z",
    "updatedAt": "2026-06-07T07:33:29.372Z",
    "__v": 0
  },
  {
    "_id": "6a251ec72ea51100be13715e",
    "documentId": "6a251ec72ea51100be13715a",
    "userId": {
      "_id": "6a251ec62ea51100be137153",
      "name": "Audit Tester",
      "email": "audit_user_0e37eb@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:33:27.591Z",
    "updatedAt": "2026-06-07T07:33:27.591Z",
    "__v": 0
  },
  {
    "_id": "6a251ec72ea51100be13715c",
    "documentId": "6a251ec72ea51100be13715a",
    "userId": {
      "_id": "6a251ec62ea51100be137153",
      "name": "Audit Tester",
      "email": "audit_user_0e37eb@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-07T07:33:27.455Z",
    "updatedAt": "2026-06-07T07:33:27.455Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

