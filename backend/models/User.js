import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  signatureProfile: {
    text: { type: String, default: '' },
    drawing: { type: String, default: '' },
    initials: { type: String, default: '' },
    stamp: { type: String, default: '' },
  },
  plan: {
    type: String,
    enum: ['Free', 'Pro', 'Business', 'Enterprise'],
    default: 'Free'
  },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  documentLimit: {
    type: Number,
    default: 5 // Free users get 5 docs limit
  },
  documentsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
