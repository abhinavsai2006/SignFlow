import type { FormEvent } from 'react';
import { FileText } from 'lucide-react';
import type { DocumentData } from '../../hooks/useShareDocument';

interface RecipientVerificationProps {
  docData: DocumentData | null;
  signerEmail: string;
  setSignerEmail: (val: string) => void;
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
  verificationStep,
  otpCode,
  setOtpCode,
  isSendingOtp,
  identityError,
  handleEmailSubmit,
  handleOtpSubmit,
  handleResetVerification
}: RecipientVerificationProps) {
  return (
    <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md min-w-[280px] sm:min-w-[400px] bg-surface-soft border border-hairline-soft rounded-2xl p-8 shadow-2xl space-y-6 flex flex-col">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-lg font-bold text-ink-deep truncate max-w-[240px]">{docData?.filename}</h1>
            <p className="text-slate text-xs">Recipient Identity Verification</p>
          </div>
        </div>
        <div className="border-t border-hairline-soft" />

        {verificationStep === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <p className="text-xs text-slate font-medium">
              Please enter your email address as listed in the invitation to request a verification OTP code.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate mb-1">Your Email Address <span className="text-red-400">*</span></label>
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
              className="w-full bg-primary hover:bg-primary-hover text-ink-deep font-bold py-3 rounded-xl transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSendingOtp ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
              A 6-digit verification code has been sent to <strong>{signerEmail}</strong>.
            </div>
            <div>
              <label className="block text-xs font-bold text-slate mb-1">Enter Verification Code <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="e.g. 123456"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                className="w-full bg-white/5 border border-hairline-soft rounded-xl px-4 py-3 text-center text-lg font-mono font-bold text-ink-deep placeholder-slate-500 focus:outline-none focus:border-blue-500 transition tracking-widest"
                required
              />
            </div>
            {identityError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3">{identityError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResetVerification}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate border border-hairline-soft font-bold py-3 rounded-xl transition cursor-pointer"
              >
                Change Email
              </button>
              <button
                type="submit"
                disabled={isSendingOtp}
                className="flex-1 bg-primary hover:bg-primary-hover text-ink-deep font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSendingOtp ? 'Verifying...' : 'Verify OTP & Enter'}
              </button>
            </div>
          </form>
        )}
        <p className="text-slate-600 text-[10px] text-center">Your identity is cryptographically signed and audited via Resend & MongoDB.</p>
      </div>
    </div>
  );
}
