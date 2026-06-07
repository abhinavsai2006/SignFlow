# SignFlow — Data Integrity Report

Date: 2026-06-07T07:05:30.090Z

## 1. Duplicate Users Check
✅ No duplicate email addresses found in Users collection.

## 2. Orphaned Documents Check
✅ No orphaned documents found (All documents have valid owners).

## 3. Missing File Paths Check
❌ Found **9** document records pointing to non-existent files:
- ID: `6a246898dac4406df78ee399` | Name: `test-certificate.pdf` | Path: `uploads/finalized-1780771045905-test-certificate.pdf`
- ID: `6a2488550749b53e2db51181` | Name: `Labmentix Offer Letter.pdf` | Path: `uploads/file-1780779092473.pdf`
- ID: `6a250a23c0ed23809580d4ef` | Name: `temp_audit.pdf` | Path: `uploads/file-1780812323866.pdf`
- ID: `6a25159b92ef76afd0d3a39f` | Name: `temp_audit.pdf` | Path: `uploads/file-1780815258959.pdf`
- ID: `6a2516027da8521f233966c9` | Name: `temp_audit.pdf` | Path: `uploads/file-1780815362707.pdf`
- ID: `6a2516483854207a9c8d50ea` | Name: `temp_audit.pdf` | Path: `uploads/file-1780815432726.pdf`
- ID: `6a2517336cc4986ae92c9416` | Name: `temp_audit.pdf` | Path: `uploads/file-1780815667802.pdf`
- ID: `6a2517e0c125f79a65febe3b` | Name: `temp_audit.pdf` | Path: `uploads/file-1780815840396.pdf`
- ID: `6a2517f1c125f79a65febe5b` | Name: `temp_audit.pdf` | Path: `uploads/file-1780815857541.pdf`

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
