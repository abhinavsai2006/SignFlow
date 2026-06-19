import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import { sendWelcomeEmail } from '../middleware/emailService.js';
import { resolveStoragePath } from '../utils/storagePath.js';
import EmailLog from '../models/EmailLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// @route   POST /api/email/test
// @desc    Dispatch a test email to verify Resend delivery
router.post('/test', protect, async (req, res) => {
  try {
    const recipient = 'mndabhinavsai@gmail.com';
    console.log(`[Email Route] Triggering test email to: ${recipient}...`);

    // Dispatch welcome email as test
    const result = await sendWelcomeEmail(recipient, 'Abhinav Sai');

    if (result.error) {
      return res.status(result.statusCode || 500).json({
        success: false,
        message: 'Resend delivery failed. Actual provider error returned below.',
        providerError: result.response || result.message
      });
    }

    const messageId = result.id || 'N/A';

    // Log the test in database
    await EmailLog.create({
      recipient,
      template: 'welcome-test',
      subject: 'Test Email Verification',
      provider: 'Resend',
      messageId,
      status: 'Delivered',
      providerResponse: JSON.stringify(result)
    });

    res.json({
      success: true,
      message: '✓ Test Email Sent Successfully',
      provider: 'Resend',
      recipient,
      messageId
    });

  } catch (err) {
    console.error('[Email Route] Crash in test send:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email dispatch.',
      error: err.message
    });
  }
});

// @route   GET /api/email/logs
// @desc    Get recent email log traces (for real-time dashboard health)
router.get('/logs', protect, async (req, res) => {
  try {
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve email logs', error: err.message });
  }
});

// @route   GET /api/email/stats
// @desc    Get live email metrics
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await EmailLog.countDocuments();
    const delivered = await EmailLog.countDocuments({ status: { $in: ['Delivered', 'Opened', 'Clicked'] } });
    const opened = await EmailLog.countDocuments({ status: 'Opened' });
    const clicked = await EmailLog.countDocuments({ status: 'Clicked' });
    const bounced = await EmailLog.countDocuments({ status: 'Bounced' });
    const failed = await EmailLog.countDocuments({ status: 'Failed' });

    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 100;
    const bounceRate = total > 0 ? Math.round((bounced / total) * 100) : 0;

    res.json({
      sent: total,
      delivered,
      opened,
      clicked,
      bounceRate,
      deliveryRate,
      failed
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve metrics', error: err.message });
  }
});

// @route   GET /api/email/status
// @desc    Retrieve system health status checks for dashboard
router.get('/status', protect, async (req, res) => {
  try {
    const signatureService = 'Online';
    const resendApiKey = process.env.RESEND_API_KEY || '';
    const emailService = resendApiKey && resendApiKey.startsWith('re_') ? 'Connected' : 'Offline';
    const database = mongoose.connection.readyState === 1 ? 'Healthy' : 'Disconnected';

    let storage = 'Healthy';
    try {
      const uploadsDir = resolveStoragePath();
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.accessSync(uploadsDir, fs.constants.W_OK);
    } catch {
      storage = 'Degraded';
    }

    let auditTrail = 'Active';
    try {
      await mongoose.connection.db.collection('auditlogs').estimatedDocumentCount();
    } catch {
      auditTrail = 'Inactive';
    }

    const publicSharing = 'Active';

    // Resend configuration status details
    const isCustomKey = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_ZS133hRk_GL6e3sy5X4EF1HgZG3YTs3PA';
    const configurationStatus = process.env.RESEND_API_KEY ? 'Fully Configured' : 'Demo Mode';
    const domainStatus = isCustomKey ? 'Verified (Custom Domain)' : 'Sandbox (onboarding@resend.dev)';
    const senderInfo = isCustomKey ? 'SignFlow <signflow@abhinavsai.com>' : 'SignFlow <onboarding@resend.dev>';
    
    // Retrieve last test email status
    const lastTestEmailLog = await EmailLog.findOne({ template: 'welcome-test' }).sort({ createdAt: -1 });
    const lastTestEmailStatus = lastTestEmailLog ? {
      recipient: lastTestEmailLog.recipient,
      sentAt: lastTestEmailLog.createdAt,
      status: lastTestEmailLog.status,
      messageId: lastTestEmailLog.messageId
    } : null;

    // Retrieve recent test email logs (up to 5)
    const testEmailLogs = await EmailLog.find({ template: 'welcome-test' }).sort({ createdAt: -1 }).limit(5);

    res.json({
      signatureService,
      emailService,
      database,
      storage,
      auditTrail,
      publicSharing,
      configurationStatus,
      domainStatus,
      senderInfo,
      lastTestEmailStatus,
      testEmailLogs
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve system status', error: err.message });
  }
});

export default router;
