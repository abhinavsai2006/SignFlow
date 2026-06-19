// Feature: premium-signature-esign
// Validates: Requirements 6.1
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { describe, it, expect } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('embedSignaturesToPdf deduplication', () => {
  it('signatureRoutes.js does not define embedSignaturesToPdf', () => {
    const routesSource = readFileSync(
      path.join(__dirname, '../routes/signatureRoutes.js'),
      'utf-8'
    );
    // Should not contain a function definition for embedSignaturesToPdf
    const hasDuplicate =
      /function\s+embedSignaturesToPdf/.test(routesSource) ||
      /const\s+embedSignaturesToPdf\s*=/.test(routesSource);
    expect(hasDuplicate).toBe(false);
  });

  it('pdfService.js exports embedSignaturesToPdf', async () => {
    const { embedSignaturesToPdf } = await import('../services/pdfService.js');
    expect(typeof embedSignaturesToPdf).toBe('function');
  });
});
