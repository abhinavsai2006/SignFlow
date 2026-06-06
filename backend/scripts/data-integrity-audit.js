import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import '../models/User.js';
import '../models/Document.js';
import '../models/SignatureField.js';
import '../models/AuditLog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAudit() {
  console.log('--- SIGNFLOW AI DATA INTEGRITY AUDIT ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[+] Connected to MongoDB');

    const User = mongoose.model('User');
    const Document = mongoose.model('Document');
    const SignatureField = mongoose.model('SignatureField');
    const AuditLog = mongoose.model('AuditLog');

    let report = `# SignFlow AI — Data Integrity Report\n\n`;
    report += `Date: ${new Date().toISOString()}\n\n`;
    
    // 1. Duplicate Users
    const duplicates = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    report += `## 1. Duplicate Users Check\n`;
    if (duplicates.length === 0) {
      report += `✅ No duplicate email addresses found in Users collection.\n\n`;
    } else {
      report += `❌ Found duplicate user emails:\n`;
      duplicates.forEach(d => {
        report += `- **Email:** \`${d._id}\` (Occurrences: ${d.count}, IDs: ${d.ids.join(', ')})\n`;
      });
      report += `\n`;
    }

    // 2. Orphaned Documents (Owner no longer exists)
    const documents = await Document.find({});
    let orphanedDocsCount = 0;
    const brokenDocOwners = [];
    
    for (const doc of documents) {
      const ownerExists = await User.exists({ _id: doc.ownerId });
      if (!ownerExists) {
        orphanedDocsCount++;
        brokenDocOwners.push(doc._id);
      }
    }
    
    report += `## 2. Orphaned Documents Check\n`;
    if (orphanedDocsCount === 0) {
      report += `✅ No orphaned documents found (All documents have valid owners).\n\n`;
    } else {
      report += `❌ Found **${orphanedDocsCount}** orphaned documents with missing owners:\n`;
      report += `- Document IDs: ${brokenDocOwners.join(', ')}\n\n`;
    }

    // 3. Missing File Paths
    let missingPathsCount = 0;
    const brokenPaths = [];
    for (const doc of documents) {
      let filePath = doc.originalPath;
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(__dirname, '..', filePath);
      }
      if (!fs.existsSync(filePath)) {
        missingPathsCount++;
        brokenPaths.push({ id: doc._id, filename: doc.filename, path: doc.originalPath });
      }
    }

    report += `## 3. Missing File Paths Check\n`;
    if (missingPathsCount === 0) {
      report += `✅ All document records point to valid files on disk.\n\n`;
    } else {
      report += `❌ Found **${missingPathsCount}** document records pointing to non-existent files:\n`;
      brokenPaths.forEach(bp => {
        report += `- ID: \`${bp.id}\` | Name: \`${bp.filename}\` | Path: \`${bp.path}\`\n`;
      });
      report += `\n`;
    }

    // 4. Invalid Signature Field References
    const signatures = await SignatureField.find({});
    let invalidSigsCount = 0;
    const brokenSigs = [];
    
    for (const sig of signatures) {
      const docExists = await Document.exists({ _id: sig.documentId });
      if (!docExists) {
        invalidSigsCount++;
        brokenSigs.push(sig._id);
      }
    }

    report += `## 4. Invalid Signature Field References\n`;
    if (invalidSigsCount === 0) {
      report += `✅ No orphaned signature fields found.\n\n`;
    } else {
      report += `❌ Found **${invalidSigsCount}** signature fields pointing to missing documents:\n`;
      report += `- Field IDs: ${brokenSigs.join(', ')}\n\n`;
    }

    // 5. Missing Audit Logs
    let missingLogsCount = 0;
    const brokenDocsLogs = [];
    for (const doc of documents) {
      const logsCount = await AuditLog.countDocuments({ documentId: doc._id });
      if (logsCount === 0) {
        missingLogsCount++;
        brokenDocsLogs.push(doc._id);
      }
    }

    report += `## 5. Audit Log Coverage Check\n`;
    if (missingLogsCount === 0) {
      report += `✅ All documents have associated audit trail entries.\n\n`;
    } else {
      report += `❌ Found **${missingLogsCount}** documents with zero audit logs:\n`;
      report += `- Document IDs: ${brokenDocsLogs.join(', ')}\n\n`;
    }

    // 6. Summary of Sessions and OTP Records
    report += `## 6. Sessions & Verification Records Overview\n`;
    const usersWithOtp = await User.countDocuments({ verificationOtp: { $ne: null } });
    const usersWithLoginOtp = await User.countDocuments({ loginOtp: { $ne: null } });
    report += `- Users with pending email verification OTPs: **${usersWithOtp}**\n`;
    report += `- Users with pending login OTPs: **${usersWithLoginOtp}**\n\n`;

    report += `## 7. Action Plan & Integrity Status\n`;
    if (duplicates.length === 0 && orphanedDocsCount === 0 && invalidSigsCount === 0) {
      report += `✅ **INTEGRITY PASS:** No critical relational database errors detected.\n`;
    } else {
      report += `⚠️ **INTEGRITY WARNING:** Relational database violations were detected. Cleanup script recommended to purge orphaned signatures and empty docs.\n`;
    }

    const reportPath = path.join(__dirname, '..', '..', 'DATA_INTEGRITY_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log('[+] DATA_INTEGRITY_REPORT.md generated.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[-] Data Integrity Audit failed:', error);
    process.exit(1);
  }
}

runAudit();
