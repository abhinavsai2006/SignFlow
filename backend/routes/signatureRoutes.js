import express from 'express';
import SignatureField from '../models/SignatureField.js';
import SignatureProfile from '../models/SignatureProfile.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendCompletionEmail,
  sendInviteEmail,
  sendCompletedSignerEmail,
  sendDocumentSignedEmail,
  sendAllSignersCompletedEmail,
  sendDownloadReadyEmail
} from '../middleware/emailService.js';
import DocumentRecipient from '../models/DocumentRecipient.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import crypto from 'crypto';
import { generateFinalizedPdf } from '../services/pdfService.js';
import { readPdfBytes } from '../utils/fileLoader.js';
import { uploadFile, deleteFile, getSignedUrl, isR2Active } from '../services/r2Service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Resolve frontend base URL from environment
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5177';

const parseUA = (ua) => {
  let browser = 'Chrome';
  let device = 'Desktop';
  let os = 'Windows';

  if (!ua) return { browser, device, os };

  // Device type - prioritize tablet checks
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|android|iphone|ipod|phone/i.test(ua)) {
    device = 'Mobile';
  }

  // Browser detection
  if (/brave/i.test(ua)) {
    browser = 'Brave';
  } else if (/edge|edg|edgios|edga/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr|opera|opios/i.test(ua)) {
    browser = 'Opera';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/chrome|crios|crmo/i.test(ua)) {
    browser = 'Chrome';
  }

  // OS detection
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua)) {
    os = 'macOS';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  return { browser, device, os };
};

const getClientIP = (req) => {
  let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
};

const getLocationInfo = async (ip) => {
  try {
    const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || 
          ip.startsWith('192.168.') || ip.startsWith('10.') || 
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) || ip.startsWith('169.254.');

    if (isLocal) {
      return {
        location: 'Local Development Environment',
        ip: '127.0.0.1',
        isp: 'Development Network'
      };
    }

    // 1. Primary: ip-api.com
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === 'success') {
          const country = data.country || '';
          const state = data.regionName || '';
          const city = data.city || '';
          const locationParts = [city, state, country].filter(Boolean);
          return {
            location: locationParts.join(', ') || 'Local Development Environment',
            ip: data.query || ip,
            isp: data.isp || 'Development Network'
          };
        }
      }
    } catch (err) {
      console.error('Primary Geolocation error (ip-api.com):', err);
    }

    // 2. Fallback: ipinfo.io
    try {
      const res = await fetch(`https://ipinfo.io/${ip}/json`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          const country = data.country || '';
          const state = data.region || '';
          const city = data.city || '';
          const locationParts = [city, state, country].filter(Boolean);
          return {
            location: locationParts.join(', ') || 'Local Development Environment',
            ip: data.ip || ip,
            isp: data.org || 'Development Network'
          };
        }
      }
    } catch (err) {
      console.error('Secondary Geolocation error (ipinfo.io):', err);
    }

    return {
      location: 'Local Development Environment',
      ip: ip || '127.0.0.1',
      isp: 'Development Network'
    };
  } catch (err) {
    console.error('Geolocation logic error:', err);
    return {
      location: 'Local Development Environment',
      ip: ip || '127.0.0.1',
      isp: 'Development Network'
    };
  }
};

// Helper to log audit events
const logAuditEvent = async (documentId, userId, action, req) => {
  try {
    const ipAddress = getClientIP(req);
    const geo = await getLocationInfo(ipAddress);
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const { browser, device, os } = parseUA(userAgent);

    await AuditLog.create({
      documentId,
      userId,
      action,
      ipAddress: geo.ip,
      userAgent,
      device,
      country: geo.location,
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
};

export const embedSignaturesToPdf = async (pdfDoc, fields) => {
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  const pages = pdfDoc.getPages();

  for (const field of fields) {
    const pageIndex = field.page - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    // Convert relative percentage dimensions to absolute points
    const targetX = (field.xPercent / 100) * width;
    const targetY = height - ((field.yPercent / 100) * height) - ((field.heightPercent / 100) * height);
    const targetW = (field.widthPercent / 100) * width;
    const targetH = (field.heightPercent / 100) * height;

    if (!field.value) continue;

    if (field.type === 'Checkbox') {
      // Draw a clean card background first
      page.drawRectangle({
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.75
      });
      // Render checkbox indicator
      const isChecked = field.value === 'true';
      page.drawText(isChecked ? '[X]' : '[ ]', {
        x: targetX + (targetW - 12) / 2,
        y: targetY + (targetH - 10) / 2,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0.392, 0.878)
      });
    } else {
      // Draw professional signature block card (for Signature, Initials, Date, Text)
      page.drawRectangle({
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.75
      });

      const footerH = Math.max(16, Math.min(26, targetH * 0.35));
      const sepY = targetY + footerH;

      // Divider line
      page.drawLine({
        start: { x: targetX, y: sepY },
        end: { x: targetX + targetW, y: sepY },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9)
      });

      const topPadding = 2;
      const contentW = targetW - topPadding * 2;
      const contentH = targetH - footerH - topPadding * 2;
      const contentX = targetX + topPadding;
      const contentY = sepY + topPadding;

      // Draw signature content (image or typed text)
      if (field.value.startsWith('data:image')) {
        const base64Data = field.value.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        let embeddedImage;
        try {
          if (field.value.includes('image/png')) {
            embeddedImage = await pdfDoc.embedPng(imageBuffer);
          } else {
            embeddedImage = await pdfDoc.embedJpg(imageBuffer);
          }
          
          const imgSize = embeddedImage.scale(1);
          const scale = Math.min(contentW / imgSize.width, contentH / imgSize.height);
          const fitW = imgSize.width * scale;
          const fitH = imgSize.height * scale;
          const fitX = contentX + (contentW - fitW) / 2;
          const fitY = contentY + (contentH - fitH) / 2;

          page.drawImage(embeddedImage, {
            x: fitX,
            y: fitY,
            width: fitW,
            height: fitH
          });
        } catch (e) {
          console.error('Failed to embed signature image:', e);
        }
      } else {
        let displayVal = field.value;
        let fontStyle = helveticaBoldOblique;
        
        if (displayVal.includes(':')) {
          const parts = displayVal.split(':');
          const fontPrefix = parts[0];
          displayVal = parts[1] || displayVal;
          if (fontPrefix === 'cursive' || fontPrefix === 'great-vibes') {
            fontStyle = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
          } else if (fontPrefix === 'serif' || fontPrefix === 'dancing-script') {
            fontStyle = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
          } else if (fontPrefix === 'sans-serif' || fontPrefix === 'allura') {
            fontStyle = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
          }
        }
        
        const textWidth = fontStyle.widthOfTextAtSize(displayVal, Math.max(5, contentH * 0.5));
        const textX = contentX + (contentW - textWidth) / 2;
        const textY = contentY + (contentH - Math.max(5, contentH * 0.5)) / 2 + 1;

        page.drawText(displayVal, {
          x: textX,
          y: textY,
          size: Math.max(5, contentH * 0.5),
          font: fontStyle,
          color: rgb(0.1, 0.1, 0.1)
        });
      }

      // Draw footer details
      const signerDisplayName = field.signerName || field.recipientEmail.split('@')[0];
      const nameSize = Math.max(4.5, Math.min(7.5, footerH * 0.32));
      const subSize = Math.max(3.5, Math.min(5.5, footerH * 0.22));

      // 1. Signer Name
      page.drawText(signerDisplayName, {
        x: targetX + 5,
        y: targetY + footerH * 0.6,
        size: nameSize,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2)
      });

      // 2. "Digitally Signed" text
      page.drawText('Digitally Signed', {
        x: targetX + 5,
        y: targetY + footerH * 0.32,
        size: subSize,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
      });

      // 3. Timestamp
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const d = field.updatedAt ? new Date(field.updatedAt) : new Date();
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = months[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      const formattedDate = `${day} ${month} ${year} • ${hours}:${minutes} UTC`;

      page.drawText(formattedDate, {
        x: targetX + 5,
        y: targetY + footerH * 0.1,
        size: subSize * 0.85,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5)
      });

      // 4. Green Verified Badge
      const badgeW = Math.max(28, targetW * 0.22);
      const badgeH = Math.max(6, footerH * 0.3);
      page.drawRectangle({
        x: targetX + targetW - badgeW - 5,
        y: targetY + footerH * 0.22,
        width: badgeW,
        height: badgeH,
        color: rgb(0.19, 0.635, 0.3)
      });

      const badgeText = '✓ VERIFIED';
      const badgeTextW = helveticaBold.widthOfTextAtSize(badgeText, badgeH * 0.65);
      page.drawText(badgeText, {
        x: targetX + targetW - badgeW - 5 + (badgeW - badgeTextW) / 2,
        y: targetY + footerH * 0.22 + (badgeH - badgeH * 0.65) / 2 + 0.5,
        size: badgeH * 0.65,
        font: helveticaBold,
        color: rgb(1, 1, 1)
      });
    }
  }
};

// ==========================================
// SIGNATURE PROFILES (STAGE 2)
// ==========================================

// @route   POST /api/signatures/profiles
// @desc    Create/Save a signature profile (Draw, Type, or Upload)
router.post('/profiles', protect, async (req, res) => {
  try {
    const { name, type, imageData, fontName, color } = req.body;
    if (!name || !type || !imageData) {
      return res.status(400).json({ message: 'Name, type, and imageData are required' });
    }

    const profile = await SignatureProfile.create({
      userId: req.user._id,
      name,
      type,
      imageData,
      fontName,
      color: color || 'black'
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create signature profile', error: error.message });
  }
});

// @route   GET /api/signatures/profiles
// @desc    Get all saved signature profiles for the logged-in user
router.get('/profiles', protect, async (req, res) => {
  try {
    const profiles = await SignatureProfile.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve signature profiles', error: error.message });
  }
});

// @route   DELETE /api/signatures/profiles/:id
// @desc    Delete a saved signature profile
router.delete('/profiles/:id', protect, async (req, res) => {
  try {
    const profile = await SignatureProfile.findOne({ _id: req.params.id, userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Signature profile not found or unauthorized' });
    }
    await profile.deleteOne();
    res.json({ message: 'Signature profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete signature profile', error: error.message });
  }
});


// ==========================================
// SIGNATURE FIELDS (STAGE 3)
// ==========================================

// @route   POST /api/signatures
// @desc    Create/Place a new signature field placeholder
router.post('/', protect, async (req, res) => {
  try {
    const { 
      documentId, 
      recipientEmail, 
      type, 
      xPercent, 
      yPercent, 
      widthPercent, 
      heightPercent, 
      page 
    } = req.body;

    if (!documentId || !recipientEmail || !type || xPercent === undefined || yPercent === undefined) {
      return res.status(400).json({ 
        message: 'documentId, recipientEmail, type, xPercent, and yPercent are required' 
      });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const field = await SignatureField.create({
      documentId,
      userId: req.user._id,
      recipientEmail,
      type,
      xPercent,
      yPercent,
      widthPercent: widthPercent || 15,
      heightPercent: heightPercent || 5,
      page: page || 1,
      status: 'Pending'
    });

    res.status(201).json(field);
  } catch (error) {
    res.status(500).json({ message: 'Failed to place signature field', error: error.message });
  }
});

// @route   GET /api/signatures/document/:documentId
// @desc    Get all signature fields for a specific document
router.get('/document/:documentId', protect, async (req, res) => {
  try {
    const fields = await SignatureField.find({ documentId: req.params.documentId });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve document fields', error: error.message });
  }
});

// @route   PUT /api/signatures/:id
// @desc    Update a signature field (position, size, status, or fill value)
router.put('/:id', protect, async (req, res) => {
  try {
    const { 
      xPercent, 
      yPercent, 
      widthPercent, 
      heightPercent, 
      status, 
      value, 
      recipientEmail 
    } = req.body;

    const field = await SignatureField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: 'Signature field not found' });
    }

    if (xPercent !== undefined) field.xPercent = xPercent;
    if (yPercent !== undefined) field.yPercent = yPercent;
    if (widthPercent !== undefined) field.widthPercent = widthPercent;
    if (heightPercent !== undefined) field.heightPercent = heightPercent;
    if (status !== undefined) field.status = status;
    if (value !== undefined) field.value = value;
    if (recipientEmail !== undefined) field.recipientEmail = recipientEmail;

    await field.save();

    res.json(field);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update signature field', error: error.message });
  }
});

// @route   PUT /api/signatures/:id/sign
// @desc    Sign a signature field and log audit event
router.put('/:id/sign', protect, async (req, res) => {
  try {
    const { status, signatureValue } = req.body;
    const field = await SignatureField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: 'Signature field not found' });
    }

    // Verify ownership/recipient assignment
    if (field.recipientEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: `This signature field is assigned to ${field.recipientEmail}, not you.` });
    }

    const document = await Document.findById(field.documentId);
    if (document && document.signingOrder === 'Sequential') {
      const recipients = await DocumentRecipient.find({ documentId: document._id, role: 'Signer' }).sort({ sequence: 1 });
      const currentRecipient = recipients.find(r => r.email.toLowerCase() === req.user.email.toLowerCase());
      
      if (currentRecipient) {
        // Find preceding recipients that are not 'Signed'
        const precedingRecipients = recipients.filter(r => r.sequence < currentRecipient.sequence);
        for (const prec of precedingRecipients) {
          const pendingCount = await SignatureField.countDocuments({
            documentId: document._id,
            recipientEmail: prec.email,
            status: { $ne: 'Signed' }
          });
          if (pendingCount > 0) {
            return res.status(403).json({ 
              message: `It is not your turn to sign. ${prec.name} (${prec.email}) must sign first.` 
            });
          }
        }
      }
    }

    if (status !== undefined) field.status = status;
    if (signatureValue !== undefined) field.value = signatureValue;

    const recipient = await DocumentRecipient.findOne({ 
      documentId: field.documentId, 
      email: field.recipientEmail 
    });
    field.signerName = req.body.signerName || req.user.name || recipient?.name || field.recipientEmail.split('@')[0];

    // Capture IP address and User-Agent details
    const ip = getClientIP(req);
    const geo = await getLocationInfo(ip);
    const ua = req.headers['user-agent'] || 'Unknown Browser';
    const { browser, device, os } = parseUA(ua);

    field.ipAddress = geo.ip;
    field.userAgent = ua;
    field.browser = browser;
    field.device = device;
    field.operatingSystem = os;
    field.location = geo.location;
    field.isp = geo.isp;
    
    // Generate IDs
    const randomHexCert = crypto.randomBytes(3).toString('hex').toUpperCase();
    const randomHexAudit = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    field.certificateId = `SIG-2026-${randomHexCert}`;
    field.auditId = `AUD-${randomHexAudit}`;
    field.tamperStatus = 'Verified';
    
    const docHashSource = `${field._id}-${field.recipientEmail}-${signatureValue || ''}-${Date.now()}`;
    field.documentHash = crypto.createHash('sha256').update(docHashSource).digest('hex');

    await field.save();

    // Log the audit event for signing
    await logAuditEvent(field.documentId, req.user._id, 'Sign', req);

    // Update Recipient status to Signed if all their fields are now signed
    const allRecipientFields = await SignatureField.find({ 
      documentId: field.documentId, 
      recipientEmail: field.recipientEmail 
    });
    const unsignedFields = allRecipientFields.filter(f => f.status !== 'Signed');
    
    if (unsignedFields.length === 0) {
      // Find the recipient entry
      const recipient = await DocumentRecipient.findOne({ 
        documentId: field.documentId, 
        email: field.recipientEmail 
      });
      if (recipient) {
        recipient.status = 'Signed';
        await recipient.save();

        // Notify the document owner that an individual signer has completed
        const doc = await Document.findById(field.documentId);
        if (doc) {
          const owner = await User.findById(doc.ownerId);
          if (owner) {
            sendDocumentSignedEmail(owner.email, owner.name, field.recipientEmail, doc.filename)
              .catch(err => console.error('[Sig] Document signed email failed:', err.message));
          }
        }

        // If sequential, notify the next recipient in order
        if (document && document.signingOrder === 'Sequential') {
          const recipients = await DocumentRecipient.find({ documentId: document._id, role: 'Signer' }).sort({ sequence: 1 });
          const nextRecipient = recipients.find(r => r.sequence > recipient.sequence && r.status === 'Waiting');
          if (nextRecipient) {
            nextRecipient.status = 'Notified';
            await nextRecipient.save();
            const signingUrl = `${FRONTEND_URL}/share/${document._id}`;
            await sendInviteEmail(nextRecipient.email, nextRecipient.name, document.filename, signingUrl);
          }
        }
      }
    }

    // Update document status based on overall signing progress
    const allDocFields = await SignatureField.find({ documentId: field.documentId });
    const totalSigned = allDocFields.filter(f => f.status === 'Signed').length;
    const totalFields = allDocFields.length;

    if (document) {
      if (totalSigned === totalFields) {
        document.status = 'Signed';
      } else if (totalSigned > 0) {
        document.status = 'PartiallySigned';
      }
      await document.save();
    }

    res.json(field);
  } catch (error) {
    res.status(500).json({ message: 'Failed to sign signature field', error: error.message });
  }
});

// @route   DELETE /api/signatures/:id
// @desc    Remove a signature field
router.delete('/:id', protect, async (req, res) => {
  try {
    const field = await SignatureField.findById(req.params.id);
    if (!field) {
      return res.status(200).json({ success: true, message: 'Field removed' });
    }
    await field.deleteOne();
    res.status(200).json({ success: true, message: 'Field removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete signature field', error: error.message });
  }
});


// ==========================================
// PDF FINALIZATION PIPELINE (STAGE 4)
// ==========================================

// @route   POST /api/signatures/finalize
// @desc    Embed placed signatures and generate finalized document with SHA-256 hash
router.post('/finalize', protect, async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({ message: 'documentId is required' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Load placed fields with populated user info
    const fields = await SignatureField.find({ documentId, status: 'Signed' }).populate('userId');
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Please sign all placed placeholders before finalization.' });
    }

    // Use /data/uploads in production
    const uploadsDir = fs.existsSync('/data') ? '/data/uploads' : path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Use centralized PDF service to finalize
    let finalBytes, sha256Checksum;
    try {
      const result = await generateFinalizedPdf(document, fields);
      finalBytes = result.finalBytes;
      sha256Checksum = result.sha256Checksum;
    } catch (pdfError) {
      console.error('[Finalize] PDF generation failed:', pdfError.message);
      console.error('[Finalize] Document details:', {
        documentId,
        filename: document.filename,
        originalPath: document.originalPath,
        fileExists: document.originalPath ? fs.existsSync(document.originalPath) : false
      });
      return res.status(400).json({ 
        message: 'Failed to generate finalized PDF',
        error: pdfError.message,
        details: 'Check that the original file exists and all signature values are complete'
      });
    }

    // Save finalized document to disk with absolute path
    const timestamp = Date.now();
    const relativeFilename = `finalized-${timestamp}-${document.filename}`;
    const finalizedPath = path.join(uploadsDir, relativeFilename);
    
    try {
      fs.writeFileSync(finalizedPath, finalBytes);
    } catch (writeError) {
      console.error('[Finalize] File write failed:', writeError.message);
      return res.status(500).json({ 
        message: 'Failed to save finalized PDF to disk',
        error: writeError.message
      });
    }

    // Upload to Cloudflare R2
    const targetPath = `uploads/${relativeFilename}`;
    let finalizedFileUrl = targetPath;
    try {
      finalizedFileUrl = await uploadFile(finalizedPath, relativeFilename, 'application/pdf');
      // Clean up the temporary local file on disk only if R2 is active
      if (isR2Active() && fs.existsSync(finalizedPath)) {
        fs.unlinkSync(finalizedPath);
      }
    } catch (r2Err) {
      console.warn('[Finalize] R2 upload failed, falling back to local file path:', r2Err.message);
    }

    // Store finalized path separately — do NOT overwrite originalPath
    document.finalizedPath = targetPath;
    document.finalizedFileUrl = finalizedFileUrl;
    document.status = 'Signed';
    document.sha256Checksum = sha256Checksum;
    
    try {
      await document.save();
    } catch (dbError) {
      console.error('[Finalize] Database save failed:', dbError.message);
      // Cleanup the file if it still exists
      if (fs.existsSync(finalizedPath)) {
        fs.unlinkSync(finalizedPath);
      }
      return res.status(500).json({ 
        message: 'Failed to update document record',
        error: dbError.message
      });
    }

    // Log the action to Audit Trail
    try {
      await logAuditEvent(document._id, req.user._id, 'Finalize', req);
    } catch (auditError) {
      console.error('[Finalize] Audit logging failed (non-critical):', auditError.message);
      // Don't fail the entire request for audit logging
    }

    // Retrieve owner info for the email notification
    const owner = await User.findById(document.ownerId);

    // Send completion email to document owner - with error handling
    const downloadUrl = `${FRONTEND_URL}/edit/${document._id}`;
    if (owner) {
      sendCompletionEmail(owner.email, document.filename, downloadUrl, owner.name)
        .catch(err => console.error('[Finalize] Completion email failed:', err.message));
      sendAllSignersCompletedEmail(owner.email, owner.name, document.filename, downloadUrl)
        .catch(err => console.error('[Finalize] All signers completed email failed:', err.message));
      sendDownloadReadyEmail(owner.email, owner.name, document.filename, downloadUrl)
        .catch(err => console.error('[Finalize] Download ready email failed:', err.message));
    }

    // Send completed email to all signers
    try {
      const shareUrl = `${FRONTEND_URL}/share/${document._id}`;
      const distinctSigners = await SignatureField.find({ documentId: document._id, status: 'Signed' }).distinct('recipientEmail');
      for (const signerEmail of distinctSigners) {
        const fieldsForSigner = fields.filter(f => f.recipientEmail.toLowerCase() === signerEmail.toLowerCase());
        const signerName = fieldsForSigner[0]?.signerName || fieldsForSigner[0]?.userId?.name || signerEmail.split('@')[0];
        sendCompletedSignerEmail(signerEmail, signerName, document.filename, shareUrl)
          .catch(err => console.error(`[Finalize] Signer email to ${signerEmail} failed:`, err.message));
      }
    } catch (signerEmailError) {
      console.error('[Finalize] Failed to send signer emails:', signerEmailError.message);
      // Don't fail the entire request for signer emails
    }

    res.json({ 
      message: 'PDF finalized with Certificate of Completion and cryptographic stamp.', 
      document,
      sha256Checksum: sha256Checksum,
      downloadUrl: `/uploads/${relativeFilename}`
    });
  } catch (error) {
    console.error('[Finalize] Unexpected error:', error);
    res.status(500).json({ 
      message: 'Failed to finalize PDF document', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/signatures/verify/:documentId
// @desc    Verify document integrity via SHA-256 hash comparison (tamper detection)
router.post('/verify/:documentId', async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.sha256Checksum) {
      return res.status(400).json({ valid: false, message: 'Document has not been finalized yet. No hash available.' });
    }

    // Resolve file path - handle both absolute and relative paths
    let filePath = document.finalizedFileUrl || document.finalizedPath || document.originalFileUrl || document.originalPath;
    const fileBytes = await readPdfBytes(filePath);
    const computedHash = crypto.createHash('sha256').update(fileBytes).digest('hex');
    const valid = computedHash === document.sha256Checksum;

    const fields = await SignatureField.find({ documentId: document._id, status: 'Signed' });
    const signerLedger = fields.map(f => ({
      email: f.recipientEmail,
      signedAt: f.updatedAt,
      ipAddress: f.ipAddress,
      type: f.type
    }));

    res.json({
      valid,
      documentId: document._id,
      filename: document.filename,
      storedHash: document.sha256Checksum,
      computedHash,
      tampered: !valid,
      signedAt: document.updatedAt,
      signerCount: signerLedger.length,
      signerLedger,
      verificationId: `SF-${document._id.toString().slice(-8).toUpperCase()}`
    });
  } catch (error) {
    console.error('[Verify] Verification failed:', error.message);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// @route   POST /api/signatures/:id/sign-public
// @desc    Allow a public (unauthenticated) signer to submit their signature value
router.post('/:id/sign-public', async (req, res) => {
  try {
    const { signatureValue, signerEmail, signerName } = req.body;
    if (!signatureValue || !signerEmail) {
      return res.status(400).json({ message: 'signatureValue and signerEmail are required' });
    }

    const field = await SignatureField.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: 'Signature field not found' });
    }

    console.log("SIGNING_STARTED:", field.documentId, signerEmail);

    if (field.recipientEmail.toLowerCase() !== signerEmail.toLowerCase()) {
      return res.status(403).json({
        message: `This field is assigned to ${field.recipientEmail}, not ${signerEmail}.`
      });
    }

    if (field.status === 'Signed') {
      return res.status(409).json({ message: 'This field has already been signed.' });
    }

    field.value = signatureValue;
    field.status = 'Signed';

    const recipient = await DocumentRecipient.findOne({ 
      documentId: field.documentId, 
      email: field.recipientEmail 
    });
    field.signerName = signerName || recipient?.name || signerEmail.split('@')[0];
    
    // Capture IP address and User-Agent details
    const ip = getClientIP(req);
    const geo = await getLocationInfo(ip);
    const ua = req.headers['user-agent'] || 'Unknown Browser';
    const { browser, device, os } = parseUA(ua);

    field.ipAddress = geo.ip;
    field.userAgent = ua;
    field.browser = browser;
    field.device = device;
    field.operatingSystem = os;
    field.location = geo.location;
    field.isp = geo.isp;
    
    // Generate IDs
    const randomHexCert = crypto.randomBytes(3).toString('hex').toUpperCase();
    const randomHexAudit = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    field.certificateId = `SIG-2026-${randomHexCert}`;
    field.auditId = `AUD-${randomHexAudit}`;
    field.tamperStatus = 'Verified';
    
    const docHashSource = `${field._id}-${field.recipientEmail}-${signatureValue || ''}-${Date.now()}`;
    field.documentHash = crypto.createHash('sha256').update(docHashSource).digest('hex');

    await field.save();
    console.log("SIGNING_COMPLETED:", field.documentId, signerEmail);

    await logAuditEvent(field.documentId, null, `Public Sign by ${signerEmail}`, req);

    // Check if all fields across the document are now signed
    const remaining = await SignatureField.countDocuments({
      documentId: field.documentId,
      status: { $ne: 'Signed' }
    });

    if (remaining === 0) {
      const document = await Document.findById(field.documentId);
      if (document) {
        document.status = 'Signed';
        await document.save();

        const owner = await User.findById(document.ownerId);
        if (owner) {
          const downloadUrl = `${FRONTEND_URL}/edit/${document._id}`;
          await sendCompletionEmail(owner.email, document.filename, downloadUrl);
        }
      }
    }

    res.json({ message: 'Signature submitted successfully', field });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit public signature', error: error.message });
  }
});

// @route   GET /api/signatures/document/:documentId/public
// @desc    Get all signature fields for a document - public (no auth needed for public viewers)
router.get('/document/:documentId/public', async (req, res) => {
  try {
    const fields = await SignatureField.find({ documentId: req.params.documentId });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve document fields', error: error.message });
  }
});

export default router;
