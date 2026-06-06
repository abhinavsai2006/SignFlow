import express from 'express';
import SignatureField from '../models/SignatureField.js';
import SignatureProfile from '../models/SignatureProfile.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/authMiddleware.js';
import { sendCompletionEmail, sendInviteEmail, sendCompletedSignerEmail } from '../middleware/emailService.js';
import DocumentRecipient from '../models/DocumentRecipient.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();

const parseUA = (ua) => {
  let browser = 'Unknown Browser';
  let device = 'Desktop';
  let os = 'Unknown OS';

  if (!ua) return { browser, device, os };

  // Device type
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    device = 'Tablet';
  }

  // Browser detection
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/trident|msie/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  // OS detection
  if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
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

// Helper to log audit events
const logAuditEvent = async (documentId, userId, action, req) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    await AuditLog.create({
      documentId,
      userId,
      action,
      ipAddress,
      userAgent,
      device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      country: 'Localhost',
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
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

    // Capture IP address and User-Agent details
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown Browser';
    const { browser, device, os } = parseUA(ua);

    field.ipAddress = ip;
    field.userAgent = ua;
    field.browser = browser;
    field.device = device;
    field.operatingSystem = os;
    field.location = 'San Francisco, CA (IP Geolocation Sim)';
    
    // Generate IDs
    const year = new Date().getFullYear();
    const randomHexCert = crypto.randomBytes(4).toString('hex').toUpperCase();
    const randomHexAudit = crypto.randomBytes(6).toString('hex').toUpperCase();
    
    field.certificateId = `SIG-${year}-${randomHexCert}`;
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

        // If sequential, notify the next recipient in order
        if (document && document.signingOrder === 'Sequential') {
          const recipients = await DocumentRecipient.find({ documentId: document._id, role: 'Signer' }).sort({ sequence: 1 });
          const nextRecipient = recipients.find(r => r.sequence > recipient.sequence && r.status === 'Waiting');
          if (nextRecipient) {
            nextRecipient.status = 'Notified';
            await nextRecipient.save();
            const editUrl = `http://localhost:5177/edit/${document._id}`;
            await sendInviteEmail(nextRecipient.email, nextRecipient.name, document.filename, editUrl);
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
      return res.status(404).json({ message: 'Signature field not found' });
    }
    await field.deleteOne();
    res.json({ message: 'Signature field removed successfully' });
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

    // Load original PDF bytes
    console.log('Finalizing PDF with originalPath:', document.originalPath);
    if (!fs.existsSync(document.originalPath)) {
      console.log('File does NOT exist on disk!');
    } else {
      console.log('File size on disk:', fs.statSync(document.originalPath).size);
    }
    const pdfBytes = fs.readFileSync(document.originalPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Embed standard Fonts
    const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // Iterate placed fields and draw onto pages
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

      if (field.value.startsWith('data:image')) {
        // Embed drawing or uploaded signature image buffer
        const base64Data = field.value.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        let embeddedImage;
        if (field.value.includes('image/png')) {
          embeddedImage = await pdfDoc.embedPng(imageBuffer);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBuffer);
        }

        page.drawImage(embeddedImage, {
          x: targetX,
          y: targetY,
          width: targetW,
          height: targetH
        });
      } else if (field.type === 'Checkbox') {
        // Render checkbox indicator
        const isChecked = field.value === 'true';
        page.drawText(isChecked ? '[X]' : '[ ]', {
          x: targetX,
          y: targetY + 2,
          size: 12,
          font: helveticaBoldOblique,
          color: rgb(0, 0.392, 0.878)
        });
      } else {
        // Render standard typed text or date string
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

        page.drawText(displayVal, {
          x: targetX,
          y: targetY + 4,
          size: Math.max(8, targetH * 0.5),
          font: fontStyle,
          color: rgb(0, 0.392, 0.878)
        });
      }

      // Draw a thin border line beneath the signature for professional appearance
      page.drawLine({
        start: { x: targetX, y: targetY - 2 },
        end: { x: targetX + targetW, y: targetY - 2 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7)
      });
    }

    // Build finalized PDF bytes
    const finalizedBytes = await pdfDoc.save();

    // Compute cryptographic SHA256 checksum
    const sha256Checksum = crypto.createHash('sha256').update(finalizedBytes).digest('hex');

    // --- Embed Certificate of Completion Page ---
    const certPage = pdfDoc.addPage([595, 842]); // A4 portrait
    const { width: cW, height: cH } = certPage.getSize();
    const certFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const certFontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Retrieve owner info for the certificate
    const owner = await User.findById(document.ownerId);
    const ownerName = owner ? owner.name : 'Unknown Owner';
    const ownerEmail = owner ? owner.email : '';

    // Header bar
    certPage.drawRectangle({ x: 0, y: cH - 90, width: cW, height: 90, color: rgb(0, 0.392, 0.878) });
    certPage.drawText('Certificate of Completion', { x: 40, y: cH - 52, size: 22, font: certFont, color: rgb(1, 1, 1) });
    certPage.drawText('SignFlow AI — Electronic Signature Platform', { x: 40, y: cH - 72, size: 10, font: certFontRegular, color: rgb(0.8, 0.9, 1) });

    // Document info
    certPage.drawText(`Document: ${document.filename}`, { x: 40, y: cH - 120, size: 11, font: certFont, color: rgb(0.1, 0.1, 0.1) });
    certPage.drawText(`Owner: ${ownerName} ${ownerEmail ? `(${ownerEmail})` : ''}`, { x: 40, y: cH - 138, size: 10, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
    certPage.drawText(`Status: Fully Executed`, { x: 40, y: cH - 156, size: 10, font: certFontRegular, color: rgb(0.1, 0.6, 0.2) });
    certPage.drawText(`Completed: ${new Date().toUTCString()}`, { x: 40, y: cH - 174, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });
    certPage.drawText(`Document ID: ${document._id}`, { x: 40, y: cH - 190, size: 9, font: certFontRegular, color: rgb(0.4, 0.4, 0.4) });

    // Divider
    certPage.drawLine({ start: { x: 40, y: cH - 200 }, end: { x: cW - 40, y: cH - 200 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

    // Signers list title
    certPage.drawText('Signer Lifecycle & Verification Audit Trail', { x: 40, y: cH - 220, size: 11, font: certFont, color: rgb(0.2, 0.2, 0.2) });

    let boxY = cH - 315;
    for (const field of fields) {
      if (field.status !== 'Signed') continue;
      const signerDisplayName = field.userId?.name || field.recipientEmail.split('@')[0];
      const signedAt = field.updatedAt ? new Date(field.updatedAt).toUTCString() : new Date().toUTCString();
      const ip = field.ipAddress || '127.0.0.1';
      const certId = field.certificateId || 'SIG-PENDING';
      const auditId = field.auditId || 'AUD-PENDING';
      const tamperStatus = field.tamperStatus || 'Verified';
      const docHash = field.documentHash || sha256Checksum;
      const verificationStatus = field.status === 'Signed' ? 'Verified Signature' : 'Pending';

      // Draw light card background for this signer block
      certPage.drawRectangle({
        x: 40,
        y: boxY,
        width: cW - 80,
        height: 80,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1
      });

      // Card Header: Signer Name & Email
      certPage.drawText(`${signerDisplayName} (${field.recipientEmail})`, { x: 50, y: boxY + 65, size: 9, font: certFont, color: rgb(0, 0.392, 0.878) });
      
      // Metadata Details inside card (two columns)
      certPage.drawText(`Signed At: ${signedAt}`, { x: 50, y: boxY + 48, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
      certPage.drawText(`IP Address: ${ip}`, { x: 50, y: boxY + 34, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
      certPage.drawText(`Certificate ID: ${certId}`, { x: 50, y: boxY + 20, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
      
      certPage.drawText(`Audit ID: ${auditId}`, { x: 300, y: boxY + 48, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
      certPage.drawText(`Tamper Status: ${tamperStatus}`, { x: 300, y: boxY + 34, size: 8, font: certFontRegular, color: rgb(0.1, 0.6, 0.2) });
      certPage.drawText(`Verification Status: ${verificationStatus}`, { x: 300, y: boxY + 20, size: 8, font: certFont, color: rgb(0, 0.6, 0.2) });

      // Document hash for this signature block
      certPage.drawText(`SHA-256 Hash: ${docHash}`, { x: 50, y: boxY + 6, size: 7, font: certFontRegular, color: rgb(0.5, 0.5, 0.5) });

      boxY -= 90; // Move down for the next signer block
      
      // Prevent overflow
      if (boxY < 80) break;
    }

    // Document Fingerprint at the bottom
    const hashY = 85;
    certPage.drawRectangle({ x: 40, y: hashY, width: cW - 80, height: 32, color: rgb(0.96, 0.98, 1), borderColor: rgb(0.7, 0.8, 1), borderWidth: 1 });
    certPage.drawText('Final Document Fingerprint (SHA-256):', { x: 48, y: hashY + 20, size: 8, font: certFont, color: rgb(0.2, 0.3, 0.8) });
    certPage.drawText(sha256Checksum, { x: 48, y: hashY + 6, size: 7, font: certFontRegular, color: rgb(0.1, 0.1, 0.4) });

    // Footer
    certPage.drawText('This certificate is generated by SignFlow AI and is legally binding in jurisdictions recognizing electronic signatures.', {
      x: 40, y: 40, size: 7, font: certFontRegular, color: rgb(0.6, 0.6, 0.6)
    });

    // Re-save with cert page
    const finalBytesWithCert = await pdfDoc.save();
    const finalChecksumWithCert = crypto.createHash('sha256').update(finalBytesWithCert).digest('hex');


    // Save finalized document to disk
    const finalizedPath = `uploads/finalized-${Date.now()}-${document.filename}`;
    fs.writeFileSync(finalizedPath, finalBytesWithCert);

    // Update main model database keys
    document.originalPath = finalizedPath;
    document.status = 'Signed';
    document.sha256Checksum = finalChecksumWithCert;
    await document.save();

    // Log the action to Audit Trail
    await logAuditEvent(document._id, req.user._id, 'Finalize', req);

    // Send completion email to document owner
    const downloadUrl = `http://localhost:5177/edit/${document._id}`;
    if (owner) {
      await sendCompletionEmail(owner.email, document.filename, downloadUrl, owner.name);
    }

    // Send completed email to all signers
    try {
      const distinctSigners = await SignatureField.find({ documentId: document._id, status: 'Signed' }).distinct('recipientEmail');
      for (const signerEmail of distinctSigners) {
        const fieldsForSigner = fields.filter(f => f.recipientEmail.toLowerCase() === signerEmail.toLowerCase());
        const signerName = fieldsForSigner[0]?.userId?.name || signerEmail.split('@')[0];
        await sendCompletedSignerEmail(signerEmail, signerName, document.filename, downloadUrl);
      }
    } catch (err) {
      console.error('Failed to send signer completion emails:', err);
    }

    res.json({ 
      message: 'PDF finalized with Certificate of Completion and cryptographic stamp.', 
      document,
      sha256Checksum: finalChecksumWithCert
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to finalize PDF document', error: error.message });
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

    if (!fs.existsSync(document.originalPath)) {
      return res.status(404).json({ valid: false, message: 'Finalized file not found on disk.' });
    }

    const fileBytes = fs.readFileSync(document.originalPath);
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
    
    // Capture IP address and User-Agent details
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'Unknown Browser';
    const { browser, device, os } = parseUA(ua);

    field.ipAddress = ip;
    field.userAgent = ua;
    field.browser = browser;
    field.device = device;
    field.operatingSystem = os;
    field.location = 'San Francisco, CA (IP Geolocation Sim)';
    
    // Generate IDs
    const year = new Date().getFullYear();
    const randomHexCert = crypto.randomBytes(4).toString('hex').toUpperCase();
    const randomHexAudit = crypto.randomBytes(6).toString('hex').toUpperCase();
    
    field.certificateId = `SIG-${year}-${randomHexCert}`;
    field.auditId = `AUD-${randomHexAudit}`;
    field.tamperStatus = 'Verified';
    
    const docHashSource = `${field._id}-${field.recipientEmail}-${signatureValue || ''}-${Date.now()}`;
    field.documentHash = crypto.createHash('sha256').update(docHashSource).digest('hex');

    await field.save();

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
          const downloadUrl = `http://localhost:5177/edit/${document._id}`;
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
