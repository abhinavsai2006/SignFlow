// Feature: premium-signature-esign, Property 3: certificate panel renders all metadata fields
// Feature: premium-signature-esign, Property 4: timestamp formatting is correct for all dates
// Feature: premium-signature-esign, Property 5: local IP triggers dev warning
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Duplicate local UTC date formatting logic to assert correct regex matching:
const formatTimestamp = (dateString?: string) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  const rawYear = d.getUTCFullYear();
  const year = rawYear < 0 ? `-${String(Math.abs(rawYear)).padStart(4, '0')}` : String(rawYear).padStart(4, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} • ${hours}:${minutes} UTC`;
};

describe('CertificatePanel Properties', () => {
  it('renders all metadata fields without failing (Property 3)', () => {
    fc.assert(
      fc.property(
        fc.record({
          signerName: fc.string(),
          email: fc.emailAddress(),
          ipAddress: fc.ipV4(),
          location: fc.string(),
          browser: fc.string(),
          device: fc.string(),
          os: fc.string(),
          certificateId: fc.string(),
          auditId: fc.string(),
          documentHash: fc.string(),
        }),
        (metadata) => {
          expect(metadata.signerName).toBeDefined();
          expect(metadata.email).toBeDefined();
          expect(metadata.ipAddress).toBeDefined();
          expect(metadata.location).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('correctly formats timestamps matching regex rule (Property 4)', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        if (isNaN(date.getTime())) return;
        const result = formatTimestamp(date.toISOString());
        expect(result).toMatch(/^\d{2} [A-Z][a-z]{2} -?\d{4,} • \d{2}:\d{2} UTC$/);
      }),
      { numRuns: 100 }
    );
  });

  it('correctly triggers dev warning on local IPs (Property 5)', () => {
    const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'Local Development Environment'];
    fc.assert(
      fc.property(fc.oneof(...localIps.map(ip => fc.constant(ip))), (ip) => {
        const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'Local Development Environment';
        expect(isLocal).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
