import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    default: 'Resend',
  },
  providerResponse: {
    type: String,
  },
  messageId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Failed'],
    default: 'Sent',
  },
  errorMessage: {
    type: String,
  },
}, { timestamps: true });

const EmailLog = mongoose.model('EmailLog', emailLogSchema);
export default EmailLog;
