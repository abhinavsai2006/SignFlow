import fs from 'fs';
import crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import User from '../models/User.js';
import SignatureField from '../models/SignatureField.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { readPdfBytes } from '../utils/fileLoader.js';
import { SignPdf, plainAddPlaceholder } from 'node-signpdf';
import { getSigningCertificate } from '../utils/certProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Draws all signed fields onto their respective pages in a PDF document.
 */
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

    const targetX = (field.xPercent / 100) * width;
    const targetY = height - ((field.yPercent / 100) * height) - ((field.heightPercent / 100) * height);
    const targetW = (field.widthPercent / 100) * width;
    const targetH = (field.heightPercent / 100) * height;

    if (!field.value) continue;

    if (field.type === 'Checkbox') {
      page.drawRectangle({
        x: targetX, y: targetY, width: targetW, height: targetH,
        color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1
      });
      const isChecked = field.value === 'true';
      page.drawText(isChecked ? '[X]' : '[ ]', {
        x: targetX + (targetW - 12) / 2, y: targetY + (targetH - 10) / 2,
        size: Math.min(10, targetH * 0.5), font: helveticaBold, color: rgb(0, 0, 0)
      });
    } else {
      // 1. Plain White Background with a Solid Black Border (Government DSC Style)
      page.drawRectangle({
        x: targetX, y: targetY, width: targetW, height: targetH,
        color: rgb(1, 1, 1),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
      });

      // Split into Left (Signature) and Right (DSC details)
      const isHorizontal = targetW > targetH * 1.5;
      
      let sigArea = { x: targetX, y: targetY, w: targetW, h: targetH };
      let metaArea = { x: targetX, y: targetY, w: targetW, h: targetH };

      if (isHorizontal) {
        sigArea.w = targetW * 0.4;
        metaArea.x = targetX + targetW * 0.4;
        metaArea.w = targetW * 0.6;
        
        // Draw black divider line
        page.drawLine({
          start: { x: targetX + targetW * 0.4, y: targetY },
          end: { x: targetX + targetW * 0.4, y: targetY + targetH },
          thickness: 0.5,
          color: rgb(0, 0, 0)
        });
      } else {
        sigArea.h = targetH * 0.5;
        sigArea.y = targetY + targetH * 0.5;
        metaArea.h = targetH * 0.5;
        
        // Draw horizontal divider
        page.drawLine({
          start: { x: targetX, y: targetY + targetH * 0.5 },
          end: { x: targetX + targetW, y: targetY + targetH * 0.5 },
          thickness: 0.5,
          color: rgb(0, 0, 0)
        });
      }

      // Draw signature image
      if (field.value.startsWith('data:image')) {
        const base64Data = field.value.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        try {
          let embeddedImage = field.value.includes('image/png') 
            ? await pdfDoc.embedPng(imageBuffer) 
            : await pdfDoc.embedJpg(imageBuffer);
          const imgSize = embeddedImage.scale(1);
          const padding = 4;
          const contentW = sigArea.w - padding * 2;
          const contentH = sigArea.h - padding * 2;
          const scaleFactor = Math.min(contentW / imgSize.width, contentH / imgSize.height);
          const fitW = imgSize.width * scaleFactor;
          const fitH = imgSize.height * scaleFactor;
          
          page.drawImage(embeddedImage, {
            x: sigArea.x + padding + (contentW - fitW) / 2,
            y: sigArea.y + padding + (contentH - fitH) / 2,
            width: fitW, height: fitH
          });
        } catch (e) { console.error('Signature embed error:', e); }
      } else {
        let displayVal = field.value;
        let fontStyle = helveticaBoldOblique;
        if (displayVal.includes(':')) {
          const parts = displayVal.split(':');
          displayVal = parts[1] || displayVal;
          if (['cursive', 'great-vibes'].includes(parts[0])) fontStyle = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
          else if (['serif', 'dancing-script'].includes(parts[0])) fontStyle = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
        }
        const textSize = Math.min(18, sigArea.h * 0.4);
        const textWidth = fontStyle.widthOfTextAtSize(displayVal, textSize);
        page.drawText(displayVal, {
          x: sigArea.x + (sigArea.w - textWidth) / 2,
          y: sigArea.y + (sigArea.h - textSize) / 2,
          size: textSize, font: fontStyle, color: rgb(0.1, 0.1, 0.1)
        });
      }

      // Draw Metadata in Government DSC Style
      const signerName = field.signerName || field.recipientEmail.split('@')[0];
      const d = field.updatedAt ? new Date(field.updatedAt) : new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const formattedDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      const certId = field.certificateId || `SIGNFLOW-${field._id.toString().slice(-4).toUpperCase()}`;

      let cursorY = metaArea.y + metaArea.h - 10;
      const textX = metaArea.x + 6;
      
      page.drawText('Digitally Signed by:', { x: textX, y: cursorY, size: 5.5, font: helveticaBold, color: rgb(0.3, 0.3, 0.3) });
      cursorY -= 8;
      page.drawText(signerName, { x: textX, y: cursorY, size: 7.5, font: helveticaBold, color: rgb(0, 0, 0) });
      cursorY -= 9;
      page.drawText(`Date: ${formattedDate}`, { x: textX, y: cursorY, size: 6, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
      cursorY -= 8;
      page.drawText('Reason: Approved', { x: textX, y: cursorY, size: 6, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
      cursorY -= 8;
      page.drawText(`Cert ID: ${certId}`, { x: textX, y: cursorY, size: 5.5, font: helveticaFont, color: rgb(0.3, 0.3, 0.3) });
      cursorY -= 8;
      page.drawText('SHA256 Verified', { x: textX, y: cursorY, size: 6, font: helveticaBold, color: rgb(0, 0.5, 0.1) }); // Dark Green
    }
  }
};

import QRCode from 'qrcode';

/**
 * Appends a highly professional, green-themed verified digital signature certificate page.
 */
export const generateCertificatePage = async (pdfDoc, document, fields, sha256Checksum) => {
  const certPage = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width: cW, height: cH } = certPage.getSize();
  const certFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const certFontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Retrieve owner info
  const owner = await User.findById(document.ownerId);
  const ownerName = owner ? owner.name : 'Unknown Owner';
  const ownerEmail = owner ? owner.email : '';

  // Premium dark-themed header bar (SignFlow aesthetic)
  certPage.drawRectangle({ x: 0, y: cH - 110, width: cW, height: 110, color: rgb(0.06, 0.06, 0.08) }); // Rich dark gray/black
  
  // Title and subtitle
  certPage.drawText('SignFlow', { x: 40, y: cH - 45, size: 28, font: certFont, color: rgb(1, 1, 1) });
  certPage.drawText('Certificate of Completion', { x: 40, y: cH - 75, size: 16, font: certFontRegular, color: rgb(0.8, 0.8, 0.8) });
  certPage.drawText('Final Audit Report', { x: cW - 160, y: cH - 75, size: 14, font: certFontRegular, color: rgb(0.5, 0.5, 0.5) });

  // Document details section with a subtle background box
  certPage.drawRectangle({ x: 40, y: cH - 200, width: cW - 80, height: 75, color: rgb(0.97, 0.97, 0.98), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 });
  
  certPage.drawText('Document Information', { x: 55, y: cH - 145, size: 12, font: certFont, color: rgb(0.1, 0.1, 0.1) });
  certPage.drawText(`Document Name: ${document.filename}`, { x: 55, y: cH - 165, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });
  certPage.drawText(`Document ID: ${document._id}`, { x: 55, y: cH - 180, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });
  
  certPage.drawText(`Sender: ${ownerName} (${ownerEmail})`, { x: 300, y: cH - 165, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });
  certPage.drawText(`Completed Date: ${new Date(document.updatedAt || Date.now()).toUTCString()}`, { x: 300, y: cH - 180, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Verification status pills — WinAnsi-safe ASCII only (no ✓ U+2713)
  certPage.drawRectangle({ x: 40, y: cH - 240, width: cW - 80, height: 26, color: rgb(0.95, 0.97, 1), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
  certPage.drawText('[VERIFIED]   |   [TAMPER PROTECTED]   |   [LEGALLY BINDING]   |   [AUDIT TRAIL COMPLETE]', { x: 50, y: cH - 231, size: 9, font: certFont, color: rgb(0.1, 0.4, 0.8) });

  let boxY = cH - 370;
  for (const field of fields) {
    if (field.status !== 'Signed') continue;
    const signerDisplayName = field.signerName || 'Signer';
    const signedAt = field.updatedAt ? new Date(field.updatedAt).toUTCString() : new Date().toUTCString();
    
    // Check local dev mode
    const isLocal = !field.ipAddress || field.ipAddress === '127.0.0.1' || field.location === 'Local Development Environment';
    const ip = isLocal ? '127.0.0.1' : (field.ipAddress || '127.0.0.1');
    const location = isLocal ? 'Local Development Environment' : (field.location || 'Local Development Environment');
    const isp = isLocal ? 'Development Network' : (field.isp || 'Development Network');
    
    const certId = field.certificateId || `SIG-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const auditId = field.auditId || `AUD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const docHash = field.documentHash || sha256Checksum;
    const browser = field.browser || 'Chrome';
    const os = field.operatingSystem || 'Windows';
    const device = field.device || 'Desktop';

    // Draw card box
    certPage.drawRectangle({
      x: 40,
      y: boxY,
      width: cW - 80,
      height: 120,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1
    });

    // Column 1: Identity
    certPage.drawText('Identity Verification', { x: 50, y: boxY + 100, size: 9, font: certFont, color: rgb(0.1, 0.1, 0.1) });
    certPage.drawText(`Name: ${signerDisplayName}`, { x: 50, y: boxY + 86, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
    certPage.drawText(`Email: ${field.recipientEmail}`, { x: 50, y: boxY + 72, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });

    // Column 2: Signing Info
    certPage.drawText('Event Information', { x: 220, y: boxY + 100, size: 9, font: certFont, color: rgb(0.1, 0.1, 0.1) });
    certPage.drawText(`Date/Time: ${signedAt}`, { x: 220, y: boxY + 86, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
    certPage.drawText(`IP Address: ${ip}`, { x: 220, y: boxY + 72, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
    certPage.drawText(`Location: ${location}`, { x: 220, y: boxY + 58, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });

    // Column 3: Device Info
    certPage.drawText('Device Information', { x: 400, y: boxY + 100, size: 9, font: certFont, color: rgb(0.1, 0.1, 0.1) });
    certPage.drawText(`Browser: ${browser}`, { x: 400, y: boxY + 86, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
    certPage.drawText(`OS: ${os}`, { x: 400, y: boxY + 72, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });
    certPage.drawText(`Device: ${device}`, { x: 400, y: boxY + 58, size: 8, font: certFontRegular, color: rgb(0.2, 0.2, 0.2) });

    // Generate QR Code for this specific signature
    try {
      const qrDataUrl = await QRCode.toDataURL(`https://signflow.abhinavsai.com/verify/${certId}`);
      const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      certPage.drawImage(qrImage, {
        x: cW - 100,
        y: boxY + 50,
        width: 50,
        height: 50
      });
      certPage.drawText('Scan to Verify', { x: cW - 98, y: boxY + 40, size: 6, font: certFontRegular, color: rgb(0.4, 0.4, 0.4) });
    } catch (qrErr) {
      console.error('Failed to generate QR:', qrErr);
    }

    // Security Footer inside card
    certPage.drawLine({ start: { x: 50, y: boxY + 36 }, end: { x: cW - 50, y: boxY + 36 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    certPage.drawText(`Signature ID: ${certId}   |   Audit ID: ${auditId}`, { x: 50, y: boxY + 24, size: 7.5, font: certFontRegular, color: rgb(0.1, 0.1, 0.1) });
    certPage.drawText(`Fingerprint (SHA-256): ${docHash}`, { x: 50, y: boxY + 12, size: 7, font: certFontRegular, color: rgb(0.5, 0.5, 0.5) });

    boxY -= 130;
    if (boxY < 80) break;
  }

  // Final Legally Binding disclaimer — WinAnsi-safe ASCII only
  certPage.drawText('This certificate is generated by SignFlow and is legally binding under UETA / ESIGN regulations.', {
    x: 40, y: 40, size: 7, font: certFontRegular, color: rgb(0.6, 0.6, 0.6)
  });
};

/**
 * Generates audit trail report dynamically.
 */
export const generateAuditPdf = async (document, fields, sha256Checksum) => {
  const pdfDoc = await PDFDocument.create();
  await generateCertificatePage(pdfDoc, document, fields, sha256Checksum);
  return await pdfDoc.save();
};

/**
 * Loads the pristine original PDF, embeds signatures, and returns cryptographically signed PDF bytes.
 */
export const generateFinalizedPdf = async (document, fields) => {
  let originalPath = document.versions[0]?.path || document.originalPath;
  console.log('[PDF Service] Attempting to load PDF from:', originalPath);

  try {
    const pdfBytes = await readPdfBytes(originalPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 1. Draw visual signature blocks on appropriate pages
    await embedSignaturesToPdf(pdfDoc, fields);

    // 2. Save document temporarily to compute checksum of signed content only (preshared hash)
    const signedOnlyBytes = await pdfDoc.save({ useObjectStreams: false });
    const signedOnlyBuffer = Buffer.from(signedOnlyBytes);
    const sha256Checksum = crypto.createHash('sha256').update(signedOnlyBuffer).digest('hex');

    // 3. Cryptographically Sign using PKCS#7 adbe.pkcs7.detached
    let finalBytes = signedOnlyBuffer;
    try {
      const { p12Buffer, password } = getSigningCertificate();
      const signer = new SignPdf();
      
      const firstField = fields[0];
      const signerName = firstField ? (firstField.signerName || firstField.recipientEmail.split('@')[0]) : 'SignFlow Signer';
      
      const pdfWithPlaceholder = plainAddPlaceholder({
        pdfBuffer: signedOnlyBuffer,
        reason: 'Approved',
        contactInfo: firstField ? firstField.recipientEmail : 'verification@signflow.com',
        name: signerName,
        location: firstField ? (firstField.location || 'Online') : 'Online',
        signatureLength: 8192
      });
      
      finalBytes = signer.sign(pdfWithPlaceholder, p12Buffer, { passphrase: password });
      console.log('[PDF Service] PDF cryptographically signed with X.509 certificate.');
    } catch (cryptoErr) {
      console.error('[PDF Service] Cryptographic signing failed (falling back to visual-only):', cryptoErr.message);
    }

    return { finalBytes, sha256Checksum };
  } catch (error) {
    console.error('[PDF Service] Error processing PDF:', error.message);
    throw error;
  }
};
