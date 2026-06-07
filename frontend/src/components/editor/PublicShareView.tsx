import { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import {
  FileText, Lock, AlertTriangle, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Download, CheckCircle2, PenLine, ChevronRight as ArrowRight,
} from 'lucide-react';

import { useShareDocument, type SignatureField } from '../../hooks/useShareDocument';
import { useRecipientVerification } from '../../hooks/useRecipientVerification';
import { usePdfViewer } from '../../hooks/usePdfViewer';
import { ShareLayout } from '../share/ShareLayout';
import { ShareSidebar } from '../share/ShareSidebar';
import { ShareViewer } from '../share/ShareViewer';
import { RecipientVerification } from '../share/RecipientVerification';
import { SignatureModal } from '../share/SignatureModal';
import { DocumentDetails } from '../share/DocumentDetails';
import { normalizeEmail } from '../../utils/emailUtils';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

export default function PublicShareView() {
  const { id } = useParams<{ id: string }>();

  // 1. Load document data
  const {
    docData, fields, setFields, recipients, auditLogs,
    isLoading, error, isPasswordRequired, password, setPassword, loadDocumentMetadata
  } = useShareDocument(id);

  // 2. Handle recipient verification
  const {
    signerEmail, setSignerEmail, signerName, identityConfirmed, identityError,
    recipientToken, verificationStep, otpCode, setOtpCode, isSendingOtp,
    handleEmailSubmit, handleOtpSubmit, handleResetVerification
  } = useRecipientVerification(id);

  // 3. Build PDF URL only when identity is confirmed
  const pdfUrl = (identityConfirmed && !isPasswordRequired && id)
    ? `${BASE_URL}/api/docs/${id}/public-download${password ? '?password=' + encodeURIComponent(password) : ''}`
    : null;

  const {
    pdfDoc, numPages, currentPage, setCurrentPage, scale, setScale,
    isPdfLoading, viewerContainerRef, pageContainerRefs, handleFitWidth,
  } = usePdfViewer(pdfUrl);

  // Component state
  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [signatureDetails, setSignatureDetails] = useState<SignatureField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allSigned, setAllSigned] = useState(false);

  // Compute pending fields for the floating action bar
  const hasSigner = signerEmail.trim().length > 0;
  const myPendingFields = hasSigner
    ? fields.filter(f =>
        normalizeEmail(f.recipientEmail) === normalizeEmail(signerEmail) &&
        f.status !== 'Signed'
      )
    : [];

  // Handle clicking a signature field on the PDF
  const handleFieldClick = (f: SignatureField) => {
    const isMine = normalizeEmail(f.recipientEmail) === normalizeEmail(signerEmail);
    const isSigned = f.status === 'Signed';

    if (isSigned) {
      setSignatureDetails(f);
    } else if (isMine && identityConfirmed) {
      setActiveField(f);
    }
  };

  // Submit signature
  const handleSignConfirm = async (signatureVal: string, sigName: string) => {
    if (!activeField) return;
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/signatures/${activeField._id}/sign-public`,
        {
          signatureValue: signatureVal,
          signerEmail: normalizeEmail(signerEmail),
          signerName: sigName || normalizeEmail(signerEmail),
        },
        { headers: { 'x-recipient-token': recipientToken } }
      );

      const updatedField = response.data.field;
      setFields(prev => prev.map(f => f._id === activeField._id ? { ...f, ...updatedField } : f));
      setActiveField(null);

      // Check if all my fields are now signed
      const stillPending = fields.filter(f =>
        f._id !== activeField._id &&
        normalizeEmail(f.recipientEmail) === normalizeEmail(signerEmail) &&
        f.status !== 'Signed'
      );
      if (stillPending.length === 0) setAllSigned(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit signature. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download PDF
  const handleDownload = async () => {
    try {
      const downloadUrl = `${BASE_URL}/api/docs/${id}/public-download${password ? '?password=' + encodeURIComponent(password) : ''}`;
      const response = await axios.get(downloadUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', docData?.filename || 'signed-document.pdf');
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error downloading PDF file. Please try again.');
    }
  };

  // ─────────────── Early Return States ───────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-center items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate text-sm animate-pulse">Loading secure document…</p>
      </div>
    );
  }

  if (isPasswordRequired) {
    return (
      <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-soft border border-hairline-soft rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-ink-deep">Password Protected</h2>
          <form onSubmit={e => { e.preventDefault(); loadDocumentMetadata(password); }} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Document password"
              className="w-full bg-white/5 border border-hairline-soft rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-ink-deep"
            />
            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-ink-deep font-bold py-3 rounded-xl transition">
              Unlock Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-soft border border-hairline-soft rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <AlertTriangle className="w-14 h-14 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-ink-deep">Link Unavailable</h2>
          <p className="text-slate text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (allSigned) {
    return (
      <div className="min-h-screen w-full bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-surface-soft border border-hairline-soft rounded-2xl p-10 shadow-2xl text-center space-y-6">
          <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold text-ink-deep">Signing Complete!</h2>
          <p className="text-slate text-sm">You have successfully signed <strong>{docData?.filename}</strong>.</p>
          <button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary-hover text-ink-deep font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Download Signed PDF
          </button>
        </div>
      </div>
    );
  }

  // Identity verification gate
  if (!identityConfirmed) {
    return (
      <RecipientVerification
        docData={docData}
        signerEmail={signerEmail}
        setSignerEmail={setSignerEmail}
        verificationStep={verificationStep}
        otpCode={otpCode}
        setOtpCode={setOtpCode}
        isSendingOtp={isSendingOtp}
        identityError={identityError}
        handleEmailSubmit={handleEmailSubmit}
        handleOtpSubmit={handleOtpSubmit}
        handleResetVerification={handleResetVerification}
      />
    );
  }

  // ─────────────── Main Layout ───────────────

  const header = (
    <>
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-blue-400 shrink-0" />
        <span className="font-bold text-sm truncate max-w-[160px] sm:max-w-sm">{docData?.filename}</span>
        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold hidden sm:block">
          Shared Document
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Page navigation + zoom — desktop only */}
        {pdfDoc && (
          <div className="hidden md:flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-hairline-soft text-xs">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="px-1.5 font-bold tabular-nums">{currentPage} / {numPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage === numPages}
              className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 transition"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={() => setScale(s => Math.max(0.4, s - 0.15))} className="p-1 hover:bg-white/10 rounded-full transition">
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="w-10 text-center font-mono">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.15))} className="p-1 hover:bg-white/10 rounded-full transition">
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        )}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-ink-deep text-xs font-bold px-3 py-1.5 rounded-full transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
        </button>
      </div>
    </>
  );

  // Adobe Sign-style sticky action bar — shown when there are pending fields
  const floatingBar = myPendingFields.length > 0 ? (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2 min-w-0">
        <PenLine className="w-4 h-4 shrink-0" />
        <span className="text-sm font-semibold truncate">
          {myPendingFields.length === 1
            ? '1 signature field waiting'
            : `${myPendingFields.length} signature fields waiting`}
        </span>
      </div>
      <button
        onClick={() => handleFieldClick(myPendingFields[0])}
        className="flex items-center gap-1.5 bg-white text-blue-700 font-bold text-xs px-4 py-2 rounded-full hover:bg-blue-50 active:scale-95 transition-all shrink-0 shadow-sm"
      >
        Sign Now
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : null;

  return (
    <>
      <ShareLayout
        header={header}
        sidebar={
          <ShareSidebar
            docData={docData}
            fields={fields}
            recipients={recipients}
            auditLogs={auditLogs}
            signerEmail={signerEmail}
            onDownload={handleDownload}
            onFieldClick={handleFieldClick}
          />
        }
        viewer={
          <ShareViewer
            pdfDoc={pdfDoc}
            numPages={numPages}
            isPdfLoading={isPdfLoading}
            fields={fields}
            viewerContainerRef={viewerContainerRef}
            pageContainerRefs={pageContainerRefs}
            signerEmail={signerEmail}
            signerName={signerName}
            onFieldClick={handleFieldClick}
            handleFitWidth={handleFitWidth}
          />
        }
        floatingBar={floatingBar}
      />

      <SignatureModal
        activeField={activeField}
        signerEmail={signerEmail}
        signerName={signerName}
        onClose={() => setActiveField(null)}
        onSignConfirm={handleSignConfirm}
        isSubmitting={isSubmitting}
      />
      <DocumentDetails
        signatureDetails={signatureDetails}
        signerName={signerName}
        docData={docData}
        onClose={() => setSignatureDetails(null)}
      />
    </>
  );
}
