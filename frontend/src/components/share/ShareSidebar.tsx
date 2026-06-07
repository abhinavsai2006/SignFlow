import { Download, CheckCircle2 } from 'lucide-react';
import type { DocumentData, SignatureField } from '../../hooks/useShareDocument';
import { normalizeEmail } from '../../utils/emailUtils';

interface ShareSidebarProps {
  docData: DocumentData | null;
  fields: SignatureField[];
  recipients: any[];
  auditLogs: any[];
  signerEmail: string;
  onDownload: () => void;
  onFieldClick: (f: SignatureField) => void;
}

export function ShareSidebar({
  docData,
  fields,
  recipients,
  auditLogs,
  signerEmail,
  onDownload,
  onFieldClick
}: ShareSidebarProps) {
  const myPendingFields = fields.filter(f => 
    normalizeEmail(f.recipientEmail) === normalizeEmail(signerEmail) && f.status !== 'Signed'
  );

  return (
    <div className="space-y-6">
      {/* Document Details */}
      <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Document Details</p>
        <div className="text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate">Filename:</span>
            <span className="font-medium text-ink-deep text-right break-all ml-2">{docData?.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Status:</span>
            <span className="font-medium text-ink-deep">{docData?.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Uploaded:</span>
            <span className="font-medium text-ink-deep">
              {docData?.createdAt ? new Date(docData.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {docData?.sha256Checksum && (
            <div className="pt-2 border-t border-hairline-soft">
              <span className="block text-slate mb-1 text-[9px] font-bold uppercase">SHA-256 Checksum</span>
              <span className="block font-mono text-[9px] text-emerald-400 break-all select-all p-1 bg-black/20 rounded">
                {docData.sha256Checksum}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recipients List */}
      <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Recipients</p>
        <div className="space-y-2">
          {recipients.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No recipients registered.</p>
          ) : (
            recipients.map((r, i) => (
              <div key={r._id || i} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg border border-hairline-soft">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-ink-deep truncate">{r.name}</p>
                  <p className="text-slate text-[10px] truncate">{r.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  r.status === 'Signed' ? 'bg-success/15 text-success border border-success/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                }`}>
                  {r.status || 'Pending'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-1.5 justify-between">
          <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Security & Audit</p>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">SSL Secure</span>
        </div>
        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No audit trail generated.</p>
          ) : (
            auditLogs.map((log, i) => (
              <div key={log._id || i} className="text-[10px] leading-tight pb-2 border-b border-hairline-soft last:border-b-0 space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span className="text-ink-deep">{log.action}</span>
                  <span className="text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate truncate">IP: {log.ipAddress}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Your Signing Fields */}
      <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Your Pending Fields</p>
        {myPendingFields.length === 0 ? (
          <div className="text-center py-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-emerald-400 text-xs font-bold">All Signed!</p>
          </div>
        ) : (
          myPendingFields.map(f => (
            <button
              key={f._id}
              onClick={() => onFieldClick(f)}
              className="w-full text-left p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-primary-hover/20 transition text-xs flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="font-bold text-blue-300">{f.type}</span>
                <span className="text-slate-500 text-[10px] block">Page {f.page}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Download Action */}
      <div className="pt-2">
        <button
          onClick={onDownload}
          className="w-full bg-primary hover:bg-primary-hover text-ink-deep font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Document</span>
        </button>
      </div>
    </div>
  );
}
