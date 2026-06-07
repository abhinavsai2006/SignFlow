import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Document from '../models/Document.js';
import { isR2Active, downloadFile } from '../services/r2Service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveStoragePath } from '../utils/storagePath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const brainDir = 'C:/Users/mndab/.gemini/antigravity/brain/1a8da5a6-8fc5-45c9-850e-81bcb67a3e5a';

async function runStorageValidation() {
  try {
    console.log('[Storage Validation] Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('[Storage Validation] Connected.');

    const documents = await Document.find({});
    console.log(`[Storage Validation] Found ${documents.length} documents to audit.`);

    const report = [];
    report.push('# Storage Validation Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');
    report.push(`Active Storage Mode: **${isR2Active() ? 'S3-Compatible Bucket (Railway)' : 'Local Filesystem Fallback'}**`);
    report.push('');
    report.push('| Document ID | Filename | Original File | Finalized File | Audit File |');
    report.push('| --- | --- | --- | --- | --- |');

    let verifiedCount = 0;
    let missingCount = 0;

    for (const doc of documents) {
      let origStatus = '❌ Missing';
      let finalStatus = 'N/A';
      let auditStatus = 'N/A';

      // 1. Audit original file
      if (doc.originalPath) {
        const fileExists = await checkFileExists(doc.originalFileKey || doc.originalPath);
        origStatus = fileExists ? '✅ Verified' : '❌ Missing';
        if (fileExists) verifiedCount++; else missingCount++;
      }

      // 2. Audit finalized file
      if (doc.finalizedPath || doc.finalizedFileUrl) {
        const fileExists = await checkFileExists(doc.finalizedFileKey || doc.finalizedFileUrl || doc.finalizedPath);
        finalStatus = fileExists ? '✅ Verified' : '❌ Missing';
        if (fileExists) verifiedCount++; else missingCount++;
      } else if (doc.status === 'Signed') {
        finalStatus = '⚠️ Path Not Set';
        missingCount++;
      }

      // 3. Audit audit report file
      if (doc.auditFileKey || doc.auditFileUrl) {
        const fileExists = await checkFileExists(doc.auditFileKey || doc.auditFileUrl);
        auditStatus = fileExists ? '✅ Verified' : '❌ Missing';
        if (fileExists) verifiedCount++; else missingCount++;
      } else if (doc.status === 'Signed') {
        auditStatus = '⚠️ Path Not Set';
        missingCount++;
      }

      report.push(`| \`${doc._id}\` | \`${doc.filename}\` | ${origStatus} | ${finalStatus} | ${auditStatus} |`);
    }

    report.push('');
    report.push('### Summary');
    report.push(`- **Verified Storage References**: ${verifiedCount}`);
    report.push(`- **Missing/Warning Storage References**: ${missingCount}`);
    report.push('');
    report.push('Verification scan complete. Note: Local filesystem paths are verified when S3 client credentials are not active.');

    const reportPath = path.join(brainDir, 'STORAGE_VALIDATION_REPORT.md');
    fs.writeFileSync(reportPath, report.join('\n'));
    console.log('[Storage Validation] Report written to:', reportPath);

  } catch (err) {
    console.error('[Storage Validation] Audit failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Storage Validation] Connection closed.');
    process.exit(0);
  }
}

async function checkFileExists(pathOrKey) {
  if (isR2Active()) {
    try {
      // If R2 is active, try to fetch key metadata (or mock download check)
      await downloadFile(pathOrKey);
      return true;
    } catch {
      return false;
    }
  } else {
    // Local check
    try {
      const resolved = resolveStoragePath(pathOrKey);
      return fs.existsSync(resolved);
    } catch {
      return false;
    }
  }
}

runStorageValidation();
