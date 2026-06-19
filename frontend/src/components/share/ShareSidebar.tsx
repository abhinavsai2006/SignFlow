import { CheckCircle2, PenLine, Clock, ChevronRight } from 'lucide-react';
import type { DocumentData, SignatureField } from '../../hooks/useShareDocument';
import { normalizeEmail } from '../../utils/emailUtils';

interface ShareSidebarProps {
  docData: DocumentData | null;
  fields: SignatureField[];
  recipients: any[];
  auditLogs: any[];
  signerEmail: string;
  onFieldClick: (f: SignatureField) => void;
}

export function ShareSidebar({
  docData,
  fields,
  recipients,
  auditLogs,
  signerEmail,
  onFieldClick,
}: ShareSidebarProps) {
  // Only compute pending fields when we have a signer email
  const hasSigner = signerEmail.trim().length > 0;
  const myFields = hasSigner
    ? fields.filter(f => normalizeEmail(f.recipientEmail) === normalizeEmail(signerEmail))
    : [];
  const myPendingFields = myFields.filter(f => f.status !== 'Signed');
  const mySignedCount = myFields.length - myPendingFields.length;

  return (
    <div className="space-y-4 text-sm">

      {/* ── Signing Action Card ── */}
      {hasSigner && myFields.length > 0 && (
        <div className={`rounded-xl border p-4 space-y-3 ${
          myPendingFields.length > 0
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-emerald-500/8 border-emerald-500/25'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate">
              Your Signature Fields
            </p>
            {myFields.length > 0 && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate">
                {mySignedCount}/{myFields.length} done
              </span>
            )}
          </div>

          {myPendingFields.length === 0 ? (
            <div className="flex items-center gap-2 py-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 font-bold text-xs">All fields completed!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myPendingFields.map((f, idx) => (
                <button
                  key={f._id}
                  onClick={() => onFieldClick(f)}
                  className="w-full flex items-center justify-between p-3 bg-blue-500/15 border border-blue-500/30 rounded-lg hover:bg-blue-500/25 active:scale-[0.98] transition-all text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-blue-300">{f.type}</p>
                      <p className="text-slate-500 text-[10px]">Page {f.page}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <PenLine className="w-3 h-3" />
                    <span className="text-[10px] font-bold">Sign</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No signer identified yet — neutral placeholder */}
      {!hasSigner && (
        <div className="rounded-xl border border-hairline-soft bg-white/3 p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate">Your Signature Fields</p>
          <p className="text-xs text-slate-500 italic">Verify your identity to see your fields.</p>
        </div>
      )}

      {/* ── Document Details ── */}
      <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Document Details</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-slate shrink-0">Filename</span>
            <span className="font-medium text-ink-deep text-right break-all">{docData?.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Status</span>
            <span className={`font-bold ${docData?.status === 'Signed' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {docData?.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Uploaded</span>
            <span className="font-medium text-ink-deep">
              {docData?.createdAt ? new Date(docData.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          {docData?.sha256Checksum && (
            <div className="pt-2 border-t border-hairline-soft">
              <span className="block text-slate mb-1 text-[9px] font-bold uppercase">SHA-256 Checksum</span>
              <span className="block font-mono text-[9px] text-slate-400 break-all select-all p-1.5 bg-black/20 rounded border border-hairline-soft">
                {docData.sha256Checksum}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Recipients ── */}
      {recipients.length > 0 && (
        <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Recipients</p>
          <div className="space-y-2">
            {recipients.map((r, i) => (
              <div key={r._id || i} className="flex items-center justify-between text-xs p-2.5 bg-white/5 rounded-lg border border-hairline-soft">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-ink-deep truncate">{r.name}</p>
                  <p className="text-slate text-[10px] truncate">{r.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                  r.status === 'Signed'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                }`}>
                  {r.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Audit Trail ── */}
      {auditLogs.length > 0 && (
        <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Security & Audit</p>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-bold">SSL Secure</span>
          </div>
          <div className="space-y-2 max-h-[130px] overflow-y-auto pr-1">
            {auditLogs.map((log, i) => (
              <div key={log._id || i} className="text-[10px] leading-tight pb-2 border-b border-hairline-soft last:border-b-0 space-y-0.5">
                <div className="flex justify-between font-medium">
                  <span className="text-ink-deep">{log.action}</span>
                  <span className="text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate truncate">IP: {log.ipAddress}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
