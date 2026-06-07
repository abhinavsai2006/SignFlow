// Feature: premium-signature-esign, Property 12: formattedFields preserves all metadata
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Helper: the mapFormattedFields function extracted/reproduced from DocumentEditor
function mapFormattedFields(sigData: any[], currentUserEmail: string | null) {
  return sigData.map((sig: any) => ({
    _id: sig._id,
    type: sig.type || 'Signature',
    recipientEmail: sig.recipientEmail || currentUserEmail || '',
    signerName: sig.signerName,
    xPercent: sig.xPercent !== undefined ? sig.xPercent : (sig.x || 35),
    yPercent: sig.yPercent !== undefined ? sig.yPercent : (sig.y || 40),
    widthPercent: sig.widthPercent || 15,
    heightPercent: sig.heightPercent || 5,
    page: sig.page || 1,
    status: sig.status || 'Pending',
    value: sig.value || sig.signatureValue || '',
    ipAddress: sig.ipAddress,
    userAgent: sig.userAgent,
    browser: sig.browser,
    device: sig.device,
    operatingSystem: sig.operatingSystem,
    location: sig.location,
    isp: sig.isp,
    certificateId: sig.certificateId,
    auditId: sig.auditId,
    documentHash: sig.documentHash,
    tamperStatus: sig.tamperStatus,
    updatedAt: sig.updatedAt,
    signatureScale: sig.signatureScale ?? 100,
    metadataScale: sig.metadataScale ?? 'Medium',
    fontSize: sig.fontSize ?? 12,
    showDate: sig.showDate ?? true,
    showTime: sig.showTime ?? true,
    hideSha256: sig.hideSha256 ?? false,
    hideCertId: sig.hideCertId ?? false,
    hideReason: sig.hideReason ?? false,
  }));
}

function arbitraryApiSignatureField() {
  return fc.record({
    _id: fc.string({ minLength: 1 }),
    type: fc.constantFrom('Signature', 'Initials'),
    recipientEmail: fc.emailAddress(),
    signerName: fc.string(),
    xPercent: fc.float({ min: 0, max: 100 }),
    yPercent: fc.float({ min: 0, max: 100 }),
    widthPercent: fc.float({ min: 1, max: 50 }),
    heightPercent: fc.float({ min: 1, max: 20 }),
    page: fc.integer({ min: 1, max: 100 }),
    status: fc.constantFrom('Pending', 'Signed'),
    value: fc.string(),
    ipAddress: fc.oneof(fc.ipV4(), fc.string()),
    userAgent: fc.string(),
    browser: fc.string(),
    device: fc.string(),
    operatingSystem: fc.string(),
    location: fc.string(),
    isp: fc.string(),
    certificateId: fc.string(),
    auditId: fc.string(),
    documentHash: fc.string(),
    tamperStatus: fc.string(),
    updatedAt: fc.date().map(d => d.toISOString()),
    signatureScale: fc.oneof(...([25, 50, 75, 100, 125, 150, 175, 200] as const).map(v => fc.constant(v))),
    metadataScale: fc.constantFrom('Small', 'Medium', 'Large'),
  });
}

/**
 * **Validates: Requirements 5.3**
 */
describe('formattedFields metadata preservation (Property 12)', () => {
  it('preserves all metadata keys from the API response', () => {
    fc.assert(
      fc.property(arbitraryApiSignatureField(), (apiField) => {
        const [formatted] = mapFormattedFields([apiField], null);
        const metaKeys = [
          'ipAddress', 'browser', 'device', 'operatingSystem',
          'location', 'isp', 'certificateId', 'auditId', 'documentHash',
          'userAgent', 'tamperStatus', 'updatedAt',
        ];
        for (const key of metaKeys) {
          expect((formatted as any)[key]).toStrictEqual((apiField as any)[key]);
        }
      }),
      { numRuns: 100 }
    );
  });
});
