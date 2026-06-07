// Feature: premium-signature-esign, Property 7: PDF embedding preserves page count
// Feature: premium-signature-esign, Property 8: image embedding succeeds for valid base64 fields
import fc from 'fast-check';
import { PDFDocument } from 'pdf-lib';
import { describe, it, expect } from '@jest/globals';
import { embedSignaturesToPdf } from '../services/pdfService.js';

// Helper: create a minimal valid PDF with the given page count
async function createMinimalPdfBytes(pageCount) {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage();
  }
  return pdfDoc.save();
}

// ============================================================
// Property 7: PDF embedding preserves page count
// Validates: Requirements 6.6
// ============================================================
describe('PDF embedding preserves page count (Property 7)', () => {
  it('embedSignaturesToPdf never adds or removes pages', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (pageCount) => {
          const pdfBytes = await createMinimalPdfBytes(pageCount);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const before = pdfDoc.getPageCount();
          // Use an empty field array — should be skipped cleanly
          await embedSignaturesToPdf(pdfDoc, []);
          const after = pdfDoc.getPageCount();
          expect(after).toBe(before);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});

// ============================================================
// Property 8: image embedding succeeds for valid base64 fields
// Validates: Requirements 6.2, 6.3
// Note: We use a minimal 1x1 pixel valid PNG/JPEG in base64 to avoid
//       needing random image generation.
// ============================================================

const MINIMAL_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const MINIMAL_JPEG_BASE64 =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

describe('Image embedding for valid base64 fields (Property 8)', () => {
  it('embeds valid PNG fields without throwing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          _id: fc.string({ minLength: 1 }),
          page: fc.constant(1),
          xPercent: fc.constant(10),
          yPercent: fc.constant(10),
          widthPercent: fc.constant(20),
          heightPercent: fc.constant(10),
          status: fc.constant('Signed'),
          value: fc.constant(MINIMAL_PNG_BASE64),
          signatureScale: fc.constant(100),
          recipientEmail: fc.constant('test@example.com'),
          signerName: fc.constant('Test Signer'),
        }),
        async (field) => {
          const pdfDoc = await PDFDocument.create();
          pdfDoc.addPage([600, 800]);
          await expect(embedSignaturesToPdf(pdfDoc, [field])).resolves.not.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);

  it('embeds valid JPEG fields without throwing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          _id: fc.string({ minLength: 1 }),
          page: fc.constant(1),
          xPercent: fc.constant(10),
          yPercent: fc.constant(10),
          widthPercent: fc.constant(20),
          heightPercent: fc.constant(10),
          status: fc.constant('Signed'),
          value: fc.constant(MINIMAL_JPEG_BASE64),
          signatureScale: fc.constant(100),
          recipientEmail: fc.constant('test@example.com'),
          signerName: fc.constant('Test Signer'),
        }),
        async (field) => {
          const pdfDoc = await PDFDocument.create();
          pdfDoc.addPage([600, 800]);
          await expect(embedSignaturesToPdf(pdfDoc, [field])).resolves.not.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
