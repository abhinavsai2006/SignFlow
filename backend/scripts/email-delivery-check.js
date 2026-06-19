import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DocumentRecipient from '../models/DocumentRecipient.js';
import EmailLog from '../models/EmailLog.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const brainDir = 'C:/Users/mndab/.gemini/antigravity/brain/1a8da5a6-8fc5-45c9-850e-81bcb67a3e5a';

async function runEmailAudit() {
  try {
    console.log('[Email Audit] Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('[Email Audit] Connected.');

    const recipients = await DocumentRecipient.find({});
    const emailLogs = await EmailLog.find({});

    console.log(`[Email Audit] Auditing ${recipients.length} recipients and ${emailLogs.length} email logs.`);

    const report = [];
    report.push('# Email Delivery Forensics Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');
    report.push('This report details invitation email statuses, tracking successful dispatches, failures, and delivery metrics.');
    report.push('');
    report.push('| Recipient Email | Recipient Name | inviteEmailSent | Status | inviteEmailSentAt |');
    report.push('| --- | --- | --- | --- | --- |');

    let totalInvites = 0;
    let sentCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    for (const rec of recipients) {
      if (rec.role === 'Signer') {
        totalInvites++;
        const sent = rec.inviteEmailSent || false;
        const status = rec.inviteEmailStatus || 'Pending';
        const sentAt = rec.inviteEmailSentAt ? new Date(rec.inviteEmailSentAt).toISOString() : 'N/A';

        if (sent && status === 'Delivered') {
          sentCount++;
        } else if (status === 'Failed') {
          failedCount++;
        } else {
          pendingCount++;
        }

        report.push(`| \`${rec.email}\` | \`${rec.name}\` | ${sent ? '✅ Yes' : '❌ No'} | \`${status}\` | ${sentAt} |`);
      }
    }

    report.push('');
    report.push('## Delivery Metrics Summary');
    report.push(`- **Total Signer Invitations Checked**: ${totalInvites}`);
    report.push(`- **Delivered Invitations (Success)**: ${sentCount}`);
    report.push(`- **Pending Delivery (In-Transit)**: ${pendingCount}`);
    report.push(`- **Failed Email Invitations**: ${failedCount}`);
    
    const successRate = totalInvites > 0 ? ((sentCount / totalInvites) * 100).toFixed(1) : '100.0';
    report.push(`- **Overall Resend Delivery Success Rate**: ${successRate}%`);
    report.push('');
    report.push('### Email Log Database Entries (Last 15 logs)');
    report.push('');
    report.push('| Log ID | Recipient | Subject | Status | Created At |');
    report.push('| --- | --- | --- | --- | --- |');

    const recentLogs = emailLogs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    for (const log of recentLogs) {
      report.push(`| \`${log._id}\` | \`${log.to}\` | \`${log.subject}\` | \`${log.status || 'Sent'}\` | ${new Date(log.createdAt).toLocaleString()} |`);
    }

    const reportPath = path.join(brainDir, 'EMAIL_DELIVERY_REPORT.md');
    fs.writeFileSync(reportPath, report.join('\n'));
    console.log('[Email Audit] Report written to:', reportPath);

  } catch (err) {
    console.error('[Email Audit] Audit failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Email Audit] Connection closed.');
    process.exit(0);
  }
}

runEmailAudit();
