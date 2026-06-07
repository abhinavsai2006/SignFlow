import { Edit3, Type, FileText } from 'lucide-react';
import type { SignatureField } from '../../hooks/useShareDocument';
import { normalizeEmail } from '../../utils/emailUtils';

interface ShareFieldLayerProps {
  fields: SignatureField[];
  pageNum: number;
  signerEmail: string;
  signerName: string;
  onFieldClick: (f: SignatureField) => void;
}

export function ShareFieldLayer({ fields, pageNum, signerEmail, signerName, onFieldClick }: ShareFieldLayerProps) {
  return (
    <>
      {fields
        .filter(f => f.page === pageNum)
        .map(f => {
          const isMine = normalizeEmail(f.recipientEmail) === normalizeEmail(signerEmail);
          const isSigned = f.status === 'Signed';
          
          return (
            <div
              key={f._id}
              onClick={() => {
                console.log('FIELD_CLICK', { fieldId: f._id, isMine, isSigned });
                onFieldClick(f);
              }}
              onDoubleClick={() => {
                console.log('FIELD_CLICK', { fieldId: f._id, isMine, isSigned });
                onFieldClick(f);
              }}
              style={{
                position: 'absolute',
                left: `${f.xPercent}%`,
                top: `${f.yPercent}%`,
                width: `${f.widthPercent}%`,
                height: `${f.heightPercent}%`,
                minWidth: '60px',
                minHeight: '28px',
                zIndex: 20,
                cursor: isSigned ? 'pointer' : (isMine ? 'pointer' : 'default')
              }}
              className={`select-none transition-all flex items-center justify-center ${
                isSigned
                  ? 'bg-transparent border-none shadow-none'
                  : isMine
                  ? 'rounded-lg border-2 border-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                  : 'rounded-lg border-2 border-slate-400/40 bg-slate-400/5'
              }`}
              title={isSigned ? 'Signed - Click to view details' : (isMine ? 'Click to sign' : `Assigned to ${f.recipientEmail}`)}
            >
              <FieldContent f={f} isMine={isMine} isSigned={isSigned} signerName={signerName} />
            </div>
          );
        })}
    </>
  );
}

function FieldContent({ f, isMine, isSigned, signerName }: { f: SignatureField, isMine: boolean, isSigned: boolean, signerName: string }) {
  const cleanSignerName = f.signerName || (isMine ? signerName : '') || f.recipientEmail.split('@')[0];

  if (isSigned && f.value) {
    if (f.type === 'Checkbox') {
      return (
        <div className="flex items-center justify-center w-full h-full bg-transparent">
          <input type="checkbox" checked={f.value === 'true'} readOnly className="h-5 w-5 accent-success cursor-default" />
        </div>
      );
    }

    const certId = f.certificateId || `SIGNFLOW-${(f._id?.toString() || '').slice(-4).toUpperCase()}`;
    const sigScale = (f.signatureScale || 100) / 100;
    
    return (
      <div className="flex flex-col w-full h-full bg-transparent overflow-hidden text-left font-sans select-none leading-[1.1] text-black">
        {/* Signature Area (Transparent) */}
        <div className="h-[70%] bg-transparent flex items-center justify-center p-0 overflow-hidden">
          <div style={{ transform: `scale(${sigScale})`, transformOrigin: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            {f.value.startsWith('data:image') ? (
              <img src={f.value} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none bg-transparent" />
            ) : (
              <span className={`truncate font-bold text-slate-800 ${
                f.type === 'Signature' || f.type === 'Initials'
                  ? (f.value.includes(':') ? `font-${f.value.split(':')[0]} italic text-[16px]` : 'font-cursive italic text-[16px]')
                  : 'font-sans text-[11px]'
              }`}>
                {f.value.includes(':') ? f.value.split(':')[1] : f.value}
              </span>
            )}
          </div>
        </div>

        {/* Metadata below signature */}
        <div className="flex-1 p-0 flex flex-col justify-start text-[7px] sm:text-[8px] font-medium text-slate-800">
          <div className="font-bold truncate">Signed By: {cleanSignerName}</div>
          {f.showDate !== false && (
            <div className="truncate">
              Date: {(() => {
                const d = f.updatedAt ? new Date(f.updatedAt) : new Date();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const day = String(d.getUTCDate()).padStart(2, '0');
                const month = months[d.getUTCMonth()];
                const year = d.getUTCFullYear();
                return `${day} ${month} ${year}`;
              })()}
            </div>
          )}
          {f.showTime !== false && (
            <div className="truncate">
              Time: {(() => {
                const d = f.updatedAt ? new Date(f.updatedAt) : new Date();
                const hours = String(d.getUTCHours()).padStart(2, '0');
                const minutes = String(d.getUTCMinutes()).padStart(2, '0');
                return `${hours}:${minutes} UTC`;
              })()}
            </div>
          )}
          {f.hideCertId !== true && (
            <div className="truncate text-slate-600">Cert ID: {certId}</div>
          )}
        </div>
      </div>
    );
  }

  // Unsigned state
  return (
    <div className="flex flex-col items-center justify-center text-center p-1.5 w-full h-full select-none text-slate-800 bg-transparent">
      <div className="flex items-center gap-1.5 justify-center">
        {f.type === 'Signature' ? (
          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
        ) : f.type === 'Initials' ? (
          <Type className="w-3.5 h-3.5 text-slate-600" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-slate-600" />
        )}
        <span className="text-[10px] font-bold tracking-wide uppercase text-slate-700">
          ✍ {f.type} Required
        </span>
      </div>
      <div className="text-[9px] text-slate-500 font-bold truncate max-w-[130px] mt-0.5">
        {cleanSignerName}
      </div>
      <div className="text-[7px] text-slate mt-0.5">
        {isMine ? 'Click to Sign' : 'Assigned Signer'}
      </div>
    </div>
  );
}
