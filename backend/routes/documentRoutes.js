import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import Document from '../models/Document.js';
import DocumentRecipient from '../models/DocumentRecipient.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import SignatureField from '../models/SignatureField.js';
import Workspace from '../models/Workspace.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendInviteEmail,
  sendRejectionEmail,
  sendViewedEmail,
  sendShareLinkCreatedEmail,
  sendDocumentCancelledEmail,
  sendAuditReportGeneratedEmail
} from '../middleware/emailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { generateFinalizedPdf } from '../services/pdfService.js';
import { uploadFile, deleteFile, getSignedUrl, isR2Active } from '../services/r2Service.js';
import { readPdfBytes } from '../utils/fileLoader.js';
import { resolveStoragePath } from '../utils/storagePath.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Resolve frontend base URL from environment
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5177';

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

// Helper to check role-based access control (RBAC) on a document
const checkDocumentAccess = async (document, userId, action = 'read') => {
  if (document.ownerId.toString() === userId.toString()) {
    return true; // The owner always has full access
  }

  if (document.workspaceId) {
    const workspace = await Workspace.findById(document.workspaceId);
    if (!workspace) return false;

    const member = workspace.members.find(m => m.userId.toString() === userId.toString());
    if (!member) return false;

    if (action === 'read' || action === 'download') {
      return ['Owner', 'Admin', 'Member', 'Guest'].includes(member.role);
    }

    if (action === 'write' || action === 'settings' || action === 'manage') {
      return ['Owner', 'Admin', 'Member'].includes(member.role);
    }

    if (action === 'delete') {
      return ['Owner', 'Admin'].includes(member.role);
    }
  }

  return false;
};

// @route   POST /api/docs/upload
// @desc    Upload a new PDF document (optionally assigned to a Workspace)
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (req.file.size === 0) {
      return res.status(400).json({ message: 'Uploaded file is empty (0 bytes)', file: req.file });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.documentsCount >= user.documentLimit) {
      return res.status(403).json({ message: 'Monthly document upload limit reached. Please upgrade your plan!' });
    }

    let workspaceId = req.body.workspaceId;
    if (workspaceId && workspaceId !== 'personal' && workspaceId !== 'undefined' && workspaceId !== 'null') {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }
      const isMember = workspace.members.some(m => m.userId.toString() === req.user._id.toString());
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized to upload to this workspace' });
      }
    } else {
      workspaceId = undefined;
    }

    const pathString = req.file.path.replace(/\\/g, '/');
    const diskSize = fs.statSync(pathString).size;
    if (diskSize === 0) {
      return res.status(400).json({ message: 'Uploaded file is empty (0 bytes) on disk', path: pathString });
    }

    const targetPath = `uploads/${req.file.filename}`;

    // Upload to Cloudflare R2
    let fileUrl = targetPath;
    try {
      fileUrl = await uploadFile(pathString, req.file.originalname, req.file.mimetype);
      // Clean up the local file only if R2 is active (so we don't delete local fallback files)
      if (isR2Active() && fs.existsSync(pathString)) {
        fs.unlinkSync(pathString);
      }
    } catch (r2Err) {
      console.warn('[Upload] R2 upload failed, falling back to local file path:', r2Err.message);
    }

    const document = await Document.create({
      ownerId: req.user._id,
      filename: req.file.originalname,
      originalPath: targetPath,
      originalFileUrl: fileUrl,
      status: 'Pending',
      workspaceId,
      versions: [{
        versionNumber: 1,
        filename: req.file.originalname,
        path: targetPath,
      }]
    });

    user.documentsCount += 1;
    await user.save();

    await logAuditEvent(document._id, req.user._id, 'Upload', req);

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Upload server error', error: error.message });
  }
});

// @route   GET /api/docs
// @desc    List PDF documents for active workspace or personal context
router.get('/', protect, async (req, res) => {
  try {
    const { 
      search, 
      status, 
      archived = 'false', 
      sortBy = 'newest',
      page = 1,
      limit = 10,
      workspaceId
    } = req.query;

    const query = { 
      isDeleted: false,
      isTemplate: false // Reusable templates are listed separately
    };

    if (workspaceId && workspaceId !== 'personal') {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }
      const isMember = workspace.members.some(m => m.userId.toString() === req.user._id.toString());
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized to access this workspace documents' });
      }
      query.workspaceId = workspaceId;
    } else {
      query.ownerId = req.user._id;
      query.workspaceId = { $exists: false };
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by archived status
    query.isArchived = archived === 'true';

    // Search query by filename
    if (search) {
      query.filename = { $regex: search, $options: 'i' };
    }

    // Sorting parameters
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'alpha') {
      sortOptions = { filename: 1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const docsWithUrls = await Promise.allSettled(
      documents.map(async (doc) => {
        const plain = doc.toObject();
        if (isR2Active() && plain.originalFileUrl) {
          try {
            plain.originalFileUrl = await getSignedUrl(plain.originalFileUrl);
          } catch (err) {
            console.error(`[docs] Failed to sign URL for doc ${plain._id}:`, err.message);
            // Fall back to raw key so list still renders
          }
        }
        if (isR2Active() && plain.finalizedFileUrl) {
          try {
            plain.finalizedFileUrl = await getSignedUrl(plain.finalizedFileUrl);
          } catch (err) {
            console.error(`[docs] Failed to sign finalizedFileUrl for doc ${plain._id}:`, err.message);
          }
        }
        return plain;
      })
    );
    const resolvedDocs = docsWithUrls.map(result =>
      result.status === 'fulfilled' ? result.value : result.reason?.doc
    );

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      documents: resolvedDocs,
    });
  } catch (error) {
    res.status(500).json({ message: 'List documents failed', error: error.message });
  }
});

// @route   GET /api/docs/:id
// @desc    Get document details
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'read');
    if (!isAuthorized) {
      console.log(`DOC_FETCH_AUTH_FAIL: Forbidden for user ${req.user._id} on document ${document._id}`);
      return res.status(403).json({ message: 'Not authorized to view this document' });
    }

    await logAuditEvent(document._id, req.user._id, 'View', req);

    const plain = document.toObject();
    if (isR2Active() && plain.originalFileUrl) {
      try {
        plain.originalFileUrl = await getSignedUrl(plain.originalFileUrl);
      } catch (err) {
        console.error(`[docs/:id] Failed to sign originalFileUrl:`, err.message);
      }
    }
    if (isR2Active() && plain.finalizedFileUrl) {
      try {
        plain.finalizedFileUrl = await getSignedUrl(plain.finalizedFileUrl);
      } catch (err) {
        console.error(`[docs/:id] Failed to sign finalizedFileUrl:`, err.message);
      }
    }

    console.log(`DOC_FETCH_SUCCESS: ${plain._id}`);
    res.json(plain);
  } catch (error) {
    console.error(`DOC_FETCH_AUTH_FAIL: Error during fetch: ${error.message}`);
    res.status(500).json({ message: 'Fetch document error', error: error.message });
  }
});

// @route   GET /api/docs/:id/download
// @desc    Download the signed finalized PDF document file
router.get('/:id/download', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'download');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to download this document' });
    }

    let finalBytes;

    // FAST PATH: Stream the already-finalized PDF directly (avoids regenerating every time)
    if (document.finalizedFileUrl || document.finalizedPath) {
      console.log('[Download] Streaming finalizedPath:', document.finalizedFileUrl || document.finalizedPath);
      try {
        finalBytes = await readPdfBytes(document.finalizedFileUrl || document.finalizedPath);
      } catch (e) {
        console.warn('[Download] finalizedPath missing, will try originalPath:', e.message);
        // Fall through to regeneration
        finalBytes = null;
      }
    }

    // FALLBACK: Regenerate from original (or original path)
    if (!finalBytes) {
      const fields = await SignatureField.find({ documentId: document._id });
      const signedFields = fields.filter(f => f.status === 'Signed');

      if (signedFields.length > 0) {
        console.log('[Download] Regenerating finalized PDF with', signedFields.length, 'signed fields');
        try {
          const { finalBytes: compiledBytes } = await generateFinalizedPdf(document, signedFields);
          finalBytes = compiledBytes;
        } catch (genErr) {
          console.error('[Download] PDF regeneration failed:', genErr.message);
          return res.status(404).json({
            message: 'Finalized PDF not found on server. The file may have been lost after a deployment. Please re-finalize the document.',
            error: genErr.message
          });
        }
      } else {
        // No signed fields — serve original
        const originalPath = document.originalFileUrl || (document.versions?.[0]?.path) || document.originalPath;
        try {
          finalBytes = await readPdfBytes(originalPath);
        } catch (e) {
          return res.status(404).json({
            message: 'Original PDF not found on server. The file may have been lost after a deployment.',
            error: e.message
          });
        }
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.send(Buffer.from(finalBytes));

    await logAuditEvent(document._id, req.user._id, 'Download', req);
  } catch (error) {
    console.error('[Download] Unexpected error:', error.message);
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
});

// @route   GET /api/docs/:id/download-audit
// @desc    Download the audit trail certificate page dynamically as a separate PDF
router.get('/:id/download-audit', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'read');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access this document\'s audit logs' });
    }

    const fields = await SignatureField.find({ documentId: document._id });
    const signedFields = fields.filter(f => f.status === 'Signed');

    // Generate certificate page PDF
    const { generateAuditPdf } = await import('../services/pdfService.js');
    const auditBytes = await generateAuditPdf(document, signedFields, document.sha256Checksum || 'N/A');

    // Upload to S3 storage and record URL in DB
    if (isR2Active()) {
      try {
        const uploadsDir = resolveStoragePath();
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const tempFilename = `audit-report-${document._id}-${Date.now()}.pdf`;
        const tempPath = path.join(uploadsDir, tempFilename);
        fs.writeFileSync(tempPath, auditBytes);
        const auditUrl = await uploadFile(tempPath, tempFilename, 'application/pdf');
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        document.auditFileUrl = auditUrl;
        await document.save();
      } catch (uploadErr) {
        console.error('[Download Audit] Failed to upload audit PDF to S3:', uploadErr.message);
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-report-${document._id}.pdf"`);
    res.send(Buffer.from(auditBytes));

    await logAuditEvent(document._id, req.user._id, 'Download Audit Report', req);
  } catch (error) {
    console.error('[Download Audit] Failed:', error.message);
    res.status(500).json({ message: 'Failed to generate audit report PDF', error: error.message });
  }
});

// @route   GET /api/docs/:id/public-download
// @desc    Download the signed finalized PDF document file publicly
router.get('/:id/public-download', async (req, res) => {
  try {
    const { password } = req.query;
    const document = await Document.findById(req.params.id);
    if (!document || !document.sharingEnabled) {
      return res.status(404).json({ message: 'Shared document not found or sharing disabled' });
    }

    if (document.shareExpiresAt && new Date(document.shareExpiresAt) < new Date()) {
      return res.status(410).json({ message: 'This public shared link has expired' });
    }

    if (document.sharePassword && document.sharePassword !== password) {
      return res.status(401).json({ message: 'Password protection required to download' });
    }


    let finalBytes;

    // FAST PATH: stream already-finalized PDF
    if (document.finalizedFileUrl || document.finalizedPath) {
      try {
        finalBytes = await readPdfBytes(document.finalizedFileUrl || document.finalizedPath);
      } catch (e) {
        console.warn('[Public Download] finalizedPath missing, falling back:', e.message);
        finalBytes = null;
      }
    }

    // FALLBACK: regenerate from signed fields or serve original
    if (!finalBytes) {
      const fields = await SignatureField.find({ documentId: document._id });
      const signedFields = fields.filter(f => f.status === 'Signed');
      if (signedFields.length > 0) {
        try {
          const { finalBytes: compiled } = await generateFinalizedPdf(document, signedFields);
          finalBytes = compiled;
        } catch (genErr) {
          return res.status(404).json({
            message: 'Finalized PDF not found. Please re-finalize the document.',
            error: genErr.message
          });
        }
      } else {
        const originalPath = document.originalFileUrl || (document.versions?.[0]?.path) || document.originalPath;
        try {
          finalBytes = await readPdfBytes(originalPath);
        } catch (e) {
          return res.status(404).json({
            message: 'Original PDF not found on server.',
            error: e.message
          });
        }
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.send(Buffer.from(finalBytes));

    await logAuditEvent(document._id, null, 'Public Download', req);
  } catch (error) {
    console.error('[Public Download] Unexpected error:', error.message);
    res.status(500).json({ message: 'Public download failed', error: error.message });
  }
});

// @route   PUT /api/docs/:id/archive
// @desc    Toggle archive status
router.put('/:id/archive', protect, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'manage');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to archive this document' });
    }

    document.isArchived = !document.isArchived;
    await document.save();

    await logAuditEvent(document._id, req.user._id, 'Share', req);

    res.json({ message: `Document successfully ${document.isArchived ? 'archived' : 'unarchived'}`, document });
  } catch (error) {
    res.status(500).json({ message: 'Archive toggling failed', error: error.message });
  }
});

// @route   DELETE /api/docs/:id
// @desc    Soft delete document
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'delete');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    document.isDeleted = true;
    await document.save();

    await logAuditEvent(document._id, req.user._id, 'Delete', req);

    res.json({ message: 'Document soft deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Soft delete error', error: error.message });
  }
});

// @route   PUT /api/docs/:id/restore
// @desc    Restore soft deleted document
router.put('/:id/restore', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'delete');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to restore this document' });
    }

    document.isDeleted = false;
    await document.save();

    res.json({ message: 'Document restored successfully', document });
  } catch (error) {
    res.status(500).json({ message: 'Restore error', error: error.message });
  }
});

// @route   POST /api/docs/:id/version
// @desc    Upload a new version of the document
router.post('/:id/version', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No new file uploaded' });
    }

    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'write');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to add versions to this document' });
    }

    const pathString = req.file.path.replace(/\\/g, '/');
    const newVersionNumber = document.versions.length + 1;

    document.versions.push({
      versionNumber: newVersionNumber,
      filename: req.file.originalname,
      path: pathString,
    });
    
    document.originalPath = pathString;
    document.filename = req.file.originalname;
    
    await document.save();
    res.json({ message: 'New version added successfully', document });
  } catch (error) {
    res.status(500).json({ message: 'New version upload error', error: error.message });
  }
});

// @route   PUT /api/docs/:id/reject
// @desc    Reject a document with reason
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'read');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to reject this document' });
    }

    document.status = 'Rejected';
    document.set('rejectionReason', reason || '', { strict: false });
    await document.save();

    await logAuditEvent(document._id, req.user._id, 'Reject', req);

    const owner = await User.findById(document.ownerId);
    if (owner) {
      await sendRejectionEmail(owner.email, document.filename, req.user.name, reason);
    }

    res.json({ message: 'Document rejected successfully', document });
  } catch (error) {
    res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
});

// @route   PUT /api/docs/:id/cancel
// @desc    Cancel a document workflow and notify all pending recipients
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'settings');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to cancel this document' });
    }

    document.status = 'Archived';
    await document.save();

    await logAuditEvent(document._id, req.user._id, 'Cancel', req);

    // Notify all pending recipients that the document was cancelled
    const pendingRecipients = await DocumentRecipient.find({
      documentId: document._id,
      status: { $in: ['Waiting', 'Notified'] }
    });

    const cancelerName = req.user.name || 'Document Owner';
    for (const recipient of pendingRecipients) {
      sendDocumentCancelledEmail(recipient.email, recipient.name, document.filename, cancelerName)
        .catch(err => console.error('[Docs] Cancel email failed for', recipient.email, err.message));
    }

    res.json({ message: 'Document workflow cancelled successfully', document });
  } catch (error) {
    res.status(500).json({ message: 'Cancel failed', error: error.message });
  }
});

// @route   POST /api/docs/:id/viewed
// @desc    Mark document as first viewed by a signer and notify owner
router.post('/:id/viewed', async (req, res) => {
  try {
    const { signerEmail, signerName } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only update status if it's first view (still Pending)
    if (document.status === 'Pending') {
      document.status = 'Viewed';
      await document.save();

      // Notify the owner that a signer has viewed the document
      const owner = await User.findById(document.ownerId);
      if (owner) {
        const viewerEmail = signerEmail || 'Unknown Signer';
        sendViewedEmail(owner.email, owner.name, viewerEmail, document.filename)
          .catch(err => console.error('[Docs] Viewed email failed:', err.message));
      }
    }

    await logAuditEvent(document._id, null, 'View', req);
    res.json({ message: 'Document view recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record view', error: error.message });
  }
});

// @route   POST /api/docs/:id/audit/export
// @desc    Export audit log for a document and email it to the user
// DEMO FEATURE - Student Project
router.post('/:id/audit/export', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'read');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to export audit logs' });
    }

    const reportUrl = `${FRONTEND_URL}/documents/${document._id}/audit-trail`;
    
    await sendAuditReportGeneratedEmail(req.user.email, req.user.name, document.filename, reportUrl);

    await logAuditEvent(document._id, req.user._id, 'Export Audit Trail', req);

    res.json({ message: 'Audit report generated and email sent successfully', reportUrl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate audit report', error: error.message });
  }
});

// @route   GET /api/docs/:id/recipients
// @desc    Get all recipients for a document
router.get('/:id/recipients', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'read');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to access recipients details' });
    }

    const recipients = await DocumentRecipient.find({ documentId: req.params.id }).sort({ sequence: 1 });
    res.json(recipients);
  } catch (error) {
    res.status(500).json({ message: 'Fetch recipients failed', error: error.message });
  }
});

// @route   POST /api/docs/:id/recipients
// @desc    Add a recipient to a document
router.post('/:id/recipients', protect, async (req, res) => {
  try {
    const { name, email, role, sequence } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'write');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to add recipients to this document' });
    }

    const recipient = await DocumentRecipient.create({
      documentId: req.params.id,
      name,
      email,
      role: role || 'Signer',
      sequence: sequence !== undefined ? sequence : 1,
      status: 'Waiting'
    });

    console.log("RECIPIENT_CREATED:", recipient._id);
    console.log("RECIPIENT_EMAIL_FOUND:", recipient.email);
    console.log("TOKEN_CREATED:", recipient.token);

    const signingUrl = `${FRONTEND_URL}/share/${req.params.id}?token=${recipient.token}`;
    console.log("SHARE_URL_CREATED:", signingUrl);
    
    let shouldSendEmail = true;
    if (document.signingOrder === 'Sequential' && recipient.role === 'Signer') {
      const existingRecipients = await DocumentRecipient.find({ 
        documentId: req.params.id, 
        _id: { $ne: recipient._id },
        role: 'Signer'
      });
      
      if (existingRecipients.length > 0) {
        const lowerSequencePending = existingRecipients.some(r => r.sequence < recipient.sequence && r.status !== 'Signed');
        if (lowerSequencePending) {
          shouldSendEmail = false;
        }
      }
    }

    if (shouldSendEmail && recipient.role === 'Signer') {
      recipient.status = 'Notified';
      await recipient.save();
      console.log("EMAIL_TRIGGERED:", recipient.email);
      console.log("EMAIL_QUEUED:", recipient.email);
      
      try {
        const senderName = req.user?.name || 'A user';
        const expiryDate = document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : 'N/A';
        
        await sendInviteEmail(recipient.email, recipient.name, document.filename, signingUrl, senderName, expiryDate);
        console.log("EMAIL_SENT:", recipient.email);
      } catch (emailErr) {
        console.error("EMAIL_SEND_FAILED for recipient:", recipient.email, emailErr.message);
      }
    }

    res.status(201).json(recipient);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add recipient', error: error.message });
  }
});

// @route   PUT /api/docs/:id/recipients/:recipientId
// @desc    Update a recipient details or status
router.put('/:id/recipients/:recipientId', protect, async (req, res) => {
  try {
    const { name, email, role, sequence, status } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'write');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to modify recipients' });
    }

    const recipient = await DocumentRecipient.findOne({ _id: req.params.recipientId, documentId: req.params.id });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (name !== undefined) recipient.name = name;
    if (email !== undefined) recipient.email = email;
    if (role !== undefined) recipient.role = role;
    if (sequence !== undefined) recipient.sequence = sequence;
    if (status !== undefined) recipient.status = status;

    await recipient.save();
    res.json(recipient);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update recipient', error: error.message });
  }
});

// @route   DELETE /api/docs/:id/recipients/:recipientId
// @desc    Delete a recipient from a document
router.delete('/:id/recipients/:recipientId', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'write');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to delete recipients' });
    }

    const recipient = await DocumentRecipient.findOneAndDelete({ _id: req.params.recipientId, documentId: req.params.id });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    res.json({ message: 'Recipient removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete recipient', error: error.message });
  }
});

// @route   PUT /api/docs/:id/settings
// @desc    Update document workflow settings
router.put('/:id/settings', protect, async (req, res) => {
  try {
    const { signingOrder, remindersEnabled, reminderInterval, expiresAt } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'settings');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to modify settings' });
    }

    if (signingOrder !== undefined) document.signingOrder = signingOrder;
    if (remindersEnabled !== undefined) document.remindersEnabled = remindersEnabled;
    if (reminderInterval !== undefined) document.reminderInterval = reminderInterval;
    if (expiresAt !== undefined) document.expiresAt = expiresAt;

    await document.save();
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
});

// @route   PUT /api/docs/:id/share
// @desc    Enable public link sharing and set parameters
router.put('/:id/share', protect, async (req, res) => {
  try {
    const { sharingEnabled, sharePassword, shareExpiresAt, shareOneTimeOnly } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'settings');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to configure sharing parameters' });
    }

    if (sharingEnabled !== undefined) document.sharingEnabled = sharingEnabled;
    if (sharePassword !== undefined) document.sharePassword = sharePassword;
    if (shareExpiresAt !== undefined) document.shareExpiresAt = shareExpiresAt;
    if (shareOneTimeOnly !== undefined) {
      document.shareOneTimeOnly = shareOneTimeOnly;
      if (shareOneTimeOnly) document.shareVisited = false;
    }

    await document.save();

    const publicUrl = `${FRONTEND_URL}/share/${document._id}`;
    console.log("SHARE_LINK_CREATED:", document._id, publicUrl);

    // Trigger share link created email when sharing is newly enabled
    if (sharingEnabled === true && !document.sharingEnabled) {
      const owner = await User.findById(document.ownerId);
      if (owner) {
        sendShareLinkCreatedEmail(owner.email, document.filename, publicUrl, owner.name)
          .catch(err => console.error('[Docs] Share link email failed:', err.message));
      }
    }

    res.json({ document, publicUrl });
  } catch (error) {
    res.status(500).json({ message: 'Failed to configure sharing', error: error.message });
  }
});

// @route   POST /api/docs/:id/public-verify
// @desc    Verify password for public shared link access
router.post('/:id/public-verify', async (req, res) => {
  try {
    const { password } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document || !document.sharingEnabled) {
      return res.status(404).json({ message: 'Shared document not found or sharing disabled' });
    }

    if (document.shareExpiresAt && new Date(document.shareExpiresAt) < new Date()) {
      return res.status(410).json({ message: 'This public shared link has expired' });
    }

    if (document.shareOneTimeOnly && document.shareVisited) {
      return res.status(410).json({ message: 'This is a one-time link and has already been accessed' });
    }

    if (document.sharePassword && document.sharePassword !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({ message: 'Password verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Verification error', error: error.message });
  }
});

// @route   GET /api/docs/:id/public
// @desc    Access document details publicly via link
router.get('/:id/public', async (req, res) => {
  try {
    const { password } = req.query;
    const document = await Document.findById(req.params.id);
    if (!document || !document.sharingEnabled) {
      return res.status(404).json({ message: 'Shared document not found or sharing disabled' });
    }

    console.log("SHARE_LINK_OPENED:", document._id);

    if (document.shareExpiresAt && new Date(document.shareExpiresAt) < new Date()) {
      return res.status(410).json({ message: 'This public shared link has expired' });
    }

    if (document.shareOneTimeOnly && document.shareVisited) {
      return res.status(410).json({ message: 'This is a one-time link and has already been accessed' });
    }

    if (document.sharePassword && document.sharePassword !== password) {
      return res.status(401).json({ message: 'Password protection required' });
    }

    if (document.shareOneTimeOnly) {
      document.shareVisited = true;
      await document.save();
    }

    await logAuditEvent(document._id, null, 'View', req);

    const fields = await SignatureField.find({ documentId: document._id });
    const recipients = await DocumentRecipient.find({ documentId: document._id });
    const auditLogs = await AuditLog.find({ documentId: document._id }).populate('userId').sort({ createdAt: -1 });

    res.json({
      _id: document._id,
      filename: document.filename,
      originalPath: document.originalPath,
      status: document.status,
      createdAt: document.createdAt,
      sha256Checksum: document.sha256Checksum,
      signatureFields: fields,
      recipients,
      auditLogs
    });
  } catch (error) {
    res.status(500).json({ message: 'Public access error', error: error.message });
  }
});

// @route   PATCH /api/docs/:id/layout
// @desc    Autosave signature fields layout
router.patch('/:id/layout', protect, async (req, res) => {
  try {
    const { fields } = req.body;
    const documentId = req.params.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'write');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to save layout details' });
    }

    const fieldIds = fields.filter(f => f._id).map(f => f._id);
    await SignatureField.deleteMany({ documentId, _id: { $nin: fieldIds } });

    const savedFields = [];
    for (const f of fields) {
      if (f._id) {
        const existing = await SignatureField.findById(f._id);
        if (existing) {
          const updated = await SignatureField.findByIdAndUpdate(f._id, {
            xPercent: f.xPercent,
            yPercent: f.yPercent,
            widthPercent: f.widthPercent,
            heightPercent: f.heightPercent,
            recipientEmail: f.recipientEmail,
            type: f.type,
            page: f.page,
            status: f.status || 'Pending',
            value: f.value
          }, { returnDocument: 'after' });
          if (updated) savedFields.push(updated);
        } else {
          const created = await SignatureField.create({
            _id: f._id,
            documentId,
            xPercent: f.xPercent,
            yPercent: f.yPercent,
            widthPercent: f.widthPercent,
            heightPercent: f.heightPercent,
            recipientEmail: f.recipientEmail,
            type: f.type,
            page: f.page,
            status: f.status || 'Pending',
            value: f.value
          });
          savedFields.push(created);
        }
      } else {
        const created = await SignatureField.create({
          documentId,
          xPercent: f.xPercent,
          yPercent: f.yPercent,
          widthPercent: f.widthPercent,
          heightPercent: f.heightPercent,
          recipientEmail: f.recipientEmail,
          type: f.type,
          page: f.page,
          status: 'Pending'
        });
        savedFields.push(created);
      }
    }

    res.json({ message: 'Layout saved successfully', fields: savedFields });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save layout', error: error.message });
  }
});

// ==========================================
// TEAM SHARED TEMPLATES (PHASE N)
// ==========================================

// @route   POST /api/docs/:id/template
// @desc    Convert/save a document as a reusable team template
router.post('/:id/template', protect, async (req, res) => {
  try {
    const { templateName } = req.body;
    if (!templateName) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    const document = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAuthorized = await checkDocumentAccess(document, req.user._id, 'settings');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to convert this document to a template' });
    }

    document.isTemplate = true;
    document.templateName = templateName;
    await document.save();

    res.json({ message: 'Document successfully converted to template', document });
  } catch (error) {
    res.status(500).json({ message: 'Failed to convert to template', error: error.message });
  }
});

// @route   GET /api/docs/templates
// @desc    Get all reusable templates (user's templates + workspace templates)
router.get('/templates', protect, async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const query = { isDeleted: false, isTemplate: true };

    if (workspaceId && workspaceId !== 'personal') {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }
      const isMember = workspace.members.some(m => m.userId.toString() === req.user._id.toString());
      if (!isMember) {
        return res.status(403).json({ message: 'Not authorized to access templates in this workspace' });
      }
      query.workspaceId = workspaceId;
    } else {
      query.ownerId = req.user._id;
      query.workspaceId = { $exists: false };
    }

    const templates = await Document.find(query).sort({ updatedAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
});

// @route   POST /api/docs/templates/:templateId/use
// @desc    Create a new document from a template (cloning PDF and signature fields)
router.post('/templates/:templateId/use', protect, async (req, res) => {
  try {
    const template = await Document.findOne({ _id: req.params.templateId, isTemplate: true, isDeleted: false });
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const isAuthorized = await checkDocumentAccess(template, req.user._id, 'read');
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to use this template' });
    }

    // Check user limit
    const user = await User.findById(req.user._id);
    if (user.documentsCount >= user.documentLimit) {
      return res.status(403).json({ message: 'Monthly document limit reached. Please upgrade your plan!' });
    }

    // Clone PDF file on disk
    const originalExt = template.filename.split('.').pop() || 'pdf';
    const newFilename = `Cloned_${template.templateName.replace(/\s+/g, '_') || 'Doc'}_${Date.now()}.${originalExt}`;
    const newPath = `uploads/${newFilename}`;
    
    fs.copyFileSync(template.originalPath, newPath);

    // Create new document
    const newDoc = await Document.create({
      ownerId: req.user._id,
      filename: template.filename,
      originalPath: newPath,
      status: 'Pending',
      workspaceId: template.workspaceId,
      signingOrder: template.signingOrder,
      versions: [{
        versionNumber: 1,
        filename: template.filename,
        path: newPath
      }]
    });

    // Clone recipients
    const oldRecipients = await DocumentRecipient.find({ documentId: template._id });
    for (const rec of oldRecipients) {
      await DocumentRecipient.create({
        documentId: newDoc._id,
        name: rec.name,
        email: rec.email,
        role: rec.role,
        sequence: rec.sequence,
        status: 'Waiting'
      });
    }

    // Clone signature fields
    const oldFields = await SignatureField.find({ documentId: template._id });
    for (const f of oldFields) {
      await SignatureField.create({
        documentId: newDoc._id,
        recipientEmail: f.recipientEmail,
        type: f.type,
        xPercent: f.xPercent,
        yPercent: f.yPercent,
        widthPercent: f.widthPercent,
        heightPercent: f.heightPercent,
        page: f.page,
        status: 'Pending'
      });
    }

    user.documentsCount += 1;
    await user.save();

    await logAuditEvent(newDoc._id, req.user._id, 'Upload', req);

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create document from template', error: error.message });
  }
});

export default router;
