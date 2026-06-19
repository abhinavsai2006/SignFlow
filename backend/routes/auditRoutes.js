import express from 'express';
import AuditLog from '../models/AuditLog.js';
import Document from '../models/Document.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/audit/:docId
// @desc    Get all audit log timelines for a document
router.get('/:docId', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Verify ownership
    if (document.ownerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this document\'s audit logs' });
    }

    const logs = await AuditLog.find({ documentId: req.params.docId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve audit timeline logs', error: error.message });
  }
});

export default router;
