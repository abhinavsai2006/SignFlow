import mongoose from 'mongoose';

const signatureFieldSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  signerName: {
    type: String
  },
  type: {
    type: String,
    enum: ['Signature', 'Initials', 'Date', 'Text', 'Checkbox'],
    required: true,
    default: 'Signature',
  },
  xPercent: {
    type: Number,
    required: true,
  },
  yPercent: {
    type: Number,
    required: true,
  },
  widthPercent: {
    type: Number,
    required: true,
    default: 15,
  },
  heightPercent: {
    type: Number,
    required: true,
    default: 5,
  },
  page: {
    type: Number,
    required: true,
    default: 1,
  },
  status: {
    type: String,
    enum: ['Pending', 'Signed'],
    default: 'Pending',
  },
  value: {
    type: String, // Base64 signature image, typed text, Date string, custom text, or 'true'/'false' for checkbox
  },
  ipAddress: {
    type: String,
    default: 'Unavailable'
  },
  userAgent: {
    type: String,
    default: 'Unavailable'
  },
  certificateId: {
    type: String
  },
  auditId: {
    type: String
  },
  browser: {
    type: String
  },
  device: {
    type: String
  },
  operatingSystem: {
    type: String
  },
  location: {
    type: String,
    default: 'Unavailable'
  },
  isp: {
    type: String
  },
  documentHash: {
    type: String
  },
  tamperStatus: {
    type: String,
    default: 'Verified'
  }
}, { timestamps: true });

const SignatureField = mongoose.model('SignatureField', signatureFieldSchema);
export default SignatureField;
