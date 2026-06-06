import mongoose from 'mongoose';

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
}, { timestamps: true });

const DocumentRecipient = mongoose.model('DocumentRecipient', documentRecipientSchema);
export default DocumentRecipient;
