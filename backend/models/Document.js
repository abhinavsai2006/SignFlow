import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalPath: {
    type: String,
    required: true,
  },
  finalizedPath: {
    type: String,
    default: null,
  },
  originalFileUrl: {
    type: String,
    default: null,
  },
  finalizedFileUrl: {
    type: String,
    default: null,
  },
  auditFileUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Viewed', 'PartiallySigned', 'Signed', 'Rejected', 'Expired', 'Archived'],
    default: 'Pending',
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  sharingEnabled: {
    type: Boolean,
    default: false,
  },
  sharePassword: {
    type: String,
    default: '',
  },
  shareExpiresAt: {
    type: Date,
  },
  shareOneTimeOnly: {
    type: Boolean,
    default: false,
  },
  shareVisited: {
    type: Boolean,
    default: false,
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
  },
  versions: [{
    versionNumber: { type: Number, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  rejectionReason: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date
  },
  remindersEnabled: {
    type: Boolean,
    default: false
  },
  reminderInterval: {
    type: Number,
    default: 3 // in days
  },
  signingOrder: {
    type: String,
    enum: ['Parallel', 'Sequential'],
    default: 'Parallel'
  },
  sha256Checksum: {
    type: String,
    default: null
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: {
    type: String,
    default: ''
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  expiredEmailSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
