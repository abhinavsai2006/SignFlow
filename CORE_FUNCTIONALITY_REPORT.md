# SignFlow AI — Core Functionality Report

Date: 2026-06-06T18:25:24.276Z
Target API: `http://localhost:5000/api`

This report lists the verified HTTP requests, responses, and status codes for the 15 core application workflows.

### Step 1: Register Account
- **Request URL:** `http://localhost:5000/api/auth/register`
- **Method:** `POST`
- **Payload:**
```json
{
  "name": "Audit Tester",
  "email": "audit_user_a2f683@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a246614f3a014c18650a714",
  "name": "Audit Tester",
  "email": "audit_user_a2f683@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjQ2NjE0ZjNhMDE0YzE4NjUwYTcxNCIsImlhdCI6MTc4MDc3MDMyNCwiZXhwIjoxNzgwNzcxMjI0fQ.s09VdZVrkdh8qvnsC3x2tQxkxeqXDp_1_UJvA4uzzN8",
  "isVerified": false,
  "verificationCode": "524481"
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
  "email": "audit_user_a2f683@example.com"
}
```
- **Response:**
```json
{
  "verificationCode": "524481"
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
  "code": "524481"
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
  "email": "audit_user_a2f683@example.com",
  "password": "Password123!"
}
```
- **Response:**
```json
{
  "_id": "6a246614f3a014c18650a714",
  "name": "Audit Tester",
  "email": "audit_user_a2f683@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjQ2NjE0ZjNhMDE0YzE4NjUwYTcxNCIsImlhdCI6MTc4MDc3MDMyNSwiZXhwIjoxNzgwNzcxMjI1fQ.BMEwxO-I9b6apJ5PI_uNtwmVBNRMSr6kz7ZZ69BBjy4",
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
    "date": "Sat, 06 Jun 2026 18:25:25 GMT",
    "keep-alive": "timeout=5",
    "location": "http://localhost:5177/login?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjMxNjdjZDFmMzlhNjJkZjQ0YWQ0MSIsImlhdCI6MTc4MDc3MDMyNSwiZXhwIjoxNzgwNzcxMjI1fQ.Fv63imti-LWc6d7m9Qf1IibBrEasx3I8ovRH9GAxq-w&user=%7B%22_id%22%3A%226a23167cd1f39a62df44ad41%22%2C%22name%22%3A%22OAuth%20Google%20User%22%2C%22email%22%3A%22oauth_google_user%40example.com%22%2C%22isVerified%22%3Atrue%7D",
    "origin-agent-cluster": "?1",
    "ratelimit-limit": "20",
    "ratelimit-policy": "20;w=900",
    "ratelimit-remaining": "16",
    "ratelimit-reset": "900",
    "referrer-policy": "no-referrer",
    "set-cookie": "refreshToken=be2c28747581b5864bb64a37b48d0656150cdac8c7a2dc4763ec362777b0603c0821d7f16f4b5755; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/",
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
  "ownerId": "6a246614f3a014c18650a714",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780770325468.pdf",
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
      "path": "uploads/file-1780770325468.pdf",
      "_id": "6a246615f3a014c18650a71c",
      "createdAt": "2026-06-06T18:25:25.517Z"
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
  "_id": "6a246615f3a014c18650a71b",
  "createdAt": "2026-06-06T18:25:25.520Z",
  "updatedAt": "2026-06-06T18:25:25.520Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 7: Open PDF
- **Request URL:** `http://localhost:5000/api/docs/6a246615f3a014c18650a71b`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a246615f3a014c18650a71b",
  "ownerId": "6a246614f3a014c18650a714",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780770325468.pdf",
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
      "path": "uploads/file-1780770325468.pdf",
      "_id": "6a246615f3a014c18650a71c",
      "createdAt": "2026-06-06T18:25:25.517Z"
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
  "createdAt": "2026-06-06T18:25:25.520Z",
  "updatedAt": "2026-06-06T18:25:25.520Z",
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
  "documentId": "6a246615f3a014c18650a71b",
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
  "documentId": "6a246615f3a014c18650a71b",
  "userId": "6a246614f3a014c18650a714",
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
  "_id": "6a246616f3a014c18650a721",
  "createdAt": "2026-06-06T18:25:26.040Z",
  "updatedAt": "2026-06-06T18:25:26.040Z",
  "__v": 0
}
```
- **Status Code:** `201`
- **Console Errors / Warnings:** `None`

---

### Step 9: Send Document
- **Request URL:** `http://localhost:5000/api/docs/6a246615f3a014c18650a71b/recipients`
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
  "documentId": "6a246615f3a014c18650a71b",
  "email": "signer_test@example.com",
  "name": "Test Signer",
  "role": "Signer",
  "status": "Notified",
  "sequence": 1,
  "_id": "6a246616f3a014c18650a723",
  "createdAt": "2026-06-06T18:25:26.219Z",
  "updatedAt": "2026-06-06T18:25:26.282Z",
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
- **Request URL:** `http://localhost:5000/api/docs/6a246615f3a014c18650a71b/public`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
{
  "_id": "6a246615f3a014c18650a71b",
  "filename": "temp_audit.pdf",
  "originalPath": "uploads/file-1780770325468.pdf",
  "status": "Pending",
  "createdAt": "2026-06-06T18:25:25.520Z",
  "sha256Checksum": null,
  "signatureFields": [
    {
      "_id": "6a246616f3a014c18650a721",
      "documentId": "6a246615f3a014c18650a71b",
      "userId": "6a246614f3a014c18650a714",
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
      "createdAt": "2026-06-06T18:25:26.040Z",
      "updatedAt": "2026-06-06T18:25:26.040Z",
      "__v": 0
    }
  ]
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 12: Sign Document
- **Request URL:** `http://localhost:5000/api/signatures/6a246616f3a014c18650a721/sign-public`
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
    "_id": "6a246616f3a014c18650a721",
    "documentId": "6a246615f3a014c18650a71b",
    "userId": "6a246614f3a014c18650a714",
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
    "createdAt": "2026-06-06T18:25:26.040Z",
    "updatedAt": "2026-06-06T18:25:27.220Z",
    "__v": 0,
    "value": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "signerName": "Test Signer",
    "browser": "Chrome",
    "device": "Desktop",
    "operatingSystem": "Windows",
    "isp": "Development Network",
    "certificateId": "SIG-2026-21B131",
    "auditId": "AUD-EFC331",
    "documentHash": "5bcc15743790d34cf2f20201c98473a60c4a38e8ca05fa44da687282e2c8e96a"
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
  "documentId": "6a246615f3a014c18650a71b"
}
```
- **Response:**
```json
{
  "message": "PDF finalized with Certificate of Completion and cryptographic stamp.",
  "document": {
    "_id": "6a246615f3a014c18650a71b",
    "ownerId": "6a246614f3a014c18650a714",
    "filename": "temp_audit.pdf",
    "originalPath": "uploads/finalized-1780770328404-temp_audit.pdf",
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
        "path": "uploads/file-1780770325468.pdf",
        "_id": "6a246615f3a014c18650a71c",
        "createdAt": "2026-06-06T18:25:25.517Z"
      }
    ],
    "rejectionReason": "",
    "remindersEnabled": false,
    "reminderInterval": 3,
    "signingOrder": "Parallel",
    "sha256Checksum": "0035143855db90a306997c8c7279c8b41b50aa7e3f27add3270f54b1b4d47b36",
    "isTemplate": false,
    "templateName": "",
    "reminderSent": false,
    "expiredEmailSent": false,
    "createdAt": "2026-06-06T18:25:25.520Z",
    "updatedAt": "2026-06-06T18:25:28.405Z",
    "__v": 0
  },
  "sha256Checksum": "0035143855db90a306997c8c7279c8b41b50aa7e3f27add3270f54b1b4d47b36",
  "downloadUrl": "/uploads/finalized-1780770328404-temp_audit.pdf"
}
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

### Step 14: Download PDF
- **Request URL:** `http://localhost:5000/api/docs/6a246615f3a014c18650a71b/download`
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
- **Request URL:** `http://localhost:5000/api/audit/6a246615f3a014c18650a71b`
- **Method:** `GET`
- **Payload:**
```json
{}
```
- **Response:**
```json
[
  {
    "_id": "6a246618f3a014c18650a732",
    "documentId": "6a246615f3a014c18650a71b",
    "userId": {
      "_id": "6a246614f3a014c18650a714",
      "name": "Audit Tester",
      "email": "audit_user_a2f683@example.com"
    },
    "action": "Download",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T18:25:28.869Z",
    "updatedAt": "2026-06-06T18:25:28.869Z",
    "__v": 0
  },
  {
    "_id": "6a246618f3a014c18650a72c",
    "documentId": "6a246615f3a014c18650a71b",
    "userId": {
      "_id": "6a246614f3a014c18650a714",
      "name": "Audit Tester",
      "email": "audit_user_a2f683@example.com"
    },
    "action": "Finalize",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-06T18:25:28.470Z",
    "updatedAt": "2026-06-06T18:25:28.470Z",
    "__v": 0
  },
  {
    "_id": "6a246617f3a014c18650a728",
    "documentId": "6a246615f3a014c18650a71b",
    "userId": null,
    "action": "Public Sign by signer_test@example.com",
    "ipAddress": "127.0.0.1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Local Development Environment",
    "createdAt": "2026-06-06T18:25:27.306Z",
    "updatedAt": "2026-06-06T18:25:27.306Z",
    "__v": 0
  },
  {
    "_id": "6a246616f3a014c18650a727",
    "documentId": "6a246615f3a014c18650a71b",
    "userId": null,
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T18:25:26.933Z",
    "updatedAt": "2026-06-06T18:25:26.933Z",
    "__v": 0
  },
  {
    "_id": "6a246615f3a014c18650a71f",
    "documentId": "6a246615f3a014c18650a71b",
    "userId": {
      "_id": "6a246614f3a014c18650a714",
      "name": "Audit Tester",
      "email": "audit_user_a2f683@example.com"
    },
    "action": "View",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T18:25:25.809Z",
    "updatedAt": "2026-06-06T18:25:25.809Z",
    "__v": 0
  },
  {
    "_id": "6a246615f3a014c18650a71d",
    "documentId": "6a246615f3a014c18650a71b",
    "userId": {
      "_id": "6a246614f3a014c18650a714",
      "name": "Audit Tester",
      "email": "audit_user_a2f683@example.com"
    },
    "action": "Upload",
    "ipAddress": "::1",
    "userAgent": "node",
    "device": "Desktop",
    "country": "Localhost",
    "createdAt": "2026-06-06T18:25:25.667Z",
    "updatedAt": "2026-06-06T18:25:25.667Z",
    "__v": 0
  }
]
```
- **Status Code:** `200`
- **Console Errors / Warnings:** `None`

---

