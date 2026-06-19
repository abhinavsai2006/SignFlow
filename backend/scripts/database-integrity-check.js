import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Document from '../models/Document.js';
import DocumentRecipient from '../models/DocumentRecipient.js';
import SignatureField from '../models/SignatureField.js';
import AuditLog from '../models/AuditLog.js';
import Workspace from '../models/Workspace.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('[Integrity] MONGODB_URI not set in .env');
  process.exit(1);
}

async function runAudit() {
  try {
    console.log('[Integrity] Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('[Integrity] Connected successfully.');

    const report = [];
    report.push('# Database Integrity Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    // Load active entity ID sets
    const users = await User.find({}, { _id: 1 });
    const userIds = new Set(users.map(u => u._id.toString()));

    const documents = await Document.find({});
    const docIds = new Set(documents.map(d => d._id.toString()));

    console.log(`[Integrity] Loaded ${userIds.size} users and ${docIds.size} documents for validation reference.`);

    // 1. User -> Documents
    let orphanedDocsCount = 0;
    for (const doc of documents) {
      if (!userIds.has(doc.ownerId?.toString())) {
        orphanedDocsCount++;
        doc.isDeleted = true;
        await doc.save();
      }
    }
    report.push(`- **User → Documents**: Checked ${documents.length} documents. Found and flagged ${orphanedDocsCount} orphaned documents.`);

    // 2. Document -> Recipients
    const recipients = await DocumentRecipient.find({}, { _id: 1, documentId: 1 });
    const recipientIdsToDelete = [];
    for (const rec of recipients) {
      if (!docIds.has(rec.documentId?.toString())) {
        recipientIdsToDelete.push(rec._id);
      }
    }
    if (recipientIdsToDelete.length > 0) {
      await DocumentRecipient.deleteMany({ _id: { $in: recipientIdsToDelete } });
    }
    report.push(`- **Document → Recipients**: Checked ${recipients.length} recipients. Deleted ${recipientIdsToDelete.length} orphaned recipient records.`);

    // 3. Document -> Signature Fields
    const fields = await SignatureField.find({}, { _id: 1, documentId: 1 });
    const fieldIdsToDelete = [];
    for (const field of fields) {
      if (!docIds.has(field.documentId?.toString())) {
        fieldIdsToDelete.push(field._id);
      }
    }
    if (fieldIdsToDelete.length > 0) {
      await SignatureField.deleteMany({ _id: { $in: fieldIdsToDelete } });
    }
    report.push(`- **Document → Signature Fields**: Checked ${fields.length} signature fields. Deleted ${fieldIdsToDelete.length} orphaned field records.`);

    // 4. Document -> Audit Logs
    const logs = await AuditLog.find({}, { _id: 1, documentId: 1 });
    const logIdsToDelete = [];
    for (const log of logs) {
      if (log.documentId && !docIds.has(log.documentId.toString())) {
        logIdsToDelete.push(log._id);
      }
    }
    if (logIdsToDelete.length > 0) {
      await AuditLog.deleteMany({ _id: { $in: logIdsToDelete } });
    }
    report.push(`- **Document → Audit Logs**: Checked ${logs.length} audit logs. Deleted ${logIdsToDelete.length} orphaned audit log records.`);

    // 5. Workspace -> Members
    const workspaces = await Workspace.find({});
    let removedMembersCount = 0;
    for (const ws of workspaces) {
      const originalLength = ws.members.length;
      const validMembers = ws.members.filter(m => userIds.has(m.userId?.toString()));
      removedMembersCount += (originalLength - validMembers.length);
      if (validMembers.length !== originalLength) {
        ws.members = validMembers;
        await ws.save();
      }
    }
    report.push(`- **Workspace → Members**: Checked ${workspaces.length} workspaces. Removed ${removedMembersCount} orphaned member records.`);

    report.push('');
    report.push('### Summary');
    report.push('Database integrity scan complete. All orphaned records have been purged.');

    // Save report to markdown artifact file
    const reportPath = path.resolve('C:/Users/mndab/.gemini/antigravity/brain/1a8da5a6-8fc5-45c9-850e-81bcb67a3e5a/DATABASE_INTEGRITY_REPORT.md');
    fs.writeFileSync(reportPath, report.join('\n'));
    console.log(`[Integrity] Report successfully generated at: ${reportPath}`);

  } catch (err) {
    console.error('[Integrity] Audit failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[Integrity] Connection closed.');
    process.exit(0);
  }
}

runAudit();
