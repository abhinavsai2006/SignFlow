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
  status: {
    type: String,
    enum: ['Pending', 'Signed', 'Rejected'],
    default: 'Pending',
  },
}, { timestamps: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
