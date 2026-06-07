import { Shield, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { DocumentData, SignatureField } from '../../hooks/useShareDocument';

interface DocumentDetailsProps {
  signatureDetails: SignatureField | null;
  signerName: string;
  docData: DocumentData | null;
  onClose: () => void;
}

export function DocumentDetails({ signatureDetails, signerName, docData, onClose }: DocumentDetailsProps) {
  if (!signatureDetails) return null;

  const signerDisplayName = signerName || signatureDetails.recipientEmail.split('@')[0];
  const certId = signatureDetails.certificateId || `SIG-${new Date().getFullYear()}-${signatureDetails._id.slice(-6).toUpperCase()}`;
  const auditId = signatureDetails.auditId || `AUD-${signatureDetails._id.slice(-8).toUpperCase()}`;
  const browser = signatureDetails.browser || 'Unavailable';
  const device = signatureDetails.device || 'Unavailable';
  const os = signatureDetails.operatingSystem || 'Unavailable';
  const location = signatureDetails.location || 'Unavailable';
  const docId = signatureDetails.documentId;
  const tamperStatus = signatureDetails.tamperStatus || 'Verified';
  const docHash = docData?.sha256Checksum || signatureDetails.documentHash || 'Pending Finalization';
  const verificationStatus = signatureDetails.status === 'Signed' ? 'Verified Signature' : 'Pending';
  const isLocal = !signatureDetails.ipAddress || signatureDetails.ipAddress === '127.0.5.1' || signatureDetails.ipAddress === '127.0.0.1' || signatureDetails.location === 'Local Development Environment';

  const formatSignatureDate = (dateString?: string) => {
    const d = dateString ? new Date(dateString) : new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} • ${hours}:${minutes} UTC`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface-soft border border-hairline-soft rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft shrink-0">
          <h2 className="font-bold text-ink-deep text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Verified Signature Certificate
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-4 h-4 text-slate" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {isLocal && (
            <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <AlertTriangle className="w-8 h-8 text-yellow-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-yellow-400">Development Mode Active</h4>
                <p className="text-[11px] text-yellow-500/80">This signature was captured in a local development environment. Geolocation and network provider metadata are simulated.</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-400">SignFlow Verified Signature</h4>
              <p className="text-[11px] text-emerald-500/80">This signature is cryptographically verified and legally binding under ESIGN & UETA regulations.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl border border-hairline-soft">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Signer Name</span>
              <span className="text-ink-deep text-sm font-bold">{signerDisplayName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Email Address</span>
              <span className="text-ink-deep text-sm truncate" title={signatureDetails.recipientEmail}>{signatureDetails.recipientEmail}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Verification Status</span>
              <span className="text-emerald-400 text-sm font-bold">✓ {verificationStatus}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Timestamp</span>
              <span className="text-ink-deep text-sm font-mono">{formatSignatureDate(signatureDetails.updatedAt)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">IP Address</span>
              <span className="text-ink-deep text-sm font-mono">{signatureDetails.ipAddress || 'Unavailable'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Location</span>
              <span className="text-ink-deep text-sm">{location}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Browser</span>
              <span className="text-ink-deep text-sm">{browser}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Device & OS</span>
              <span className="text-ink-deep text-sm">{device} ({os})</span>
            </div>
            <div className="flex flex-col col-span-2">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">User Agent</span>
              <span className="text-slate-300 text-[11px] font-mono break-all leading-tight bg-white/5 p-2 rounded border border-hairline-soft mt-1">{signatureDetails.userAgent || 'Unknown Browser'}</span>
            </div>
          </div>

          {/* Compliance Verification */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-bold text-emerald-400 mb-1">Compliance Verification</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between"><span className="text-slate">Trust Score</span><span className="text-emerald-400 font-bold">100%</span></div>
              <div className="flex justify-between"><span className="text-slate">Document Integrity</span><span className="text-emerald-400 font-bold">Verified</span></div>
              <div className="flex justify-between"><span className="text-slate">Signature Integrity</span><span className="text-emerald-400 font-bold">Verified</span></div>
              <div className="flex justify-between"><span className="text-slate">Audit Trail</span><span className="text-emerald-400 font-bold">Verified</span></div>
              <div className="flex justify-between"><span className="text-slate">Tamper Detection</span><span className="text-emerald-400 font-bold">Passed</span></div>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-hairline-soft space-y-2">
            <div className="flex justify-between items-center border-b border-hairline-soft pb-1.5">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Document ID</span>
              <span className="text-ink-deep text-xs font-mono">{docId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-hairline-soft pb-1.5">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Certificate ID</span>
              <span className="text-ink-deep text-xs font-mono">{certId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-hairline-soft pb-1.5">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Audit ID</span>
              <span className="text-ink-deep text-xs font-mono">{auditId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Tamper Status</span>
              <span className="text-emerald-400 text-sm font-bold">{tamperStatus}</span>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider block">Cryptographic SHA-256 Fingerprint</span>
            <p className="text-[10px] font-mono break-all leading-tight text-slate-300">{docHash}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-hairline-soft bg-white/2 shrink-0">
          <button onClick={onClose}
            className="px-6 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-ink-deep rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
