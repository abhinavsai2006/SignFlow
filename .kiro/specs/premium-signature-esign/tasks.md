# Implementation Plan: Premium Signature eSign

## Overview

Incremental implementation across four areas: metadata fix first (unblocks certificate display), then PDF embedding consolidation, then storage URL resolution, then UI redesign with new components, finishing with responsive toolbar and scale controls.

## Tasks

- [x] 1. Fix formattedFields metadata mapping in DocumentEditor.tsx
  - In `frontend/src/components/editor/DocumentEditor.tsx`, replace the `formattedFields` mapping to preserve all metadata fields from the API response: `signerName`, `ipAddress`, `userAgent`, `browser`, `device`, `operatingSystem`, `location`, `isp`, `certificateId`, `auditId`, `documentHash`, `tamperStatus`, `updatedAt`, `signatureScale`, `metadataScale`, `fontSize`, `showDate`, `showTime`, `hideSha256`, `hideCertId`, `hideReason`
  - Use explicit `SignatureField` return type on the map callback
  - _Requirements: 5.3_

  - [x] 1.1 Write property test for formattedFields metadata preservation
    - **Property 12: formattedFields preserves all metadata**
    - **Validates: Requirements 5.3**
    - Use `fast-check` with `arbitraryApiSignatureField()` generating random populated metadata
    - Assert each metadata key in the formatted output equals the source API value

- [x] 2. Remove duplicate embedSignaturesToPdf from signatureRoutes.js
  - In `backend/routes/signatureRoutes.js`, locate the inline `embedSignaturesToPdf` function (around line 184) and delete it entirely
  - Verify the finalize route already imports and calls `generateFinalizedPdf` from `pdfService.js` — no call-site changes needed
  - Confirm `pdfService.js` remains the sole implementation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.1 Write unit test: only one embedSignaturesToPdf implementation exists
    - Assert that `signatureRoutes.js` does not export or define `embedSignaturesToPdf`
    - Assert that `pdfService.js` exports `embedSignaturesToPdf`
    - _Requirements: 6.1_

  - [x] 2.2 Write property test for PDF embedding page count preservation
    - **Property 7: PDF embedding preserves page count**
    - **Validates: Requirements 6.6**
    - Use `fast-check` async property with `arbitraryPdfWithFields()` generating a minimal valid PDF and field array
    - Assert `pdfDoc.getPageCount()` before equals after calling `embedSignaturesToPdf`

  - [x] 2.3 Write property test for valid base64 image embedding
    - **Property 8: image embedding succeeds for valid base64 fields**
    - **Validates: Requirements 6.2, 6.3**
    - Use `fast-check` with `arbitraryPngField()` and `arbitraryJpegField()` generating fields with valid base64 image values
    - Assert `embedSignaturesToPdf` resolves without throwing for each

- [ ] 3. Add signed URL resolution to GET /api/docs and GET /api/docs/:id
  - In `backend/routes/documentRoutes.js`, import `getSignedUrl` and `isR2Active` from `r2Service.js`
  - After the `documents` query in `GET /api/docs`, use `Promise.allSettled` to resolve `originalFileUrl` and `finalizedFileUrl` for each document before the response
  - After the access check in `GET /api/docs/:id`, resolve both URL fields on `doc.toObject()` before `res.json()`
  - Log and fall back to the raw key on `getSignedUrl` failure so the list still renders
  - _Requirements: 7.1, 7.2, 7.4_

  - [ ] 3.1 Write property test for document list signed URL resolution
    - **Property 11: document list URLs are signed for R2-backed documents**
    - **Validates: Requirements 7.1, 7.2, 7.4**
    - Use `fast-check` with `arbitraryR2Document()` generating documents with raw R2 key `originalFileUrl`
    - Assert returned `originalFileUrl` matches `^https://` and contains a signature query parameter

- [~] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [~] 5. Create SigningModal component
  - Create `frontend/src/components/editor/SigningModal.tsx`
  - Implement props interface: `{ isOpen, field, onConfirm, onClose }`
  - Extract the draw/type/upload tab logic from `DocumentEditor.tsx` into this component
  - Apply canvas config: `minWidth: 1.5`, `maxWidth: 4.0`, `velocityFilterWeight: 0.6`, `backgroundColor: 'rgba(0,0,0,0)'`
  - Add baseline guide: horizontal dashed line at ~60% from canvas top
  - Add three ink color swatches: Black `#000000`, Dark Gray `#4A4A4A`, Blue `#0064E0` as 28px `rounded-full` buttons with 2px active ring
  - Implement 10-entry capped undo history using `drawingHistory` ref; push `canvas.toDataURL()` on stroke end, pop on undo
  - Validate on confirm: if `isEmpty()` is true, show inline error "Please draw your signature before applying." and block submission
  - Apply Meta design tokens: `rounded-2xl` modal card, `bg-[#f1f4f7]` canvas bg, `border border-[#ced0d4]` inputs, `text-[#0a1317]` primary text, `text-[#5d6c7b]` secondary text, `#0064E0` primary button, `rounded-full` all pill buttons, `text-[14px] font-bold tracking-[-0.14px]` button labels
  - Type mode: render live preview at min 36px in selected font, updating on each keystroke
  - Mobile: full-width canvas, min-height 160px on viewport < 768px; mode-switcher tabs wrap to single row
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [~] 5.1 Write property test for empty canvas blocking submission
    - **Property 1: empty canvas blocks submission**
    - **Validates: Requirements 1.4**
    - Use `fast-check` with `fc.constant(true)` for `isEmpty`, render `SigningModal` with mocked canvas
    - Assert no `api.put` called, modal remains open, error message present in DOM

  - [~] 5.2 Write property test for undo history bounded at 10
    - **Property 2: undo history is bounded**
    - **Validates: Requirements 1.5**
    - Use `fast-check` with `fc.integer({ min: 1, max: 50 })` for stroke count
    - Simulate pushing to history array with eviction logic and assert length never exceeds 10

  - [~] 5.3 Write unit tests for SigningModal
    - Type mode renders preview with correct font class for each font option
    - Upload tab accepts PNG and JPEG, rejects non-image MIME types
    - Empty type name prevents confirmation

- [~] 6. Create CertificatePanel component
  - Create `frontend/src/components/editor/CertificatePanel.tsx`
  - Implement props interface: `{ isOpen, field, sha256Checksum?, onClose }`
  - Render sections in order: green verification banner → dev warning (conditional) → Identity → Event → Device → Cryptographic → Compliance
  - Green banner: `bg-emerald-50 border-emerald-200`, CheckCircle icon, "SignFlow Verified Signature — cryptographically verified and legally binding under ESIGN & UETA regulations.", `data-testid="verified-banner"`
  - Dev warning: yellow `AlertTriangle` banner when `ipAddress` is `127.0.0.1`, `::1`, `::ffff:127.0.0.1`, or `'Local Development Environment'`, `data-testid="dev-warning"`; when dev warning shown, do NOT show green verified banner
  - Implement `formatTimestamp()` returning `DD MMM YYYY • HH:MM UTC` using UTC methods
  - SHA-256 fingerprint: `bg-slate-900 text-slate-200` monospace code block; hide section entirely if absent
  - Missing metadata fields: display `—` (em dash), never "Unavailable"
  - Compliance section: Trust Score, Document Integrity, Signature Integrity, Audit Trail, Tamper Detection — all "Verified" / "100%" when `status === 'Signed'`
  - Apply same Meta design tokens as SigningModal
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [~] 6.1 Write property test for certificate panel rendering all metadata
    - **Property 3: certificate panel renders all metadata fields**
    - **Validates: Requirements 2.1, 2.3**
    - Use `fast-check` with `arbitrarySignedField()` generating fields with all metadata populated
    - Assert DOM contains elements for each: signerName, email, ipAddress, location, browser, device, OS, certificateId, auditId, SHA-256

  - [~] 6.2 Write property test for timestamp formatting
    - **Property 4: timestamp formatting is correct for all dates**
    - **Validates: Requirements 2.4**
    - Use `fc.date()` and assert `formatTimestamp(date.toISOString())` matches `/^\d{2} [A-Z][a-z]{2} \d{4} • \d{2}:\d{2} UTC$/`

  - [~] 6.3 Write property test for local IP dev warning
    - **Property 5: local IP triggers dev warning**
    - **Validates: Requirements 2.7**
    - Use `fc.oneof` over the four local IP values, assert `[data-testid="dev-warning"]` present and `[data-testid="verified-banner"]` absent

  - [~] 6.4 Write unit tests for CertificatePanel
    - Specific example with all fields populated renders correct values
    - Example with all metadata null shows `—` placeholders, never "Unavailable"
    - Example without SHA-256 hides the fingerprint section entirely

- [~] 7. Wire SigningModal and CertificatePanel into DocumentEditor.tsx
  - In `DocumentEditor.tsx`, replace the inline signing overlay JSX with `<SigningModal>` and the inline certificate JSX with `<CertificatePanel>`
  - Pass `sha256Checksum` from `document.sha256Checksum` to `CertificatePanel`
  - Ensure `onConfirm` in `SigningModal` calls `confirmSigningValue` which already spreads `...response.data` into state
  - Remove any now-redundant local state and JSX that has moved into the new components
  - _Requirements: 1.1–1.8, 2.1–2.7, 5.3_

- [~] 8. Add separate Signature Scale and Signer Info Scale controls to DocumentEditor.tsx
  - In the field properties panel of `DocumentEditor.tsx`, add two independent controls for Signature and Initials field types:
    - "Signature Scale" range slider: `min=25`, `max=200`, `step=25`, bound to `field.signatureScale`
    - "Signer Info Scale" dropdown: options `Small`, `Medium`, `Large`, bound to `field.metadataScale`
  - On slider change, update `signatureScale` on the field in local state and call the field update API
  - On dropdown change, update `metadataScale` on the field in local state and call the field update API
  - Visual canvas preview should reflect `signatureScale` change immediately
  - _Requirements: 3.1, 3.2, 3.3_

  - [~] 8.1 Write property test for scale properties round-trip through state
    - **Property 6: scale properties round-trip through state**
    - **Validates: Requirements 3.2, 3.3**
    - Use `fc.oneof` over `[25,50,75,100,125,150,175,200]` for scale, `fc.oneof` over `['Small','Medium','Large']` for metaScale
    - Simulate `applyScaleUpdate(baseField, scale, metaScale)` and assert output fields match input values exactly

- [~] 9. Verify responsive toolbar wiring
  - Confirm mobile bottom toolbar Sign button calls `handleFinalizePDF` (same handler as desktop "Finalize & Sign")
  - Confirm mobile drawer close handler does not mutate signature state
  - Confirm single-finger drag on mobile canvas routes to scroll (`e.touches.length === 1` check before field placement)
  - Add the `touches.length` guard if missing
  - _Requirements: 4.3, 4.4, 4.5_

- [~] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Install `fast-check` before writing property tests: `npm install --save-dev fast-check`
- Property tests run a minimum of 100 iterations each
- Tag format for property tests: `// Feature: premium-signature-esign, Property N: <property text>`
- `pdfService.js` requires no logic changes — it is already correct; the fix is purely removing the duplicate in `signatureRoutes.js`
- `SignatureField` schema requires no migration — all fields already exist
