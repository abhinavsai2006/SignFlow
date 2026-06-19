import { useRef } from 'react';
import { Edit3, Type, FileText } from 'lucide-react';
import type { SignatureField } from '../../hooks/useShareDocument';
import { normalizeEmail } from '../../utils/emailUtils';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

interface ShareFieldLayerProps {
  fields: SignatureField[];
  pageNum: number;
  signerEmail: string;
  signerName: string;
  recipientToken: string;
  onFieldClick: (f: SignatureField) => void;
  onFieldUpdate?: (fieldId: string, updates: Partial<SignatureField>) => void;
}

export function ShareFieldLayer({
  fields,
  pageNum,
  signerEmail,
  signerName,
  recipientToken,
  onFieldClick,
  onFieldUpdate,
}: ShareFieldLayerProps) {
  return (
    <>
      {fields
        .filter(f => f.page === pageNum)
        .map(f => (
          <DraggableField
            key={f._id}
            f={f}
            signerEmail={signerEmail}
            signerName={signerName}
            recipientToken={recipientToken}
            onFieldClick={onFieldClick}
            onFieldUpdate={onFieldUpdate}
          />
        ))}
    </>
  );
}

interface DraggableFieldProps {
  f: SignatureField;
  signerEmail: string;
  signerName: string;
  recipientToken: string;
  onFieldClick: (f: SignatureField) => void;
  onFieldUpdate?: (fieldId: string, updates: Partial<SignatureField>) => void;
}

function DraggableField({ f, signerEmail, signerName, recipientToken, onFieldClick, onFieldUpdate }: DraggableFieldProps) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const isMine = normalizeEmail(f.recipientEmail) === normalizeEmail(signerEmail);
  const isSigned = f.status === 'Signed';
  const canInteract = isMine && !isSigned;

  console.log('[SIGNATURE_RENDER_SOURCE] Field:', { id: f._id, type: f.type, isSigned, isMine });
  if (isSigned) {
    console.log('[PDF_SIGNATURE_RENDERED] Showing embedded PDF signature only');
  } else {
    console.log('[OVERLAY_SIGNATURE_RENDERED] Showing interactive overlay');
  }

  // Save updated position/size to backend
  const saveUpdate = async (updates: Partial<SignatureField>) => {
    if (!onFieldUpdate) return;
    onFieldUpdate(f._id, updates);
    try {
      await fetch(`${BASE_URL}/api/signatures/${f._id}/public`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-recipient-token': recipientToken,
        },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to persist field update:', err);
    }
  };

  // Drag handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canInteract) return;
    const target = e.target as HTMLElement;
    if (target.closest('.sf-resize-handle')) return;

    e.stopPropagation();

    const container = fieldRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = f.xPercent;
    const startTop = f.yPercent;

    const el = fieldRef.current!;
    el.setPointerCapture(e.pointerId);

    // Live tooltip
    let tooltip = document.getElementById(`sftooltip-${f._id}`);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = `sftooltip-${f._id}`;
      tooltip.style.cssText = 'position:absolute;background:#1e293b;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;z-index:99;pointer-events:none;top:-24px;left:50%;transform:translateX(-50%);white-space:nowrap;font-family:monospace';
      el.appendChild(tooltip);
    }
    tooltip.style.display = 'block';

    let rafId = 0;
    let lastX = startLeft;
    let lastY = startTop;

    const onMove = (me: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = ((me.clientX - startX) / containerRect.width) * 100;
        const dy = ((me.clientY - startY) / containerRect.height) * 100;
        lastX = Math.max(0, Math.min(100 - f.widthPercent, startLeft + dx));
        lastY = Math.max(0, Math.min(100 - f.heightPercent, startTop + dy));
        el.style.left = `${lastX}%`;
        el.style.top = `${lastY}%`;
        if (tooltip) tooltip.textContent = `${Math.round(lastX)}%, ${Math.round(lastY)}%`;
      });
    };

    const onUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.releasePointerCapture(e.pointerId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      if (tooltip) tooltip.style.display = 'none';
      saveUpdate({ xPercent: lastX, yPercent: lastY });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
  };

  // Resize handler
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, corner: string) => {
    if (!canInteract) return;
    e.stopPropagation();
    e.preventDefault();

    const container = fieldRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startXPct = f.xPercent;
    const startYPct = f.yPercent;
    const startWPct = f.widthPercent;
    const startHPct = f.heightPercent;
    const aspect = startWPct / startHPct;
    const minW = (80 / containerRect.width) * 100;
    const maxW = (600 / containerRect.width) * 100;

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    let rafId = 0;
    let lastUpdates = { xPercent: startXPct, yPercent: startYPct, widthPercent: startWPct, heightPercent: startHPct };

    const onMove = (me: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = ((me.clientX - startX) / containerRect.width) * 100;

        let nX = startXPct, nY = startYPct, nW = startWPct, nH = startHPct;

        if (corner === 'br') {
          nW = Math.max(minW, Math.min(maxW, startWPct + dx));
          nH = nW / aspect;
        } else if (corner === 'bl') {
          nW = Math.max(minW, Math.min(maxW, startWPct - dx));
          nX = startXPct + (startWPct - nW);
          nH = nW / aspect;
        } else if (corner === 'tr') {
          nW = Math.max(minW, Math.min(maxW, startWPct + dx));
          nH = nW / aspect;
          nY = startYPct + (startHPct - nH);
        } else if (corner === 'tl') {
          nW = Math.max(minW, Math.min(maxW, startWPct - dx));
          nX = startXPct + (startWPct - nW);
          nH = nW / aspect;
          nY = startYPct + (startHPct - nH);
        }

        // Clamp to page bounds
        nX = Math.max(0, Math.min(100 - nW, nX));
        nY = Math.max(0, Math.min(100 - nH, nY));

        lastUpdates = { xPercent: nX, yPercent: nY, widthPercent: nW, heightPercent: nH };

        if (fieldRef.current) {
          fieldRef.current.style.left = `${nX}%`;
          fieldRef.current.style.top = `${nY}%`;
          fieldRef.current.style.width = `${nW}%`;
          fieldRef.current.style.height = `${nH}%`;
        }
      });
    };

    const onUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      saveUpdate(lastUpdates);
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  };

  // If field is signed, only render a transparent clickable area, no content
  if (isSigned) {
    return (
      <div
        ref={fieldRef}
        onClick={() => onFieldClick(f)}
        style={{
          position: 'absolute',
          left: `${f.xPercent}%`,
          top: `${f.yPercent}%`,
          width: `${f.widthPercent}%`,
          height: `${f.heightPercent}%`,
          minWidth: '60px',
          minHeight: '28px',
          zIndex: 20,
          cursor: 'pointer',
        }}
        title="Signed — click to view details"
      />
    );
  }

  return (
    <div
      ref={fieldRef}
      onClick={() => onFieldClick(f)}
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        left: `${f.xPercent}%`,
        top: `${f.yPercent}%`,
        width: `${f.widthPercent}%`,
        height: `${f.heightPercent}%`,
        minWidth: '60px',
        minHeight: '28px',
        zIndex: 20,
        cursor: canInteract ? 'move' : 'default',
        touchAction: 'none',
      }}
      className={`select-none transition-shadow flex items-center justify-center ${
        isMine
          ? 'rounded-lg border-2 border-blue-400 bg-blue-400/10 hover:bg-blue-400/20 hover:shadow-lg hover:shadow-blue-400/20'
          : 'rounded-lg border-2 border-slate-400/40 bg-slate-400/5'
      }`}
      title={isMine ? 'Click to sign | Drag to move' : `Assigned to ${f.recipientEmail}`}
    >
      <FieldContent f={f} isMine={isMine} signerName={signerName} />

      {/* Resize handles — only for mine + unsigned */}
      {canInteract && (
        <>
          {(['tl', 'tr', 'bl', 'br'] as const).map(corner => (
            <div
              key={corner}
              onPointerDown={e => handleResizeStart(e, corner)}
              className={`sf-resize-handle absolute w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow z-30 flex items-center justify-center ${
                corner === 'tl' ? '-top-2 -left-2 cursor-nwse-resize' :
                corner === 'tr' ? '-top-2 -right-2 cursor-nesw-resize' :
                corner === 'bl' ? '-bottom-2 -left-2 cursor-nesw-resize' :
                '-bottom-2 -right-2 cursor-se-resize'
              }`}
            />
          ))}
        </>
      )}
    </div>
  );
}

function FieldContent({ f, isMine, signerName }: { f: SignatureField; isMine: boolean; signerName: string }) {
  const cleanSignerName = f.signerName || (isMine ? signerName : '') || f.recipientEmail.split('@')[0];

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
        {isMine ? 'Click to Sign | Drag to Move' : 'Assigned Signer'}
      </div>
    </div>
  );
}
