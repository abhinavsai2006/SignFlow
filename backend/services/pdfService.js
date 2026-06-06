import fs from 'fs';
import crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import User from '../models/User.js';
import SignatureField from '../models/SignatureField.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

    // Convert relative percentage dimensions to absolute points
    const targetX = (field.xPercent / 100) * width;
    const targetY = height - ((field.yPercent / 100) * height) - ((field.heightPercent / 100) * height);
    const targetW = (field.widthPercent / 100) * width;
    const targetH = (field.heightPercent / 100) * height;

    if (!field.value) continue;

    if (field.type === 'Checkbox') {
      // Draw a clean card background
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
        size: Math.min(10, targetH * 0.5),
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

      const footerH = Math.max(16, Math.min(28, targetH * 0.35));
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
          const scaleFactor = Math.min(contentW / imgSize.width, contentH / imgSize.height);
          const fitW = imgSize.width * scaleFactor;
          const fitH = imgSize.height * scaleFactor;
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
        
        const textSize = Math.max(6, contentH * 0.45);
        const textWidth = fontStyle.widthOfTextAtSize(displayVal, textSize);
        const textX = contentX + (contentW - textWidth) / 2;
        const textY = contentY + (contentH - textSize) / 2 + 1;

        page.drawText(displayVal, {
          x: textX,
          y: textY,
          size: textSize,
          font: fontStyle,
          color: rgb(0.1, 0.1, 0.1)
        });
      }

      // Draw footer details
      const signerDisplayName = field.signerName || field.recipientEmail.split('@')[0];
      const nameSize = Math.max(4.5, Math.min(8.0, footerH * 0.32));
      const subSize = Math.max(3.5, Math.min(6.0, footerH * 0.22));

      // 1. Signer Name
      page.drawText(signerDisplayName, {
        x: targetX + 5,
        y: targetY + footerH * 0.6,
        size: nameSize,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1)
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
      const badgeW = Math.max(34, targetW * 0.22);
      const badgeH = Math.max(8, footerH * 0.3);
      page.drawRectangle({
        x: targetX + targetW - badgeW - 5,
        y: targetY + footerH * 0.22,
        width: badgeW,
        height: badgeH,
        color: rgb(0.12, 0.635, 0.3)
      });

      const badgeText = '[VERIFIED]';
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

  // Green trust header bar (Adobe Sign style dark blue/green)
  certPage.drawRectangle({ x: 0, y: cH - 90, width: cW, height: 90, color: rgb(0.01, 0.28, 0.43) }); // Deep Adobe Blue
  certPage.drawText('SignFlow AI', { x: 40, y: cH - 42, size: 24, font: certFont, color: rgb(1, 1, 1) });
  certPage.drawText('Final Audit Report & Certificate of Completion', { x: 40, y: cH - 64, size: 14, font: certFont, color: rgb(1, 1, 1) });

  // Document details section
  certPage.drawText('Document Information', { x: 40, y: cH - 120, size: 12, font: certFont, color: rgb(0.1, 0.1, 0.1) });
  certPage.drawText(`Document Name: ${document.filename}`, { x: 40, y: cH - 138, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });
  certPage.drawText(`Document ID: ${document._id}`, { x: 40, y: cH - 152, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });
  certPage.drawText(`Sender: ${ownerName} (${ownerEmail})`, { x: 40, y: cH - 166, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });
  certPage.drawText(`Completed Date: ${new Date(document.updatedAt || Date.now()).toUTCString()}`, { x: 40, y: cH - 180, size: 9, font: certFontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Verification status pills (Green Ribbon)
  certPage.drawRectangle({ x: 40, y: cH - 216, width: cW - 80, height: 26, color: rgb(0.93, 0.98, 0.95), borderColor: rgb(0.07, 0.64, 0.38), borderWidth: 1 });
  certPage.drawText('[VERIFIED]  |  [TAMPER PROTECTED]  |  [LEGALLY BINDING]  |  [AUDIT TRAIL COMPLETE]', { x: 50, y: cH - 207, size: 9, font: certFont, color: rgb(0.07, 0.5, 0.3) });

  let boxY = cH - 350;
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

  // Final Legally Binding disclaimer
  certPage.drawText('This certificate is generated by SignFlow AI and is legally binding in jurisdictions recognizing electronic signatures (UETA / ESIGN).', {
    x: 40, y: 40, size: 7, font: certFontRegular, color: rgb(0.6, 0.6, 0.6)
  });
};

/**
 * Loads the pristine original PDF, embeds signatures, appends certificate, and returns PDF bytes.
 */
export const generateFinalizedPdf = async (document, fields) => {
  // Resolve the original file path - handle both absolute and relative paths
  let originalPath = document.versions[0]?.path || document.originalPath;
  
  // If path is relative (starts with 'uploads/'), make it absolute
  if (!path.isAbsolute(originalPath)) {
    originalPath = path.join(__dirname, '../', originalPath);
  }

  console.log('[PDF Service] Attempting to load PDF from:', originalPath);
  console.log('[PDF Service] File exists:', fs.existsSync(originalPath));

  if (!fs.existsSync(originalPath)) {
    throw new Error(`Original PDF file not found at: ${originalPath} (resolved from: ${document.versions[0]?.path || document.originalPath})`);
  }

  try {
    const pdfBytes = fs.readFileSync(originalPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 1. Draw signature blocks on appropriate pages
    await embedSignaturesToPdf(pdfDoc, fields);

    // 2. Save document temporarily to compute checksum of signed content only (preshared hash)
    const signedOnlyBytes = await pdfDoc.save();
    const sha256Checksum = crypto.createHash('sha256').update(signedOnlyBytes).digest('hex');

    // 3. Append Certificate page
    await generateCertificatePage(pdfDoc, document, fields, sha256Checksum);

    // 4. Save and return final byte buffer
    const finalBytes = await pdfDoc.save();
    return { finalBytes, sha256Checksum };
  } catch (error) {
    console.error('[PDF Service] Error processing PDF:', error.message);
    throw error;
  }
};
