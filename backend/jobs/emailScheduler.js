import cron from 'node-cron';
import Document from '../models/Document.js';
import User from '../models/User.js';
import {
  sendReminderEmail,
  sendDocumentExpiredEmail,
  sendTrialEndingEmail
} from '../middleware/emailService.js';
import DocumentRecipient from '../models/DocumentRecipient.js';

// ============================================================================
// EMAIL SCHEDULER — Hourly cron job for time-sensitive email events
// Runs every hour: 0 * * * *
// Checks expiresAt - now <= 24h for reminders
// Uses DB flags to prevent duplicate sends
// ============================================================================

export function startEmailScheduler() {
  console.log('[Scheduler] Email scheduler initialized — running every hour.');

  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    console.log(`[Scheduler] Hourly check running at ${now.toISOString()}`);

    await checkDocumentReminders(now);
    await checkDocumentExpiration(now);
    await checkTrialEnding(now);
  });
}

// ─── 1. Reminder Emails ─────────────────────────────────────────────────────
// Sends reminder to pending signers when a document expires within 24 hours
async function checkDocumentReminders(now) {
  try {
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find documents expiring in <=24h that have reminders enabled and not yet sent
    const docs = await Document.find({
      remindersEnabled: true,
      reminderSent: false,
      status: { $in: ['Pending', 'PartiallySigned', 'Viewed'] },
      isDeleted: false,
      expiresAt: { $gt: now, $lte: in24h }
    });

    if (docs.length === 0) return;
    console.log(`[Scheduler] Found ${docs.length} document(s) needing reminder emails.`);

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5177';

    for (const doc of docs) {
      try {
        // Get all pending recipients
        const pendingRecipients = await DocumentRecipient.find({
          documentId: doc._id,
          status: { $in: ['Waiting', 'Notified'] }
        });

        const owner = await User.findById(doc.ownerId);
        const senderName = owner ? owner.name : 'SignFlow AI';
        const signingUrl = `${FRONTEND_URL}/share/${doc._id}`;
        const expiryDate = doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : 'Soon';

        for (const recipient of pendingRecipients) {
          await sendReminderEmail(
            recipient.email,
            recipient.name,
            doc.filename,
            signingUrl,
            senderName,
            expiryDate
          );
          console.log(`[Scheduler] Reminder sent to ${recipient.email} for doc "${doc.filename}"`);
        }

        // Mark reminder as sent to prevent duplicates
        doc.reminderSent = true;
        await doc.save();
      } catch (err) {
        console.error(`[Scheduler] Failed to send reminder for doc ${doc._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] checkDocumentReminders error:', err.message);
  }
}

// ─── 2. Expiration Emails ────────────────────────────────────────────────────
// Marks documents as Expired and notifies owners
async function checkDocumentExpiration(now) {
  try {
    const expiredDocs = await Document.find({
      expiredEmailSent: false,
      status: { $nin: ['Signed', 'Rejected', 'Archived', 'Expired'] },
      isDeleted: false,
      expiresAt: { $lte: now }
    });

    if (expiredDocs.length === 0) return;
    console.log(`[Scheduler] Found ${expiredDocs.length} document(s) to mark as expired.`);

    for (const doc of expiredDocs) {
      try {
        doc.status = 'Expired';
        doc.expiredEmailSent = true;
        await doc.save();

        const owner = await User.findById(doc.ownerId);
        if (owner) {
          await sendDocumentExpiredEmail(owner.email, doc.filename, owner.name);
          console.log(`[Scheduler] Expiration email sent to ${owner.email} for doc "${doc.filename}"`);
        }
      } catch (err) {
        console.error(`[Scheduler] Failed to expire doc ${doc._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] checkDocumentExpiration error:', err.message);
  }
}

// ─── 3. Trial Ending Emails ──────────────────────────────────────────────────
// DEMO FEATURE - Student Project
// Replace with Stripe trial_will_end webhook in production
async function checkTrialEnding(now) {
  try {
    // Demo logic: Free plan users who joined > 25 days ago get trial-ending notice
    const trialCutoff = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);

    const usersNearingTrialEnd = await User.find({
      plan: 'Free',
      trialEndingEmailSent: false,
      createdAt: { $lte: trialCutoff }
    });

    if (usersNearingTrialEnd.length === 0) return;
    console.log(`[Scheduler] Found ${usersNearingTrialEnd.length} user(s) nearing trial end.`);

    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5177';
    const upgradeUrl = `${FRONTEND_URL}/billing`;

    for (const user of usersNearingTrialEnd) {
      try {
        await sendTrialEndingEmail(user.email, user.name, 'Free Trial', upgradeUrl);
        user.trialEndingEmailSent = true;
        await user.save();
        console.log(`[Scheduler] Trial ending email sent to ${user.email}`);
      } catch (err) {
        console.error(`[Scheduler] Failed to send trial ending email to ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] checkTrialEnding error:', err.message);
  }
}
