import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import Document from '../models/Document.js';
import { protect } from '../middleware/authMiddleware.js';
import path from 'path';

const router = express.Router();

// @route   POST /api/docs/upload
// @desc    Upload a PDF document
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = await Document.create({
      ownerId: req.user._id,
      filename: req.file.originalname,
      originalPath: req.file.path.replace(/\\/g, '/'), // normalize path for windows
      status: 'Pending',
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/docs/
// @desc    Get all documents for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const documents = await Document.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/docs/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    // Make sure user owns the document (or we handle sharing logic later)
    if (document.ownerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this document' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
