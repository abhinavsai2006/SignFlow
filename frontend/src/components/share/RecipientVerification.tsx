import type { FormEvent } from 'react';
import { FileText, User } from 'lucide-react';
import type { DocumentData } from '../../hooks/useShareDocument';

interface RecipientVerificationProps {
  docData: DocumentData | null;
  signerEmail: string;
  setSignerEmail: (val: string) => void;
  signerName: string;
  setSignerName: (val: string) => void;
  verificationStep: 'email' | 'otp';
  otpCode: string;
  setOtpCode: (val: string) => void;
  isSendingOtp: boolean;
  identityError: string;
  handleEmailSubmit: (e: FormEvent) => void;
  handleOtpSubmit: (e: FormEvent) => void;
  handleResetVerification: () => void;
}

export function RecipientVerification({
  docData,
  signerEmail,
  setSignerEmail,
  signerName,
  setSignerName,
  verificationStep,
  otpCode,
  setOtpCode,
  isSendingOtp,
  identityError,
  handleEmailSubmit,
  handleOtpSubmit,
  handleResetVerification,
}: RecipientVerificationProps) {
  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-4">
      <div style={{ width: '100%', maxWidth: '440px' }} className="bg-surface-soft border border-hairline-soft rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ink-deep truncate">{docData?.filename || 'Document'}</h1>
            <p className="text-slate text-xs">Recipient Identity Verification</p>
          </div>
        </div>
        <div className="border-t border-hairline-soft" />

        {verificationStep === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <p className="text-xs text-slate font-medium">
              Enter your details to request a verification code sent to your email.
            </p>

            {/* Name field */}
            <div>
              <label className="block text-xs font-bold text-slate mb-1">
                Your Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  className="w-full bg-white/5 border border-hairline-soft rounded-xl pl-9 pr-4 py-3 text-ink-deep placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label className="block text-xs font-bold text-slate mb-1">
                Your Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. signer@example.com"
                value={signerEmail}
                onChange={e => setSignerEmail(e.target.value)}
                className="w-full bg-white/5 border border-hairline-soft rounded-xl px-4 py-3 text-ink-deep placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            {identityError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3">{identityError}</p>
            )}

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingOtp ? 'Sending OTP…' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
              A 6-digit verification code has been sent to <strong>{signerEmail}</strong>.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate mb-1">
                Verification Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-hairline-soft rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold text-ink-deep placeholder-slate-400 focus:outline-none focus:border-blue-500 transition tracking-[0.5em]"
                required
                autoFocus
              />
            </div>

            {identityError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3">{identityError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResetVerification}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate border border-hairline-soft font-bold py-3 rounded-xl transition"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={isSendingOtp}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingOtp ? 'Verifying…' : 'Verify & Enter'}
              </button>
            </div>
          </form>
        )}

        <p className="text-slate-500 text-[10px] text-center">
          Secured and audited via SignFlow cryptographic signature verification.
        </p>
      </div>
    </div>
  );
}
