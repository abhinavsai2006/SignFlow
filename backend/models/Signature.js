import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
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
  signatureType: {
    type: String,
    enum: ['text', 'drawing'],
    default: 'text',
  },
  signatureValue: {
    type: String, // Typed text or drawn SVG path
  },
}, { timestamps: true });

const Signature = mongoose.model('Signature', signatureSchema);
export default Signature;
