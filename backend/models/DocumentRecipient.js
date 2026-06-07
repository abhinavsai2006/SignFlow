import mongoose from 'mongoose';
import crypto from 'crypto';

const documentRecipientSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Signer', 'Viewer'],
    default: 'Signer',
  },
  status: {
    type: String,
    enum: ['Waiting', 'Notified', 'Signed', 'Rejected'],
    default: 'Waiting',
  },
  sequence: {
    type: Number,
    default: 1,
  },
  token: {
    type: String,
    default: () => crypto.randomBytes(16).toString('hex'),
  },
  recipientOtp: {
    type: String,
  },
  recipientOtpExpire: {
    type: Date,
  },
  inviteEmailSent: {
    type: Boolean,
    default: false,
  },
  inviteEmailSentAt: {
    type: Date,
  },
  inviteEmailStatus: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed', 'None'],
    default: 'None',
  },
}, { timestamps: true });

const DocumentRecipient = mongoose.model('DocumentRecipient', documentRecipientSchema);
export default DocumentRecipient;
