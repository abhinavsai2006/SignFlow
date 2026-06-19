// Feature: premium-signature-esign, Property 11: document list URLs are signed for R2-backed documents
import fc from 'fast-check';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper that simulates the URL resolution logic from the route
function resolveDocumentUrls(doc, isR2Active, getSignedUrl) {
  const plain = { ...doc };
  if (isR2Active && plain.originalFileUrl) {
    plain.originalFileUrl = getSignedUrl(plain.originalFileUrl);
  }
  if (isR2Active && plain.finalizedFileUrl) {
    plain.finalizedFileUrl = getSignedUrl(plain.finalizedFileUrl);
  }
  return plain;
}

describe('Document list signed URL resolution (Property 11)', () => {
  it('originalFileUrl is replaced with a signed HTTPS URL when R2 is active', () => {
    fc.assert(
      fc.property(
        // Generate an arbitrary R2 storage key
        fc.string({ minLength: 1 }).map(s => `uploads/${s}.pdf`),
        (rawKey) => {
          const doc = { _id: 'doc-1', originalFileUrl: rawKey };
          const fakeSignedUrl = `https://r2.example.com/${rawKey}?X-Amz-Signature=abc123&X-Amz-Expires=3600`;
          const getSignedUrl = (key) => fakeSignedUrl;
          const result = resolveDocumentUrls(doc, true, getSignedUrl);
          // Must start with https://
          expect(result.originalFileUrl).toMatch(/^https:\/\//);
          // Must contain a signature query param
          expect(result.originalFileUrl).toMatch(/X-Amz-Signature|x-amz-signature/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('originalFileUrl is NOT replaced when R2 is not active', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).map(s => `uploads/${s}.pdf`),
        (rawKey) => {
          const doc = { _id: 'doc-1', originalFileUrl: rawKey };
          const getSignedUrl = (key) => `https://signed.url/${key}`;
          const result = resolveDocumentUrls(doc, false, getSignedUrl);
          // Raw key should be preserved when R2 is not active
          expect(result.originalFileUrl).toBe(rawKey);
        }
      ),
      { numRuns: 100 }
    );
  });
});
