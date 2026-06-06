import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import '../models/User.js';
import '../models/Document.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAudit() {
  console.log('--- SIGNFLOW AI STORAGE AUDIT ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[+] Connected to MongoDB');

    const Document = mongoose.model('Document');
    const documents = await Document.find({});
    
    let report = `# SignFlow AI Storage & Path Audit Report\n\n`;
    report += `Date: ${new Date().toISOString()}\n\n`;

    report += `## Document Uploads Validation\n\n`;
    report += `| Filename | MongoDB originalPath | File Exists on Disk? | Public URL | Status |\n`;
    report += `|---|---|---|---|---|\n`;

    let total = 0;
    let missing = 0;
    let present = 0;

    for (const doc of documents) {
      total++;
      // Resolve path
      let filePath = doc.originalPath;
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(__dirname, '..', filePath);
      }
      
      const exists = fs.existsSync(filePath);
      const publicUrl = `/uploads/${path.basename(doc.originalPath)}`;
      
      if (exists) {
        present++;
      } else {
        missing++;
      }

      report += `| ${doc.filename} | \`${doc.originalPath}\` | ${exists ? '✅ YES' : '❌ NO'} | [Link](${publicUrl}) | ${exists ? 'Active' : 'Broken (404)'} |\n`;
    }

    report += `\n### Statistics\n`;
    report += `- **Total documents in DB:** ${total}\n`;
    report += `- **Files present on disk:** ${present}\n`;
    report += `- **Files missing (404/Ephemeral loss):** ${missing}\n\n`;

    report += `## Root Cause & Recommendations\n\n`;
    report += `### 1. Ephemeral Filesystem\n`;
    report += `Railway uses an ephemeral filesystem by default. When the server redeploys or restarts, any files uploaded via Multer to the local \`uploads/\` folder are wiped out. MongoDB still retains the records, leading to 404 errors when accessing URLs.\n\n`;
    
    report += `### 2. Path Mapping Mismatch\n`;
    report += `Multer saves to relative paths (e.g. \`uploads/file-xyz.pdf\`) based on the execution directory. If started from the workspace root instead of the backend folder, files could end up in \`./uploads/\` instead of \`./backend/uploads/\`, leading to static serving failures.\n\n`;
    
    report += `### 3. Resolution Recommendations\n`;
    report += `- **Option A:** Mount a persistent volume on Railway to map the \`/app/backend/uploads\` folder.\n`;
    report += `- **Option B (SaaS Best Practice):** Integrate AWS S3 or Cloudflare R2 for storing and serving documents.\n`;

    const reportPath = path.join(__dirname, '..', '..', 'STORAGE_AUDIT_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log('[+] STORAGE_AUDIT_REPORT.md generated.');

    // Save a copy under PDF_STORAGE_REPORT.md as requested
    const pdfReportPath = path.join(__dirname, '..', '..', 'PDF_STORAGE_REPORT.md');
    fs.writeFileSync(pdfReportPath, report);
    console.log('[+] PDF_STORAGE_REPORT.md generated.');

    process.exit(0);
  } catch (error) {
    console.error('[-] Storage Audit failed:', error);
    process.exit(1);
  }
}

runAudit();
