# SignFlow — Data Integrity Report

Date: 2026-06-06T18:59:10.086Z

## 1. Duplicate Users Check
✅ No duplicate email addresses found in Users collection.

## 2. Orphaned Documents Check
✅ No orphaned documents found (All documents have valid owners).

## 3. Missing File Paths Check
❌ Found **1** document records pointing to non-existent files:
- ID: `6a246898dac4406df78ee399` | Name: `test-certificate.pdf` | Path: `uploads/finalized-1780771045905-test-certificate.pdf`

## 4. Invalid Signature Field References
✅ No orphaned signature fields found.

## 5. Audit Log Coverage Check
❌ Found **5** documents with zero audit logs:
- Document IDs: 6a23056c060402086a5100e6, 6a230578060402086a5100e7, 6a230662060402086a5100e8, 6a2307f8c7e7548202e3424a, 6a230a37c7e7548202e3424b

## 6. Sessions & Verification Records Overview
- Users with pending email verification OTPs: **0**
- Users with pending login OTPs: **2**

## 7. Action Plan & Integrity Status
✅ **INTEGRITY PASS:** No critical relational database errors detected.
