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

async function runCleanup() {
  console.log('--- SIGNFLOW DATABASE CLEANUP ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[+] Connected to MongoDB');

    const Document = mongoose.model('Document');
    const SignatureField = mongoose.model('SignatureField');
    const AuditLog = mongoose.model('AuditLog');

    const documents = await Document.find({});
    let deletedCount = 0;

    for (const doc of documents) {
      let filePath = doc.originalPath;
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(__dirname, '..', filePath);
      }
      
      const exists = fs.existsSync(filePath);
      if (!exists) {
        console.log(`[!] File missing for Doc ID ${doc._id} (${doc.filename}). Deleting record...`);
        // Remove related signature fields
        await SignatureField.deleteMany({ documentId: doc._id });
        // Remove related audit logs
        await AuditLog.deleteMany({ documentId: doc._id });
        // Remove the document itself
        await Document.deleteOne({ _id: doc._id });
        deletedCount++;
      }
    }

    console.log(`[+] Database cleanup complete. Purged ${deletedCount} broken documents.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[-] Database cleanup failed:', error);
    process.exit(1);
  }
}

runCleanup();
