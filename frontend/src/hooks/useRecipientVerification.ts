import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { decodeToken } from '../utils/shareUtils';
import { normalizeEmail } from '../utils/emailUtils';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

export function useRecipientVerification(id: string | undefined) {
  const [searchParams] = useSearchParams();
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [identityError, setIdentityError] = useState('');
  const [recipientToken, setRecipientToken] = useState<string>(() => localStorage.getItem(`recipientToken_${id}`) || '');
  const [verificationStep, setVerificationStep] = useState<'email' | 'otp'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    if (recipientToken) {
      const decoded = decodeToken(recipientToken);
      if (decoded && decoded.email) {
        setSignerEmail(normalizeEmail(decoded.email));
        setSignerName(decoded.name || '');
        setIdentityConfirmed(true);
      } else {
        localStorage.removeItem(`recipientToken_${id}`);
        setRecipientToken('');
        setVerificationStep('email');
      }
    }
  }, [recipientToken, id]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(signerEmail);
    if (!normalizedEmail) {
      setIdentityError('Email is required to identify you as a signer.');
      return;
    }
    const token = searchParams.get('token') || '';
    if (!token) {
      setIdentityError('Security Check Failed: Invitation token is missing from the link.');
      return;
    }

    setIsSendingOtp(true);
    setIdentityError('');
    try {
      await axios.post(`${BASE_URL}/api/docs/${id}/verify-recipient`, {
        token,
        email: normalizedEmail
      });
      setVerificationStep('otp');
    } catch (err: any) {
      setIdentityError(err.response?.data?.message || 'Failed to verify recipient email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setIdentityError('OTP code is required.');
      return;
    }
    const token = searchParams.get('token') || '';
    if (!token) {
      setIdentityError('Security Check Failed: Invitation token is missing from the link.');
      return;
    }

    setIsSendingOtp(true);
    setIdentityError('');
    try {
      const response = await axios.post(`${BASE_URL}/api/docs/${id}/verify-recipient-otp`, {
        token,
        email: normalizeEmail(signerEmail),
        otp: otpCode.trim()
      });
      
      const { recipientToken: rToken, signerName: verifiedName, signerEmail: verifiedEmail } = response.data;
      localStorage.setItem(`recipientToken_${id}`, rToken);
      setRecipientToken(rToken);
      setSignerEmail(normalizeEmail(verifiedEmail));
      setSignerName(verifiedName || '');
      setIdentityConfirmed(true);
    } catch (err: any) {
      setIdentityError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetVerification = () => {
    setVerificationStep('email');
    setOtpCode('');
    setIdentityError('');
  };

  return {
    signerEmail,
    setSignerEmail,
    signerName,
    identityConfirmed,
    identityError,
    recipientToken,
    verificationStep,
    otpCode,
    setOtpCode,
    isSendingOtp,
    handleEmailSubmit,
    handleOtpSubmit,
    handleResetVerification
  };
}
