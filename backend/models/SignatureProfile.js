import mongoose from 'mongoose';

const signatureProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['draw', 'type', 'upload'],
    required: true,
  },
  imageData: {
    type: String, // Base64 PNG/JPG data
    required: true,
  },
  fontName: {
    type: String,
  },
  color: {
    type: String,
    enum: ['black', 'darkgray', 'navy'],
    default: 'black',
  },
}, { timestamps: true });

const SignatureProfile = mongoose.model('SignatureProfile', signatureProfileSchema);
export default SignatureProfile;
