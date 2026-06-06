import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import '../models/User.js';
import '../models/Document.js';
import '../models/SignatureField.js';
import '../models/EmailLog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAudit() {
  console.log('--- SIGNFLOW AI DATABASE AUDIT ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.model('User');
    const Document = mongoose.model('Document');
    const SignatureField = mongoose.model('SignatureField');
    
    let report = `# SignFlow AI Database Audit Report\n\n`;
    report += `Date: ${new Date().toISOString()}\n\n`;
    
    // 1. Orphaned Signature Fields
    const allSignatures = await SignatureField.find({});
    let orphanedCount = 0;
    for (const sig of allSignatures) {
      if (sig.documentId) {
        const doc = await Document.findById(sig.documentId);
        if (!doc) orphanedCount++;
      }
    }
    
    report += `## Orphaned Records\n`;
    report += `- **Orphaned Signature Fields:** ${orphanedCount}\n`;
    if (orphanedCount === 0) report += `✅ No orphaned signatures detected.\n\n`;
    else report += `❌ Found orphaned signatures (Missing parent document).\n\n`;

    // 2. Indexes
    const userIndexes = await User.collection.indexes();
    const docIndexes = await Document.collection.indexes();
    const sigIndexes = await SignatureField.collection.indexes();

    report += `## Indexing Strategy\n`;
    report += `- **Users:** ${userIndexes.length} indexes\n`;
    report += `- **Documents:** ${docIndexes.length} indexes\n`;
    report += `- **Signatures:** ${sigIndexes.length} indexes\n\n`;
    
    let needsSigIndex = !sigIndexes.some(i => i.name.includes('documentId'));
    if (needsSigIndex) {
      await SignatureField.collection.createIndex({ documentId: 1 });
      report += `✅ Created missing index on SignatureField(documentId)\n\n`;
    } else {
      report += `✅ SignatureField(documentId) index already exists.\n\n`;
    }

    fs.writeFileSync(path.join(__dirname, '..', '..', 'DATABASE_REPORT.md'), report);
    console.log('[+] DATABASE_REPORT.md generated.');

    process.exit(0);
  } catch (error) {
    console.error('[-] DB Audit failed:', error);
    process.exit(1);
  }
}

runAudit();
