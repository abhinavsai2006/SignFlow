import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Document from '../models/Document.js';
import DocumentRecipient from '../models/DocumentRecipient.js';
import SignatureField from '../models/SignatureField.js';
import AuditLog from '../models/AuditLog.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveStoragePath } from '../utils/storagePath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const brainDir = 'C:/Users/mndab/.gemini/antigravity/brain/1a8da5a6-8fc5-45c9-850e-81bcb67a3e5a';

async function runOrphanCleanup() {
  try {
    console.log('[Orphan Cleanup] Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('[Orphan Cleanup] Connected.');

    const report = [];
    report.push('# Orphan Cleanup & Garbage Collection Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    // Load active documents reference
    const documents = await Document.find({}, { _id: 1, originalPath: 1, finalizedPath: 1 });
    const docIds = new Set(documents.map(d => d._id.toString()));

    // Keep track of referenced files on disk
    const referencedFiles = new Set();
    documents.forEach(d => {
      if (d.originalPath) referencedFiles.add(path.basename(d.originalPath));
      if (d.finalizedPath) referencedFiles.add(path.basename(d.finalizedPath));
    });

    console.log(`[Orphan Cleanup] Active documents: ${docIds.size}, Referenced files: ${referencedFiles.size}`);

    // 1. Orphan recipients
    const recipients = await DocumentRecipient.find({});
    let deletedRecipientsCount = 0;
    for (const rec of recipients) {
      if (!docIds.has(rec.documentId?.toString())) {
        await DocumentRecipient.deleteOne({ _id: rec._id });
        deletedRecipientsCount++;
      }
    }
    report.push(`- **Orphan Recipients**: Checked ${recipients.length} records. Deleted ${deletedRecipientsCount} orphaned recipient records.`);

    // 2. Orphan signature fields
    const fields = await SignatureField.find({});
    let deletedFieldsCount = 0;
    for (const field of fields) {
      if (!docIds.has(field.documentId?.toString())) {
        await SignatureField.deleteOne({ _id: field._id });
        deletedFieldsCount++;
      }
    }
    report.push(`- **Orphan Signature Fields**: Checked ${fields.length} placeholders. Deleted ${deletedFieldsCount} orphaned field records.`);

    // 3. Orphan audit logs
    const logs = await AuditLog.find({});
    let deletedLogsCount = 0;
    for (const log of logs) {
      if (log.documentId && !docIds.has(log.documentId.toString())) {
        await AuditLog.deleteOne({ _id: log._id });
        deletedLogsCount++;
      }
    }
    report.push(`- **Orphan Audit Logs**: Checked ${logs.length} events. Deleted ${deletedLogsCount} orphaned audit logs.`);

    // 4. Orphan storage files (garbage collection preview/clean)
    const uploadsDir = resolveStoragePath();
    let orphanedFilesDetected = 0;
    let orphanedFilesCleaned = 0;

    if (fs.existsSync(uploadsDir)) {
      const filesOnDisk = fs.readdirSync(uploadsDir);
      for (const file of filesOnDisk) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile() && !referencedFiles.has(file) && !file.startsWith('.')) {
          orphanedFilesDetected++;
          // For safety, log them in report. Clean up after validation pass.
          // fs.unlinkSync(filePath);
          // orphanedFilesCleaned++;
        }
      }
    }
    report.push(`- **Orphan Storage Assets**: Audited local storage directory. Detected ${orphanedFilesDetected} unreferenced local files (staged for garbage collection).`);

    report.push('');
    report.push('### Summary');
    report.push('Garbage collection run completed. Orphaned database mappings have been safely deleted. Staged local assets are preserved pending staging testing.');

    const reportPath = path.join(brainDir, 'ORPHAN_CLEANUP_REPORT.md');
    fs.writeFileSync(reportPath, report.join('\n'));
    console.log('[Orphan Cleanup] Report written to:', reportPath);

  } catch (err) {
    console.error('[Orphan Cleanup] Audit failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Orphan Cleanup] Connection closed.');
    process.exit(0);
  }
}

runOrphanCleanup();
