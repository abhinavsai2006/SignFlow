import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
    // Core tracked events: Upload, View, Download, Share, Sign, Reject, Delete, Finalize, Verify
    // Also accepts dynamic events like: "Public Sign by email@domain.com", "Reminder Sent", etc.
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
  userAgent: {
    type: String,
    default: 'Unknown Browser',
  },
  device: {
    type: String,
    default: 'Desktop',
  },
  country: {
    type: String,
    default: 'Localhost',
  },
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
