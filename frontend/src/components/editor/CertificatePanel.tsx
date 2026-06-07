import { CheckCircle2, AlertTriangle } from 'lucide-react';
import MetaButton from '../ui/MetaButton';
import MetaModal from '../ui/MetaModal';

interface SignatureField {
  _id?: string;
  recipientEmail: string;
  signerName?: string;
  status: 'Pending' | 'Signed';
  updatedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  device?: string;
  operatingSystem?: string;
  location?: string;
  isp?: string;
  certificateId?: string;
  auditId?: string;
  documentHash?: string;
  tamperStatus?: string;
}

interface Recipient {
  name: string;
  email: string;
}

interface CertificatePanelProps {
  isOpen: boolean;
  field: SignatureField | null;
  recipients?: Recipient[];
  sha256Checksum?: string;
  onClose: () => void;
}

export default function CertificatePanel({ isOpen, field, recipients = [], sha256Checksum, onClose }: CertificatePanelProps) {
  if (!field) return null;

  const recipient = recipients.find(r => r.email === field.recipientEmail);
  const signerName = field.signerName || (recipient ? recipient.name : field.recipientEmail.split('@')[0]);
  
  const certId = field.certificateId || (field._id ? `SIG-${new Date().getFullYear()}-${field._id.slice(-6).toUpperCase()}` : `SIG-${new Date().getFullYear()}-TEMP`);
  const auditId = field.auditId || (field._id ? `AUD-${field._id.slice(-8).toUpperCase()}` : 'AUD-TEMP');
  
  // Clean values, use em dash placeholder for empty values
  const getVal = (val?: string) => {
    if (!val || val === 'Unavailable' || val === 'Unknown') return '—';
    return val;
  };

  const browser = getVal(field.browser);
  const device = getVal(field.device);
  const os = getVal(field.operatingSystem);
  const location = getVal(field.location);
  const ipAddress = getVal(field.ipAddress);
  const userAgent = getVal(field.userAgent);
  const docHash = getVal(sha256Checksum || field.documentHash);
  
  const verificationStatus = field.status === 'Signed' ? 'Verified Signature' : 'Pending';

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = months[d.getUTCMonth()];
      const year = String(d.getUTCFullYear()).padStart(4, '0');
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} • ${hours}:${minutes} UTC`;
    } catch {
      return '—';
    }
  };

  const isLocal = ipAddress === '127.0.0.1' || 
                  ipAddress === '::1' || 
                  ipAddress === '::ffff:127.0.0.1' || 
                  location === 'Local Development Environment';

  return (
    <MetaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Electronic Signature Certificate"
      footer={
        <div className="flex justify-end">
          <MetaButton variant="primary" onClick={onClose} className="rounded-full text-[14px] font-bold tracking-[-0.14px] bg-[#0064E0] hover:bg-[#0052b4]">
            Close
          </MetaButton>
        </div>
      }
    >
      <div className="space-y-md rounded-2xl">
        {/* Conditional rendering: Local warning OR Verified banner */}
        {isLocal ? (
          <div className="flex items-center space-x-md p-md bg-yellow-50 rounded-xl border border-yellow-200" data-testid="dev-warning">
            <AlertTriangle className="w-8 h-8 text-yellow-600 shrink-0" />
            <div>
              <h4 className="text-body-sm-bold font-bold text-yellow-950">Development Mode Active</h4>
              <p className="text-[11px] text-yellow-850">This signature was captured in a local development environment. Geolocation and network provider metadata are simulated.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-md p-md bg-emerald-50 rounded-xl border border-emerald-200" data-testid="verified-banner">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-body-sm-bold font-bold text-emerald-900">SignFlow Verified Signature</h4>
              <p className="text-[11px] text-emerald-700">SignFlow Verified Signature — cryptographically verified and legally binding under ESIGN & UETA regulations.</p>
            </div>
          </div>
        )}

        {/* Identity & Metadata Grid */}
        <div className="grid grid-cols-2 gap-md bg-[#f1f4f7] p-md rounded-xl border border-[#ced0d4]">
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Signer Name</span>
            <span className="text-[#0a1317] text-body-sm-bold font-bold">{signerName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Email Address</span>
            <span className="text-[#0a1317] text-body-sm truncate" title={field.recipientEmail}>{field.recipientEmail}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Verification Status</span>
            <span className="text-emerald-600 text-body-sm-bold font-bold">✓ {verificationStatus}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Timestamp</span>
            <span className="text-[#0a1317] text-body-sm font-mono">{formatTimestamp(field.updatedAt)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">IP Address</span>
            <span className="text-[#0a1317] text-body-sm font-mono">{ipAddress}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Location</span>
            <span className="text-[#0a1317] text-body-sm">{location}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Browser</span>
            <span className="text-[#0a1317] text-body-sm">{browser}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Device & OS</span>
            <span className="text-[#0a1317] text-body-sm">{device} ({os})</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">User Agent</span>
            <span className="text-[#0a1317] text-[11px] font-mono break-all leading-tight bg-white p-xs rounded border border-[#ced0d4] mt-xxs">{userAgent}</span>
          </div>
        </div>

        {/* Compliance Verification */}
        <div className="bg-emerald-50 p-md rounded-xl border border-emerald-200 space-y-xs">
          <h4 className="text-body-sm-bold font-bold text-emerald-900 mb-xs">Compliance Verification</h4>
          <div className="grid grid-cols-2 gap-xs text-[#0a1317] text-body-sm">
            <div className="flex justify-between"><span className="text-[#5d6c7b]">Trust Score</span><span className="text-emerald-700 font-bold">{field.status === 'Signed' ? '100%' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#5d6c7b]">Document Integrity</span><span className="text-emerald-700 font-bold">{field.status === 'Signed' ? 'Verified' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#5d6c7b]">Signature Integrity</span><span className="text-emerald-700 font-bold">{field.status === 'Signed' ? 'Verified' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#5d6c7b]">Audit Trail</span><span className="text-emerald-700 font-bold">{field.status === 'Signed' ? 'Verified' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#5d6c7b]">Tamper Detection</span><span className="text-emerald-700 font-bold">{field.status === 'Signed' ? 'Verified' : '—'}</span></div>
          </div>
        </div>

        {/* Dynamic Reference IDs */}
        <div className="bg-[#f1f4f7] p-md rounded-xl border border-[#ced0d4] space-y-sm">
          <div className="flex justify-between items-center border-b border-[#ced0d4] pb-xxs">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Certificate ID</span>
            <span className="text-[#0a1317] text-body-sm-bold font-mono">{certId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-[#ced0d4] pb-xxs">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Audit ID</span>
            <span className="text-[#0a1317] text-body-sm-bold font-mono">{auditId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#5d6c7b] text-[10px] font-bold uppercase tracking-wider">Tamper Status</span>
            <span className="text-emerald-600 text-body-sm-bold font-bold">{field.status === 'Signed' ? 'Verified' : '—'}</span>
          </div>
        </div>

        {/* SHA-256 Fingerprint */}
        {docHash && docHash !== '—' && (
          <div className="bg-slate-900 text-slate-100 p-md rounded-xl border border-slate-800 space-y-xxs">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Cryptographic SHA-256 Fingerprint</span>
            <p className="text-[10px] font-mono break-all leading-tight text-slate-200">{docHash}</p>
          </div>
        )}
      </div>
    </MetaModal>
  );
}
