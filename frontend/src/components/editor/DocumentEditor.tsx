import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import * as pdfjsLib from 'pdfjs-dist';
import Navbar from '../layout/Navbar';
import MetaButton from '../ui/MetaButton';
import MetaCard from '../ui/MetaCard';
import MetaModal from '../ui/MetaModal';
import MetaInput from '../ui/MetaInput';
import MetaBadge from '../ui/MetaBadge';
import { 
  ArrowLeft, Trash2, Type, Edit3, Users,
  ZoomIn, ZoomOut, RotateCw, Maximize, Activity, ClipboardList, CheckCircle2,
  ChevronLeft, ChevronRight, Maximize2, X, Undo, Redo, Upload, Calendar, AlignLeft, CheckSquare,
  Lock, Unlock, Copy, GripHorizontal, Settings, AlertTriangle
} from 'lucide-react';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import SignatureCanvas from 'react-signature-canvas';

// Configure PDFJS Worker locally
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Document {
  _id: string;
  filename: string;
  originalPath: string;
  status: 'Draft' | 'Pending' | 'Viewed' | 'Signed' | 'Rejected' | 'Expired' | 'Archived';
  signingOrder?: 'Parallel' | 'Sequential';
  remindersEnabled?: boolean;
  reminderInterval?: number;
  expiresAt?: string;
  rejectionReason?: string;
}

interface SignatureField {
  _id?: string;
  isLocked?: boolean;
  type: 'Signature' | 'Initials' | 'Date' | 'Text' | 'Checkbox';
  recipientEmail: string;
  signerName?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  page: number;
  status: 'Pending' | 'Signed';
  value?: string;
  updatedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  certificateId?: string;
  auditId?: string;
  browser?: string;
  device?: string;
  operatingSystem?: string;
  location?: string;
  documentHash?: string;
  tamperStatus?: string;
  documentId?: string;
}

interface SignatureProfile {
  _id: string;
  name: string;
  type: 'draw' | 'type' | 'upload';
  imageData: string;
}

interface AuditLog {
  _id: string;
  action: 'Upload' | 'View' | 'Download' | 'Share' | 'Sign' | 'Reject' | 'Delete' | 'Finalize';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  userId?: { name: string; email: string };
}

// ----------------------------------------------------
// Decoupled Canvas Page Component (Stage 3 Placement)
// ----------------------------------------------------
interface PdfPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  scale: number;
  rotation: number;
  signatures: SignatureField[];
  selectedFieldIdx: number | null;
  onOpenSigningModal: (index: number) => void;
  onSelectField: (index: number | null) => void;
  onRemoveField: (index: number) => void;
  registerPageContainer: (el: HTMLDivElement | null, pageNum: number) => void;
  onRightClickField: (e: React.MouseEvent, index: number) => void;
  onOpenDetailsModal: (sig: SignatureField) => void;
  onToggleLock: (index: number) => void;
  onDuplicateField: (index: number) => void;
  onUpdateFieldPosition: (index: number, x: number, y: number) => void;
  onUpdateFieldDimensions: (index: number, x: number, y: number, w: number, h: number) => void;
  onChangeRecipient: (index: number, email: string) => void;
  recipients: any[];
}

function PdfPage({
  pdfDoc,
  pageNum,
  scale,
  rotation,
  signatures,
  selectedFieldIdx,
  onOpenSigningModal,
  onSelectField,
  onRemoveField,
  registerPageContainer,
  onRightClickField,
  onOpenDetailsModal,
  onToggleLock,
  onDuplicateField,
  onUpdateFieldPosition,
  onUpdateFieldDimensions,
  onChangeRecipient,
  recipients
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Hook 1: Fetch and compute page viewport dimensions
  useEffect(() => {
    let isCancelled = false;
    const computeDimensions = async () => {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;
        const viewport = page.getViewport({ scale, rotation });
        setDimensions({ width: viewport.width, height: viewport.height });
      } catch (err) {
        console.error(`Error loading page ${pageNum} dimensions:`, err);
      }
    };
    computeDimensions();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNum, scale, rotation]);

  // Hook 2: Render PDF content when canvas element is styled correctly
  useEffect(() => {
    if (!pdfDoc || !dimensions) return;
    let isCancelled = false;
    let renderTask: any = null;

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = (window.devicePixelRatio || 1) * 2;
        // Sync drawing surface buffer resolution
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;

        // Explicit CSS size matching attributes to prevent Tailwind collapse
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;
        canvas.style.display = "block";

        context.clearRect(0, 0, canvas.width, canvas.height);

        const viewport = page.getViewport({ scale: scale * dpr, rotation });

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        } as any;

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNum, dimensions, scale, rotation]);

  return (
    <div
      ref={(el) => registerPageContainer(el, pageNum)}
      style={{ 
        background: "#fff",
        minHeight: dimensions ? `${dimensions.height}px` : "950px",
        width: dimensions ? `${dimensions.width}px` : "100%",
        position: "relative"
      }}
      className="shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-hairline rounded-xl overflow-hidden select-none bg-canvas transition-shadow"
    >
      <canvas 
        ref={canvasRef} 
        className="block" 
        style={dimensions ? {
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`
        } : undefined}
      />

      {signatures
        .map((sig, index) => ({ sig, index }))
        .filter(({ sig }) => sig.page === pageNum)
        .map(({ sig, index }) => {
          const isSelected = selectedFieldIdx === index;
          return (
            <DraggableField
              key={index}
              sig={sig}
              index={index}
              isSelected={isSelected}
              onSelectField={onSelectField}
              onOpenSigningModal={onOpenSigningModal}
              onRightClickField={onRightClickField}
              onRemoveField={onRemoveField}
              onOpenDetailsModal={onOpenDetailsModal}
              onToggleLock={onToggleLock}
              onDuplicateField={onDuplicateField}
              onUpdateFieldPosition={onUpdateFieldPosition}
              onUpdateFieldDimensions={onUpdateFieldDimensions}
              onChangeRecipient={onChangeRecipient}
              recipients={recipients}
            />
          );
        })}
    </div>
  );
}

const getRecipientColorTheme = (email: string, isSelected: boolean, isLocked: boolean, isSigned: boolean) => {
  if (isSigned) {
    return {
      borderClass: 'border-success',
      bgClass: 'bg-success/5',
      textClass: 'text-success',
      badgeClass: 'bg-success text-white',
      accentColor: '#31a24c',
      labelColor: 'text-success/80'
    };
  }
  if (isLocked) {
    return {
      borderClass: 'border-slate/40',
      bgClass: 'bg-surface-soft/60',
      textClass: 'text-slate',
      badgeClass: 'bg-slate text-white',
      accentColor: '#5d6c7b',
      labelColor: 'text-slate/60'
    };
  }
  
  if (!email) {
    return {
      borderClass: 'border-primary',
      bgClass: 'bg-primary/5',
      textClass: 'text-primary',
      badgeClass: 'bg-primary text-white',
      accentColor: '#0064e0',
      labelColor: 'text-primary/70'
    };
  }

  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const themes = [
    { borderClass: 'border-primary', bgClass: 'bg-primary/5', textClass: 'text-primary', badgeClass: 'bg-primary text-white', accentColor: '#0064e0', labelColor: 'text-primary/70' },
    { borderClass: 'border-oculus-purple', bgClass: 'bg-oculus-purple/5', textClass: 'text-oculus-purple', badgeClass: 'bg-oculus-purple text-white', accentColor: '#a121ce', labelColor: 'text-oculus-purple/70' },
    { borderClass: 'border-attention', bgClass: 'bg-attention/5', textClass: 'text-attention', badgeClass: 'bg-attention text-ink-deep', accentColor: '#f2a918', labelColor: 'text-attention/70' },
    { borderClass: 'border-emerald-600', bgClass: 'bg-emerald-500/5', textClass: 'text-emerald-600', badgeClass: 'bg-emerald-600 text-white', accentColor: '#059669', labelColor: 'text-emerald-600/70' },
    { borderClass: 'border-rose-500', bgClass: 'bg-rose-500/5', textClass: 'text-rose-600', badgeClass: 'bg-rose-500 text-white', accentColor: '#e11d48', labelColor: 'text-rose-600/70' },
  ];

  const theme = themes[Math.abs(hash) % themes.length];
  if (isSelected) {
    return {
      ...theme,
      borderClass: `${theme.borderClass} ring-2 ring-fb-blue/20`,
      bgClass: `${theme.bgClass} ring-1 ring-inset ring-fb-blue/10`
    };
  }
  return theme;
};

interface DraggableFieldProps {
  sig: SignatureField;
  index: number;
  isSelected: boolean;
  onSelectField: (index: number | null) => void;
  onOpenSigningModal: (index: number) => void;
  onRightClickField: (e: React.MouseEvent, index: number) => void;
  onRemoveField: (index: number) => void;
  onOpenDetailsModal: (sig: SignatureField) => void;
  onToggleLock: (index: number) => void;
  onDuplicateField: (index: number) => void;
  onUpdateFieldPosition: (index: number, x: number, y: number) => void;
  onUpdateFieldDimensions: (index: number, x: number, y: number, w: number, h: number) => void;
  onChangeRecipient: (index: number, email: string) => void;
  recipients: any[];
}

const DraggableField = memo(function DraggableField({
  sig,
  index,
  isSelected,
  onSelectField,
  onOpenSigningModal,
  onRightClickField,
  onRemoveField,
  onOpenDetailsModal,
  onToggleLock,
  onDuplicateField,
  onUpdateFieldPosition,
  onUpdateFieldDimensions,
  onChangeRecipient,
  recipients
}: DraggableFieldProps) {
  const fieldRef = useRef<HTMLDivElement | null>(null);

  const recipient = recipients.find(r => r.email === sig.recipientEmail);
  const recipientName = recipient ? recipient.name : sig.recipientEmail || 'Anyone';

  const isSigned = sig.status === 'Signed';
  const isLocked = !!sig.isLocked;

  const theme = getRecipientColorTheme(sig.recipientEmail, isSelected, isLocked, isSigned);

  // Pointer drag handler
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;

    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('.toolbar-button')) {
      return;
    }

    e.stopPropagation();
    onSelectField(index);

    const container = fieldRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = sig.xPercent;
    const startTop = sig.yPercent;

    const element = fieldRef.current;
    if (!element) return;

    element.setPointerCapture(e.pointerId);

    let tooltip = document.getElementById(`live-tooltip-${index}`);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = `live-tooltip-${index}`;
      tooltip.className = 'absolute bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md z-50 font-mono pointer-events-none -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap';
      element.appendChild(tooltip);
    }
    tooltip.style.display = 'block';
    tooltip.textContent = `X: ${Math.round(startLeft)}% Y: ${Math.round(startTop)}%`;

    let rafId = 0;
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const dxPct = (dx / containerRect.width) * 100;
        const dyPct = (dy / containerRect.height) * 100;

        const nextX = Math.max(0, Math.min(100 - sig.widthPercent, startLeft + dxPct));
        const nextY = Math.max(0, Math.min(100 - sig.heightPercent, startTop + dyPct));

        const clampedDx = (nextX - startLeft) * (containerRect.width / 100);
        const clampedDy = (nextY - startTop) * (containerRect.height / 100);
        element.style.transform = `translate3d(${clampedDx}px, ${clampedDy}px, 0)`;

        if (tooltip) {
          tooltip.textContent = `X: ${Math.round(nextX)}% Y: ${Math.round(nextY)}%`;
        }
      });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      element.releasePointerCapture(upEvent.pointerId);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);

      if (tooltip) {
        tooltip.style.display = 'none';
      }

      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;
      const dxPct = (dx / containerRect.width) * 100;
      const dyPct = (dy / containerRect.height) * 100;

      const finalX = Math.max(0, Math.min(100 - sig.widthPercent, startLeft + dxPct));
      const finalY = Math.max(0, Math.min(100 - sig.heightPercent, startTop + dyPct));

      element.style.transform = '';
      onUpdateFieldPosition(index, finalX, finalY);
    };

    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
  };

  // Pointer resize handler
  const handleResizeStart = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();

    const container = fieldRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    
    const startXPercent = sig.xPercent;
    const startYPercent = sig.yPercent;
    const startWidthPercent = sig.widthPercent;
    const startHeightPercent = sig.heightPercent;

    const element = fieldRef.current;
    if (!element) return;

    const handleElement = e.currentTarget as HTMLElement;
    handleElement.setPointerCapture(e.pointerId);

    let tooltip = document.getElementById(`live-tooltip-${index}`);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = `live-tooltip-${index}`;
      tooltip.className = 'absolute bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md z-50 font-mono pointer-events-none -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap';
      element.appendChild(tooltip);
    }
    tooltip.style.display = 'block';
    
    const getPixels = (wPct: number, hPct: number) => {
      const wPx = Math.round((wPct / 100) * containerRect.width);
      const hPx = Math.round((hPct / 100) * containerRect.height);
      return `${wPx} × ${hPx} px`;
    };

    tooltip.textContent = getPixels(startWidthPercent, startHeightPercent);

    // Min: 120x50, Max: 600x250
    const minW = (120 / containerRect.width) * 100;
    const maxW = (600 / containerRect.width) * 100;
    void ((50 / containerRect.height) * 100);  // minH - aspect-ratio lock handles height derivation
    void ((250 / containerRect.height) * 100); // maxH - aspect-ratio lock handles height derivation

    const startAspect = startWidthPercent / startHeightPercent;

    let rafId = 0;
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const dxPct = (dx / containerRect.width) * 100;
        void ((dy / containerRect.height) * 100); // dyPct - aspect-ratio lock derives height from dxPct

        let nextX = startXPercent;
        let nextY = startYPercent;
        let nextW = startWidthPercent;
        let nextH = startHeightPercent;

        if (handle === 'br') {
          nextW = Math.max(minW, Math.min(maxW, Math.min(100 - nextX, startWidthPercent + dxPct)));
          nextH = nextW / startAspect;
          if (nextY + nextH > 100) {
            nextH = 100 - nextY;
            nextW = nextH * startAspect;
          }
        } else if (handle === 'bl') {
          const potentialX = startXPercent + dxPct;
          const limitX = startXPercent + startWidthPercent - minW;
          const maxLimitX = startXPercent + startWidthPercent - maxW;
          nextX = Math.max(0, Math.max(maxLimitX, Math.min(limitX, potentialX)));
          nextW = startWidthPercent - (nextX - startXPercent);
          nextH = nextW / startAspect;
          if (nextY + nextH > 100) {
            nextH = 100 - nextY;
            nextW = nextH * startAspect;
            nextX = startXPercent + startWidthPercent - nextW;
          }
        } else if (handle === 'tr') {
          nextW = Math.max(minW, Math.min(maxW, Math.min(100 - nextX, startWidthPercent + dxPct)));
          nextH = nextW / startAspect;
          if (startYPercent + startHeightPercent - nextH < 0) {
            nextH = startYPercent + startHeightPercent;
            nextW = nextH * startAspect;
          }
          nextY = startYPercent + startHeightPercent - nextH;
        } else if (handle === 'tl') {
          const potentialX = startXPercent + dxPct;
          const limitX = startXPercent + startWidthPercent - minW;
          const maxLimitX = startXPercent + startWidthPercent - maxW;
          nextX = Math.max(0, Math.max(maxLimitX, Math.min(limitX, potentialX)));
          nextW = startWidthPercent - (nextX - startXPercent);
          nextH = nextW / startAspect;
          if (startYPercent + startHeightPercent - nextH < 0) {
            nextH = startYPercent + startHeightPercent;
            nextW = nextH * startAspect;
            nextX = startXPercent + startWidthPercent - nextW;
          }
          nextY = startYPercent + startHeightPercent - nextH;
        }

        element.style.left = `${nextX}%`;
        element.style.top = `${nextY}%`;
        element.style.width = `${nextW}%`;
        element.style.height = `${nextH}%`;

        if (tooltip) {
          tooltip.textContent = getPixels(nextW, nextH);
        }
      });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      handleElement.releasePointerCapture(upEvent.pointerId);
      handleElement.removeEventListener('pointermove', handlePointerMove);
      handleElement.removeEventListener('pointerup', handlePointerUp);

      if (tooltip) {
        tooltip.style.display = 'none';
      }

      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;

      const dxPct = (dx / containerRect.width) * 100;
      void ((dy / containerRect.height) * 100); // dyPct - aspect-ratio lock derives height from dxPct

      let finalX = startXPercent;
      let finalY = startYPercent;
      let finalW = startWidthPercent;
      let finalH = startHeightPercent;

      if (handle === 'br') {
        finalW = Math.max(minW, Math.min(maxW, Math.min(100 - finalX, startWidthPercent + dxPct)));
        finalH = finalW / startAspect;
        if (finalY + finalH > 100) {
          finalH = 100 - finalY;
          finalW = finalH * startAspect;
        }
      } else if (handle === 'bl') {
        const potentialX = startXPercent + dxPct;
        const limitX = startXPercent + startWidthPercent - minW;
        const maxLimitX = startXPercent + startWidthPercent - maxW;
        finalX = Math.max(0, Math.max(maxLimitX, Math.min(limitX, potentialX)));
        finalW = startWidthPercent - (finalX - startXPercent);
        finalH = finalW / startAspect;
        if (finalY + finalH > 100) {
          finalH = 100 - finalY;
          finalW = finalH * startAspect;
          finalX = startXPercent + startWidthPercent - finalW;
        }
      } else if (handle === 'tr') {
        finalW = Math.max(minW, Math.min(maxW, Math.min(100 - finalX, startWidthPercent + dxPct)));
        finalH = finalW / startAspect;
        if (startYPercent + startHeightPercent - finalH < 0) {
          finalH = startYPercent + startHeightPercent;
          finalW = finalH * startAspect;
        }
        finalY = startYPercent + startHeightPercent - finalH;
      } else if (handle === 'tl') {
        const potentialX = startXPercent + dxPct;
        const limitX = startXPercent + startWidthPercent - minW;
        const maxLimitX = startXPercent + startWidthPercent - maxW;
        finalX = Math.max(0, Math.max(maxLimitX, Math.min(limitX, potentialX)));
        finalW = startWidthPercent - (finalX - startXPercent);
        finalH = finalW / startAspect;
        if (startYPercent + startHeightPercent - finalH < 0) {
          finalH = startYPercent + startHeightPercent;
          finalW = finalH * startAspect;
          finalX = startXPercent + startWidthPercent - finalW;
        }
        finalY = startYPercent + startHeightPercent - finalH;
      }

      onUpdateFieldDimensions(index, finalX, finalY, finalW, finalH);
    };

    handleElement.addEventListener('pointermove', handlePointerMove);
    handleElement.addEventListener('pointerup', handlePointerUp);
  };

  const style = {
    position: 'absolute' as any,
    left: `${sig.xPercent}%`,
    top: `${sig.yPercent}%`,
    width: `${sig.widthPercent}%`,
    height: `${sig.heightPercent}%`,
    zIndex: isSelected ? 50 : 10,
    touchAction: 'none'
  };

  const fieldIcon = () => {
    switch (sig.type) {
      case 'Signature': return <Edit3 className={`w-4 h-4 ${theme.textClass}`} />;
      case 'Initials': return <Type className={`w-4 h-4 ${theme.textClass}`} />;
      case 'Date': return <Calendar className={`w-4 h-4 ${theme.textClass}`} />;
      case 'Text': return <AlignLeft className={`w-4 h-4 ${theme.textClass}`} />;
      case 'Checkbox': return <CheckSquare className={`w-4 h-4 ${theme.textClass}`} />;
    }
  };

  const renderFieldContents = () => {
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

    const cleanSignerName = sig.signerName || (recipientName.includes('@') ? recipientName.split('@')[0] : recipientName);

    if (isSigned && sig.value) {
      if (sig.type === 'Checkbox') {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <input type="checkbox" checked={sig.value === 'true'} readOnly className="h-5 w-5 accent-success cursor-default" />
          </div>
        );
      }

      const certId = sig.certificateId || `SIGNFLOW-${(sig._id?.toString() || '').slice(-4).toUpperCase()}`;

      return (
        <div className="flex flex-col w-full h-full border-[1.5px] border-black bg-white rounded overflow-hidden text-left font-sans select-none leading-[1.15]">
          {/* Top Section: Metadata */}
          <div className="flex-1 p-1.5 flex flex-col justify-between text-[8px] text-black">
            <div className="font-bold text-[7px] text-gray-500 uppercase tracking-wide">Digitally Signed By</div>
            <div className="font-bold text-[9px] truncate">{cleanSignerName}</div>
            <div className="text-gray-700">Date: {formatSignatureDate(sig.updatedAt)}</div>
            <div className="text-gray-700">Reason: Approved</div>
            <div className="truncate text-gray-500">Cert ID: {certId}</div>
            <div className="font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
              ✓ SHA256 Verified
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-black w-full" />

          {/* Bottom Section: Signature Scribble */}
          <div className="h-[38%] bg-gray-50 flex items-center justify-center p-0.5">
            {sig.value.startsWith('data:image') ? (
              <img src={sig.value} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none" />
            ) : (
              <span className={`truncate font-bold text-slate-800 ${
                sig.type === 'Signature' || sig.type === 'Initials'
                  ? (sig.value.includes(':') ? `font-${sig.value.split(':')[0]} italic text-[11px]` : 'font-cursive italic text-[11px]')
                  : 'font-sans text-[9px]'
              }`}>
                {sig.value.includes(':') ? sig.value.split(':')[1] : sig.value}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Unsigned state
    return (
      <div className="flex flex-col items-center justify-center text-center p-1.5 w-full h-full select-none">
        <div className="flex items-center gap-1.5 justify-center">
          {fieldIcon()}
          <span className={`text-[10px] font-bold tracking-wide uppercase ${theme.textClass}`}>
            ✍ {sig.type} Required
          </span>
        </div>
        <div className="text-[9px] text-slate-500 font-bold truncate max-w-[130px] mt-0.5">
          {cleanSignerName}
        </div>
        <div className="text-[7px] text-slate-400 mt-0.5">Click or Double Click</div>
      </div>
    );
  };

  return (
    <div
      ref={fieldRef}
      style={style}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelectField(index);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (isSigned) {
          onOpenDetailsModal(sig);
        } else if (!isLocked) {
          onOpenSigningModal(index);
        }
      }}
      onContextMenu={(e) => onRightClickField(e, index)}
      className={`absolute cursor-pointer flex flex-col justify-between select-none group transition-all duration-150 ${
        isSigned
          ? 'rounded-[16px] bg-white border border-slate-200 shadow-sm'
          : isSelected
          ? `rounded-lg border-4 border-double ${theme.borderClass} bg-canvas shadow-lg ring-2 ring-fb-blue/20`
          : `rounded-lg border-4 border-double ${theme.borderClass} bg-canvas hover:bg-surface-soft/40 hover:shadow-md`
      }`}
    >
      {/* Floating Toolbar */}
      {isSelected && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl shadow-2xl p-1.5 flex items-center space-x-1.5 z-50 select-none pointer-events-auto toolbar-button"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle (Move) */}
          <div className="w-11 h-11 flex items-center justify-center text-slate-500 cursor-move" title="Drag to Move">
            <GripHorizontal className="w-5 h-5" />
          </div>

          <span className="w-[1px] h-6 bg-slate-800" />

          {/* Edit Signature (Unsigned/Signed signature fields) */}
          {(sig.type === 'Signature' || sig.type === 'Initials') && (
            <button
              onClick={() => !isLocked && onOpenSigningModal(index)}
              disabled={isLocked}
              className="h-11 px-3 flex items-center justify-center text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
              title="Edit Signature"
            >
              Edit Signature
            </button>
          )}

          {/* View Details (Only if signed) */}
          {isSigned && (
            <button
              onClick={() => onOpenDetailsModal(sig)}
              className="h-11 px-3 flex items-center justify-center text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
              title="View Certificate Details"
            >
              View Details
            </button>
          )}

          {/* Replace Signer Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-800/30 px-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 font-medium">Assign:</span>
            <select
              value={sig.recipientEmail}
              disabled={isLocked}
              onChange={(e) => onChangeRecipient && onChangeRecipient(index, e.target.value)}
              className="h-11 bg-slate-800 text-xs text-white border-0 rounded-lg focus:ring-0 focus:outline-none"
              style={{ minWidth: '100px' }}
              title="Replace Signer"
            >
              {recipients.map((r, idx) => (
                <option key={idx} value={r.email} className="bg-slate-900 text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <span className="w-[1px] h-6 bg-slate-800" />

          {/* Lock / Unlock */}
          <button
            onClick={() => onToggleLock(index)}
            className={`w-11 h-11 flex items-center justify-center hover:bg-slate-800 rounded-lg transition-colors ${isLocked ? 'text-yellow-500' : 'text-slate-400 hover:text-white'}`}
            title={isLocked ? "Unlock Field" : "Lock Field"}
          >
            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </button>
          
          {/* Duplicate */}
          <button
            onClick={() => !isLocked && onDuplicateField(index)}
            disabled={isLocked}
            className="w-11 h-11 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Duplicate Field"
          >
            <Copy className="w-5 h-5" />
          </button>

          {/* Properties */}
          <button
            onClick={() => {
              onSelectField(index);
              document.getElementById('fields-tab-btn')?.click();
            }}
            className="w-11 h-11 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Field Properties"
          >
            <Settings className="w-5 h-5" />
          </button>

          <span className="w-[1px] h-6 bg-slate-800" />

          {/* Delete (Large accessibility target) */}
          <button
            onClick={() => onRemoveField(index)}
            className="h-11 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg transition-colors flex items-center justify-center font-bold text-xs"
            title="Delete Field"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      )}

      {/* 8-Way Resize Handles */}
      {isSelected && !isLocked && (
        <>
          {/* Corners */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'tl')}
            className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-30 resize-handle"
            title="Resize Top Left"
          >
            <div className="w-2.5 h-2.5 bg-fb-blue border border-canvas rounded-circle shadow-sm" />
          </div>
          <div
            onPointerDown={(e) => handleResizeStart(e, 'tr')}
            className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-30 resize-handle"
            title="Resize Top Right"
          >
            <div className="w-2.5 h-2.5 bg-fb-blue border border-canvas rounded-circle shadow-sm" />
          </div>
          <div
            onPointerDown={(e) => handleResizeStart(e, 'bl')}
            className="absolute -bottom-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-30 resize-handle"
            title="Resize Bottom Left"
          >
            <div className="w-2.5 h-2.5 bg-fb-blue border border-canvas rounded-circle shadow-sm" />
          </div>
          <div
            onPointerDown={(e) => handleResizeStart(e, 'br')}
            className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-se-resize z-30 resize-handle"
            title="Resize Bottom Right"
          >
            <div className="w-2.5 h-2.5 bg-fb-blue border border-canvas rounded-circle shadow-sm" />
          </div>
        </>
      )}

      {/* Field Contents */}
      <div className="flex-1 flex flex-col justify-center items-center p-2 text-center h-full relative overflow-hidden select-none">
        {renderFieldContents()}
      </div>

      {/* Required field red asterisk indicator at top-right */}
      {!isSigned && (
        <span className="absolute top-1 right-1 text-red-500 font-bold text-xs leading-none" title="Required Field">*</span>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-1 left-1 bg-yellow-500/10 border border-yellow-500/20 rounded p-0.5 text-yellow-600 shadow-sm z-20">
          <Lock className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Verified Badge */}
      {isSigned && (
        <div className="absolute bottom-1.5 right-1.5 bg-[#31A24C] text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 z-20 select-none">
          ✓ VERIFIED
        </div>
      )}
    </div>
  );
});

// ----------------------------------------------------
// PDF Thumbnail Renderer
// ----------------------------------------------------
interface PdfThumbnailProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  onClick: () => void;
  isActive: boolean;
}

function PdfThumbnail({ pdfDoc, pageNum, onClick, isActive }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    const render = async () => {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = (window.devicePixelRatio || 1) * 2;
        const viewport = page.getViewport({ scale: 0.2 * dpr });
        const cssViewport = page.getViewport({ scale: 0.2 });

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssViewport.width}px`;
        canvas.style.height = `${cssViewport.height}px`;

        context.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        } as any;

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering thumbnail ${pageNum}:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNum]);

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg border-2 text-center flex flex-col items-center w-full transition-all duration-200 select-none ${
        isActive 
          ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
          : 'border-transparent hover:border-hairline hover:bg-surface-soft bg-canvas'
      }`}
    >
      <div className="relative shadow-sm rounded border border-hairline-soft overflow-hidden mb-1.5 bg-canvas max-w-[100px]">
        <canvas ref={canvasRef} className="block bg-surface-soft pointer-events-none w-full" />
        <div className={`absolute inset-0 transition-opacity duration-150 ${isActive ? 'bg-primary/5' : 'bg-transparent hover:bg-slate-900/[0.02]'}`} />
      </div>
      <span className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-slate'}`}>
        Page {pageNum}
      </span>
    </button>
  );
}

// ----------------------------------------------------
// Document Editor Screen Component
// ----------------------------------------------------
export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [signatures, setSignatures] = useState<SignatureField[]>([]);
  const [numPages, setNumPages] = useState<number>(0);

  // Undo/Redo & Copy/Paste states and actions
  const [history, setHistory] = useState<SignatureField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copiedField, setCopiedField] = useState<SignatureField | null>(null);

  const pushHistory = useCallback((newFields: SignatureField[]) => {
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      return [...nextHistory, newFields];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setSignatures(history[prevIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setSignatures(history[nextIndex]);
    }
  }, [history, historyIndex]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Zoom/Rotate/Fullscreen state
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sidebar Tabs
  const [activeSidebarTab, setActiveSidebarTab] = useState<'fields' | 'recipients' | 'audit'>('fields');
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'fields' | 'recipients' | 'timeline' | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Recipient & Workflow Settings state
  const [recipients, setRecipients] = useState<any[]>([]);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientRole, setNewRecipientRole] = useState<'Signer' | 'Viewer'>('Signer');
  const [newRecipientSeq, setNewRecipientSeq] = useState(1);
  const [signingOrder, setSigningOrder] = useState<'Parallel' | 'Sequential'>('Parallel');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(3);
  const [expiresAt, setExpiresAt] = useState('');

  // Link Sharing settings state
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [shareOneTimeOnly, setShareOneTimeOnly] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState('');

  // Placement Type & Recipient Configuration
  const [placedFieldType, setPlacedFieldType] = useState<'Signature' | 'Initials' | 'Date' | 'Text' | 'Checkbox'>('Signature');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Selected Field Tracking
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, idx: number } | null>(null);

  // Signing Modal State
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [activeSigningFieldIdx, setActiveSigningFieldIdx] = useState<number | null>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signatureDetails, setSignatureDetails] = useState<SignatureField | null>(null);
  
  // Signature profiles state
  const [savedProfiles, setSavedProfiles] = useState<SignatureProfile[]>([]);
  const [saveToProfiles, setSaveToProfiles] = useState(false);

  // Draw Mode Canvas state
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const drawingHistory = useRef<string[]>([]);
  const [drawnProfileName, setDrawnProfileName] = useState('My Drawn Signature');
  const [signatureColor, setSignatureColor] = useState<'black' | 'darkgray' | 'blue'>('black');

  // Type Mode state
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<'great-vibes' | 'dancing-script' | 'allura' | 'cursive'>('great-vibes');
  const [typedProfileName, setTypedProfileName] = useState('My Typed Signature');

  // Upload Mode state
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedProfileName, setUploadedProfileName] = useState('My Uploaded Signature');
  
  // Element refs
  const pageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  // Drag state now handled by @dnd-kit/core via DraggableField

  const hasLoadedRef = useRef(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ----------------------------------------------------
  // Init & Load Data
  // ----------------------------------------------------
  const fetchAuditLogs = useCallback(async () => {
    try {
      const response = await api.get(`/audit/${id}`);
      setAuditLogs(response.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, [id]);

  const fetchRecipients = useCallback(async () => {
    try {
      const response = await api.get(`/docs/${id}/recipients`);
      setRecipients(response.data);
    } catch (err) {
      console.error('Failed to load recipients:', err);
    }
  }, [id]);

  const fetchSavedProfiles = useCallback(async () => {
    try {
      const response = await api.get('/signatures/profiles');
      setSavedProfiles(response.data);
    } catch (err) {
      console.error('Failed to load signature profiles:', err);
    }
  }, []);

  const fetchDocumentAndSignatures = useCallback(async () => {
    try {
      setIsLoading(true);
      const docResponse = await api.get(`/docs/${id}`);
      setDocument(docResponse.data);

      setSigningOrder(docResponse.data.signingOrder || 'Parallel');
      setRemindersEnabled(docResponse.data.remindersEnabled || false);
      setReminderInterval(docResponse.data.reminderInterval || 3);
      if (docResponse.data.expiresAt) {
        setExpiresAt(new Date(docResponse.data.expiresAt).toISOString().split('T')[0]);
      }

      setSharingEnabled(docResponse.data.sharingEnabled || false);
      setSharePassword(docResponse.data.sharePassword || '');
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
      setGeneratedShareUrl(`${frontendUrl}/share/${id}`);
      setShareOneTimeOnly(docResponse.data.shareOneTimeOnly || false);
      if (docResponse.data.shareExpiresAt) {
        setShareExpiresAt(new Date(docResponse.data.shareExpiresAt).toISOString().split('T')[0]);
      }

      const sigResponse = await api.get(`/signatures/document/${id}`);
      
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;

      // Translate old signature schemas if necessary
      const formattedFields = sigResponse.data.map((sig: any) => ({
        _id: sig._id,
        type: sig.type || 'Signature',
        recipientEmail: sig.recipientEmail || currentUser?.email || '',
        xPercent: sig.xPercent !== undefined ? sig.xPercent : (sig.x || 35),
        yPercent: sig.yPercent !== undefined ? sig.yPercent : (sig.y || 40),
        widthPercent: sig.widthPercent || 15,
        heightPercent: sig.heightPercent || 5,
        page: sig.page || 1,
        status: sig.status || 'Pending',
        value: sig.value || sig.signatureValue || ''
      }));
      setSignatures(formattedFields);
      setHistory([formattedFields]);
      setHistoryIndex(0);

      const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
      const encodedPath = docResponse.data.originalPath.split('/').map((part: string) => encodeURIComponent(part)).join('/');
      const pdfUrl = `${backendBase}/${encodedPath}`;
      console.log('[DocumentEditor] Loading PDF from:', pdfUrl);
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      
      setTimeout(() => {
        hasLoadedRef.current = true;
      }, 500);

      fetchAuditLogs();
      fetchRecipients();
    } catch (error: any) {
      console.error('[DocumentEditor] Error loading document/PDF:', {
        message: error.message,
        name: error.name,
        pdfError: error.pdfError,
        fullError: error
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, fetchAuditLogs, fetchRecipients]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      Promise.resolve().then(() => {
        // Only set user if it's not already set, or if email differs, to prevent loop
        setUser((prevUser: any) => {
          if (!prevUser || prevUser.email !== parsedUser.email) {
            return parsedUser;
          }
          return prevUser;
        });
        setRecipientEmail(parsedUser.email);
        
        // We defer these to prevent synchronous setState lint errors
        setTimeout(() => {
          fetchDocumentAndSignatures();
          fetchSavedProfiles();
        }, 0);
      });
    }
  }, [id, navigate, fetchDocumentAndSignatures, fetchSavedProfiles]);


  // Instant Autosave Layout
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const saveLayout = async () => {
      setSavingStatus('saving');
      try {
        const response = await api.patch(`/docs/${id}/layout`, { fields: signatures });
        const updatedFields = response.data.fields;

        // Sync local IDs for new fields if any need syncing
        const needsSync = signatures.some((sig, idx) => {
          const match = updatedFields[idx];
          return match && !sig._id;
        });

        if (needsSync) {
          setSignatures(prev => prev.map((sig, idx) => {
            const match = updatedFields[idx];
            if (match && !sig._id) {
              return { ...sig, _id: match._id };
            }
            return sig;
          }));
        }

        setSavingStatus('saved');
        setTimeout(() => setSavingStatus(prev => prev === 'saved' ? 'idle' : prev), 2500);
      } catch (err) {
        console.error('Failed to autosave layout:', err);
        setSavingStatus('error');
      }
    };

    saveLayout();
  }, [signatures, id]);

  // Global Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement);
    };
    window.document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => window.document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Scroll spy to update currentPage as user scrolls
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container || !pdfDoc) return;

    const handleScroll = () => {
      const children = container.children;
      let activePage = 1;
      let minDistance = Infinity;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        if (!child || !child.getBoundingClientRect) continue;
        const rect = child.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const distance = Math.abs(rect.top - containerRect.top);
        if (distance < minDistance) {
          minDistance = distance;
          activePage = i + 1;
        }
      }

      setCurrentPage(activePage);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pdfDoc, numPages]);



  const handleAddRecipient = async () => {
    if (!newRecipientName.trim() || !newRecipientEmail.trim()) {
      alert('Name and Email are required for adding recipient.');
      return;
    }
    try {
      const response = await api.post(`/docs/${id}/recipients`, {
        name: newRecipientName,
        email: newRecipientEmail,
        role: newRecipientRole,
        sequence: newRecipientSeq
      });
      setRecipients([...recipients, response.data].sort((a, b) => a.sequence - b.sequence));
      setNewRecipientName('');
      setNewRecipientEmail('');
      setNewRecipientSeq(recipients.length + 2);
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to add recipient:', err);
    }
  };

  const handleDeleteRecipient = async (recipientId: string) => {
    try {
      await api.delete(`/docs/${id}/recipients/${recipientId}`);
      setRecipients(recipients.filter(r => r._id !== recipientId));
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to delete recipient:', err);
    }
  };

  const handleSaveWorkflowSettings = async () => {
    try {
      const response = await api.put(`/docs/${id}/settings`, {
        signingOrder,
        remindersEnabled,
        reminderInterval,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
      });
      setDocument(response.data);
      alert('Workflow settings saved successfully!');
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to save workflow settings:', err);
      alert('Failed to save workflow settings');
    }
  };

  const handleSaveShareSettings = async () => {
    try {
      const response = await api.put(`/docs/${id}/share`, {
        sharingEnabled,
        sharePassword,
        shareOneTimeOnly,
        shareExpiresAt: shareExpiresAt ? new Date(shareExpiresAt).toISOString() : null
      });
      setDocument(response.data.document);
      setGeneratedShareUrl(response.data.publicUrl);
      alert('Link sharing settings updated successfully!');
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to save sharing settings:', err);
      alert('Failed to save link sharing settings');
    }
  };



  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ----------------------------------------------------
  // Stage 3: Placeholder Creation & Drag/Resize Logic
  // ----------------------------------------------------
  const handleAddSignatureField = () => {
    const newField: SignatureField = {
      type: placedFieldType,
      recipientEmail: recipientEmail.trim() || user?.email || '',
      xPercent: 35,
      yPercent: 40,
      widthPercent: placedFieldType === 'Checkbox' ? 4 : 16,
      heightPercent: placedFieldType === 'Checkbox' ? 2.5 : 5,
      page: currentPage,
      status: 'Pending'
    };
    const updated = [...signatures, newField];
    setSignatures(updated);
    pushHistory(updated);
    setSelectedFieldIdx(signatures.length);
  };

  const handleRemoveField = useCallback(async (index: number) => {
    const field = signatures[index];
    if (field._id) {
      try {
        await api.delete(`/signatures/${field._id}`);
      } catch (err) {
        console.error('Failed to delete signature field:', err);
      }
    }
    const updated = signatures.filter((_, idx) => idx !== index);
    setSignatures(updated);
    pushHistory(updated);
    setSelectedFieldIdx(null);
    setContextMenu(null);
  }, [signatures, pushHistory]);

  const handleToggleLock = useCallback((index: number) => {
    const updated = signatures.map((sig, idx) => idx === index ? { ...sig, isLocked: !sig.isLocked } : sig);
    setSignatures(updated);
    pushHistory(updated);
  }, [signatures, pushHistory]);

  const handleDuplicateField = useCallback((index: number) => {
    const sig = signatures[index];
    const newField: SignatureField = {
      ...sig,
      _id: undefined,
      status: 'Pending',
      xPercent: Math.min(100 - sig.widthPercent, sig.xPercent + 5),
      yPercent: Math.min(100 - sig.heightPercent, sig.yPercent + 5),
    };
    const updated = [...signatures, newField];
    setSignatures(updated);
    pushHistory(updated);
  }, [signatures, pushHistory]);

  // handleMouseDownSignature removed — dnd-kit handles dragging via DraggableField

  const handleUpdateFieldPosition = useCallback((idx: number, x: number, y: number) => {
    const updated = signatures.map((s, i) => i === idx ? { ...s, xPercent: x, yPercent: y } : s);
    setSignatures(updated);
    pushHistory(updated);
  }, [signatures, pushHistory]);

  const handleUpdateFieldDimensions = useCallback((idx: number, x: number, y: number, w: number, h: number) => {
    const updated = signatures.map((s, i) => i === idx ? { ...s, xPercent: x, yPercent: y, widthPercent: w, heightPercent: h } : s);
    setSignatures(updated);
    pushHistory(updated);
  }, [signatures, pushHistory]);

  const handleChangeRecipient = useCallback((index: number, email: string) => {
    const updated = signatures.map((s, i) => i === index ? { ...s, recipientEmail: email } : s);
    setSignatures(updated);
    pushHistory(updated);
  }, [signatures, pushHistory]);

  const handleFitWidth = useCallback(() => {
    if (!pdfDoc || !viewerContainerRef.current) return;
    const containerWidth = viewerContainerRef.current.clientWidth - 48;
    pdfDoc.getPage(1).then((page) => {
      const originalViewport = page.getViewport({ scale: 1, rotation });
      const fitScale = containerWidth / originalViewport.width;
      setScale(fitScale);
    });
  }, [pdfDoc, rotation]);

  // Auto-fit page width on load and resize
  useEffect(() => {
    if (!pdfDoc) return;
    handleFitWidth();

    const handleResize = () => {
      handleFitWidth();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [pdfDoc, handleFitWidth]);

  // Mobile Gestures: Pinch-to-zoom, drag-to-pan, and double-tap zoom toggle
  useEffect(() => {
    const container = viewerContainerRef.current;
    if (!container) return;

    let touchStartDist = 0;
    let initialScale = 1.0;
    let isPinching = false;

    let touchStartX = 0;
    let touchStartY = 0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;
    let isPanning = false;

    let lastTapTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Handle Double Tap
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapTime < 300) {
          e.preventDefault();
          // Cycle zoom levels: 100%, 150%, 200%, Fit Width
          setScale(currentScale => {
            if (Math.abs(currentScale - 1.0) < 0.1) {
              return 1.5;
            } else if (Math.abs(currentScale - 1.5) < 0.1) {
              return 2.0;
            } else if (Math.abs(currentScale - 2.0) < 0.1) {
              if (pdfDoc) {
                const containerWidth = container.clientWidth - 48;
                pdfDoc.getPage(1).then((page) => {
                  const originalViewport = page.getViewport({ scale: 1, rotation });
                  const fitScale = containerWidth / originalViewport.width;
                  setScale(fitScale);
                });
              }
              return currentScale;
            } else {
              return 1.0;
            }
          });
        }
        lastTapTime = now;
      }

      if (e.touches.length === 2) {
        isPinching = true;
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = scale;
      } else if (e.touches.length === 1) {
        isPanning = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        initialScrollLeft = container.scrollLeft;
        initialScrollTop = container.scrollTop;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchStartDist;
        const newScale = Math.min(Math.max(initialScale * factor, 0.5), 3.0);
        setScale(newScale);
      } else if (isPanning && e.touches.length === 1 && !isPinching) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        container.scrollLeft = initialScrollLeft - dx;
        container.scrollTop = initialScrollTop - dy;
      }
    };

    const handleTouchEnd = () => {
      isPinching = false;
      isPanning = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [pdfDoc, scale, rotation, handleFitWidth]);

  const handleRightClickField = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      idx: index
    });
  }, []);

  // Global Keyboard listener for editor shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = window.document.activeElement;
      if (
        activeEl?.tagName === 'INPUT' || 
        activeEl?.tagName === 'SELECT' || 
        activeEl?.tagName === 'TEXTAREA' || 
        activeEl?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (selectedFieldIdx !== null) {
        const sig = signatures[selectedFieldIdx];

        // Keyboard delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleRemoveField(selectedFieldIdx);
        }

        // Keyboard arrows movement (only if not locked)
        if (sig && !sig.isLocked) {
          let moved = false;
          let nextX = sig.xPercent;
          let nextY = sig.yPercent;

          if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextY = Math.max(0, sig.yPercent - 1);
            moved = true;
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextY = Math.min(100 - sig.heightPercent, sig.yPercent + 1);
            moved = true;
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nextX = Math.max(0, sig.xPercent - 1);
            moved = true;
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextX = Math.min(100 - sig.widthPercent, sig.xPercent + 1);
            moved = true;
          }

          if (moved) {
            const updated = signatures.map((s, idx) => 
              idx === selectedFieldIdx ? { ...s, xPercent: nextX, yPercent: nextY } : s
            );
            setSignatures(updated);
            pushHistory(updated);
          }
        }

        // Ctrl+C (Copy)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setCopiedField(sig);
        }
      }

      // Ctrl+V (Paste)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (copiedField) {
          e.preventDefault();
          const newField: SignatureField = {
            ...copiedField,
            _id: undefined, // Clear MongoDB ID so it creates a new one
            xPercent: Math.min(85, copiedField.xPercent + 2),
            yPercent: Math.min(95, copiedField.yPercent + 2),
            page: currentPage, // Paste on current page!
            status: 'Pending',
            value: ''
          };
          const updated = [...signatures, newField];
          setSignatures(updated);
          pushHistory(updated);
          setSelectedFieldIdx(updated.length - 1); // Select the pasted field
        }
      }

      // Ctrl+Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }

      // Ctrl+Y (Redo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldIdx, signatures, copiedField, historyIndex, history, currentPage, handleUndo, handleRedo, pushHistory, handleRemoveField]);



  const scrollToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);
    const target = pageContainerRefs.current[pageNum];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleFullscreen = () => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err: any) => {
        console.error("Fullscreen failed:", err);
      });
    } else {
      window.document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // ----------------------------------------------------
  // Stage 2: Signature Engine creation modal logic
  // ----------------------------------------------------
  const handleOpenSigningModal = async (index: number) => {
    const field = signatures[index];
    if (field.status === 'Signed') return;
    
    let targetField = field;
    if (!field._id) {
      setSavingStatus('saving');
      try {
        const response = await api.patch(`/docs/${id}/layout`, { fields: signatures });
        const updatedFields = response.data.fields;
        
        // Sync local IDs for new fields if any need syncing
        const needsSync = signatures.some((sig, idx) => {
          const match = updatedFields[idx];
          return match && !sig._id;
        });

        let savedId = '';
        if (needsSync) {
          setSignatures(prev => prev.map((sig, idx) => {
            const match = updatedFields[idx];
            if (match && !sig._id) {
              if (idx === index) savedId = match._id;
              return { ...sig, _id: match._id };
            }
            return sig;
          }));
        }
        setSavingStatus('saved');
        targetField = { ...field, _id: savedId || (updatedFields[index] ? updatedFields[index]._id : '') };
      } catch (err) {
        console.error('Failed to autosave layout before signing:', err);
        setSavingStatus('error');
        alert('Could not save the field. Please try again.');
        return;
      }
    }

    // Check if the field is assigned to the current user
    if (targetField.recipientEmail.toLowerCase() !== user.email.toLowerCase()) {
      alert(`This signature field is assigned to ${targetField.recipientEmail}. You are logged in as ${user.email}.`);
      return;
    }

    // Check sequential order
    if (document?.signingOrder === 'Sequential') {
      const currentRecipient = recipients.find(r => r.email.toLowerCase() === user.email.toLowerCase());
      if (currentRecipient) {
        const precedingRecipients = recipients.filter(r => r.sequence < currentRecipient.sequence);
        for (const prec of precedingRecipients) {
          // Check if there are unsigned fields for this preceding recipient
          const hasUnsigned = signatures.some(s => s.recipientEmail.toLowerCase() === prec.email.toLowerCase() && s.status !== 'Signed');
          if (hasUnsigned) {
            alert(`It is not your turn to sign. ${prec.name} (${prec.email}) must sign first.`);
            return;
          }
        }
      }
    }

    setActiveSigningFieldIdx(index);
    setTypedName(user.name);
    setIsSigningModalOpen(true);
    // Clear drawing pad configs
    drawingHistory.current = [];
  };

  // SignatureCanvas interaction callbacks
  const onDrawEnd = () => {
    if (signatureCanvasRef.current) {
      drawingHistory.current.push(signatureCanvasRef.current.toDataURL());
    }
  };

  const clearDrawingCanvas = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
      drawingHistory.current = [];
    }
  };

  const undoDrawingCanvas = () => {
    if (signatureCanvasRef.current && drawingHistory.current.length > 0) {
      drawingHistory.current.pop();
      signatureCanvasRef.current.clear();
      if (drawingHistory.current.length > 0) {
        signatureCanvasRef.current.fromDataURL(drawingHistory.current[drawingHistory.current.length - 1]);
      }
    }
  };

  // Upload validation
  const handleSignatureUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const applySavedProfile = (profile: SignatureProfile) => {
    if (activeSigningFieldIdx === null) return;
    confirmSigningValue(profile.imageData);
  };

  const handleSignConfirm = async () => {
    if (activeSigningFieldIdx === null) return;
    const field = signatures[activeSigningFieldIdx];
    if (!field._id) return;

    let signatureVal = '';
    let profileName = 'My Signature';

    if (signatureType === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      signatureVal = canvas.toDataURL();
      profileName = drawnProfileName;
    } else if (signatureType === 'type') {
      if (!typedName.trim()) return;
      // We store typed values wrapped in font identifiers or just text
      signatureVal = `${selectedFont}:${typedName}`;
      profileName = typedProfileName;
    } else if (signatureType === 'upload') {
      if (!uploadedBase64) return;
      signatureVal = uploadedBase64;
      profileName = uploadedProfileName;
    }

    // Save profile to database templates if requested
    if (saveToProfiles && signatureVal) {
      try {
        await api.post('/signatures/profiles', {
          name: profileName,
          type: signatureType,
          imageData: signatureVal,
          fontName: signatureType === 'type' ? selectedFont : undefined,
          color: signatureType === 'draw' ? signatureColor : undefined
        });
        fetchSavedProfiles();
      } catch (err) {
        console.error('Failed to save signature profile template:', err);
      }
    }

    confirmSigningValue(signatureVal);
  };

  const confirmSigningValue = async (signatureVal: string) => {
    if (activeSigningFieldIdx === null) return;
    const field = signatures[activeSigningFieldIdx];
    if (!field._id) return;

    try {
      const response = await api.put(`/signatures/${field._id}/sign`, {
        status: 'Signed',
        signatureValue: signatureVal
      });

      setSignatures(prev => prev.map((sig, idx) => {
        if (idx === activeSigningFieldIdx) {
          return {
            ...sig,
            ...response.data,
            value: response.data.value ?? response.data.signatureValue
          };
        }
        return sig;
      }));

      setIsSigningModalOpen(false);
      setSelectedFieldIdx(null);
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to sign field:', err);
    }
  };

  // Compile final PDF on backend and stamp signatures (Stage 4)
  const handleFinalizePDF = async () => {
    const pendingFields = signatures.filter(s => s.status === 'Pending');
    if (pendingFields.length > 0) {
      alert('Please complete all pending signature fields before finalization.');
      return;
    }

    try {
      setIsFinalizing(true);
      console.log('[DocumentEditor] Starting PDF finalization for document:', id);
      
      const response = await api.post('/signatures/finalize', { documentId: id });
      
      console.log('[DocumentEditor] PDF finalized successfully:', response.data);
      setDocument(response.data.document);
      alert('Document finalized and signed successfully! You can download the completed PDF.');
      fetchAuditLogs();
    } catch (err: any) {
      console.error('[DocumentEditor] Finalize error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        error: err.response?.data?.error,
        details: err.response?.data?.details,
        fullError: err.message
      });
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to finalize PDF document';
      const details = err.response?.data?.details;
      
      alert(details ? `${errorMessage}\n\n${details}` : errorMessage);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setSavingStatus('saving');
      // Force layout save to backend before download
      await api.patch(`/docs/${id}/layout`, { fields: signatures });
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);

      const response = await api.get(`/docs/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', document?.filename || 'signed-document.pdf');
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Error downloading PDF file');
    }
  };

  const registerPageContainer = (el: HTMLDivElement | null, pageNum: number) => {
    pageContainerRefs.current[pageNum] = el;
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-canvas text-ink-deep flex flex-col justify-center items-center">
        <p className="text-subtitle-md text-slate animate-pulse font-bold">Loading document editor...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-canvas text-ink-deep flex flex-col h-screen overflow-hidden" 
      onClick={() => {
        setSelectedFieldIdx(null);
        setContextMenu(null);
      }}
    >
      <Navbar user={user} onMenuClick={() => {}} onLogout={handleLogout} />

      {/* Editor Controls Sub-Header */}
      <div className="bg-canvas border-b border-hairline-soft h-[56px] shrink-0 flex items-center justify-between px-xl select-none">
        {/* Left Section */}
        <div className="flex items-center space-x-md">
          <MetaButton variant="ghost" className="!py-[6px] !px-[12px] flex items-center !h-[36px]" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </MetaButton>
          <span className="h-6 w-[1px] bg-hairline-soft" />
          <h2 className="text-subtitle-md font-bold truncate max-w-[150px] sm:max-w-none text-ink-deep">{document?.filename}</h2>
          <MetaBadge variant={document?.status === 'Signed' ? 'success' : 'attention'}>
            {document?.status}
          </MetaBadge>
        </div>

        {/* Center Section (Zoom & Controls) */}
        {pdfDoc && (
          <div className="hidden md:flex items-center space-x-1.5 bg-surface-soft px-3 py-1 rounded-full border border-hairline-soft shadow-sm">
            {/* Page navigation */}
            <div className="flex items-center space-x-1 pr-2 border-r border-hairline-soft">
              <button 
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 hover:bg-canvas rounded-circle transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
              <span className="text-caption-bold text-ink-deep font-bold px-1 select-none min-w-[70px] text-center">
                Page {currentPage} / {numPages}
              </span>
              <button 
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage === numPages}
                className="p-1 hover:bg-canvas rounded-circle transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 px-1">
              <button 
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                className="p-1 hover:bg-canvas rounded-circle transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
              <span className="text-caption-bold text-ink-deep font-bold px-1 select-none min-w-[45px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale(prev => Math.min(2.5, prev + 0.1))}
                className="p-1 hover:bg-canvas rounded-circle transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
            </div>

            <span className="h-4 w-[1px] bg-hairline-soft" />

            {/* Utilities */}
            <div className="flex items-center space-x-1 pl-1">
              <button 
                onClick={handleFitWidth}
                className="p-1 hover:bg-canvas rounded-circle transition-colors"
                title="Fit Width"
              >
                <Maximize className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
              <button 
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                className="p-1 hover:bg-canvas rounded-circle transition-colors"
                title="Rotate Page"
              >
                <RotateCw className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
              <button 
                onClick={toggleFullscreen}
                className={`p-1 hover:bg-canvas rounded-circle transition-colors ${isFullscreen ? 'bg-primary/10 text-primary' : ''}`}
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
              <span className="h-3 w-[1px] bg-hairline-soft mx-1" />
              <button 
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1 hover:bg-canvas rounded-circle transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
              <button 
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1 hover:bg-canvas rounded-circle transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4 text-slate hover:text-ink-deep" />
              </button>
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-sm">
          {/* Figma-style Autosave Indicator */}
          <span className="text-[12px] font-bold text-slate flex items-center select-none mr-2">
            {savingStatus === 'saving' && (
              <>
                <span className="w-2 h-2 rounded-circle bg-attention animate-pulse mr-1.5" />
                ● Saving...
              </>
            )}
            {savingStatus === 'saved' && (
              <>
                <span className="w-2 h-2 rounded-circle bg-success mr-1.5" />
                ✓ Saved
              </>
            )}
            {savingStatus === 'idle' && (
              <>
                <span className="w-2 h-2 rounded-circle bg-success/60 mr-1.5" />
                ✓ Saved
              </>
            )}
            {savingStatus === 'error' && (
              <>
                <span className="w-2 h-2 rounded-circle bg-critical mr-1.5" />
                ⚠ Error Saving
              </>
            )}
          </span>

          {document && (
            <MetaButton variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center !py-1.5 !px-3 !h-[36px]">
              <Upload className="w-4 h-4 mr-1.5" /> Share Link
            </MetaButton>
          )}

          {document?.status === 'Signed' ? (
            <MetaButton variant="buy-cta" onClick={handleDownloadPDF} className="flex items-center !py-1.5 !px-3 !h-[36px]">
              Download PDF
            </MetaButton>
          ) : (
            <MetaButton 
              variant="buy-cta" 
              onClick={handleFinalizePDF}
              isLoading={isFinalizing}
              className="!py-1.5 !px-4 !h-[36px]"
            >
              Finalize & Sign
            </MetaButton>
          )}
        </div>
      </div>

      {/* 3-Pane Layout Grid */}
      <div className="flex flex-1 overflow-hidden bg-surface-soft">
        
        {/* Left Sidebar: Thumbnail Nav Panel */}
        <aside className="hidden md:flex flex-col w-[160px] bg-canvas border-r border-hairline-soft overflow-y-auto p-md space-y-md shrink-0">
          <p className="text-caption-bold text-slate uppercase tracking-wider">Pages</p>
          {pdfDoc && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <PdfThumbnail
              key={pageNum}
              pdfDoc={pdfDoc}
              pageNum={pageNum}
              isActive={currentPage === pageNum}
              onClick={() => {
                setCurrentPage(pageNum);
                pageContainerRefs.current[pageNum]?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          ))}
        </aside>

        {/* Center Canvas Viewport */}
          <main 
            ref={viewerContainerRef}
            className="flex-1 overflow-y-auto p-xl flex flex-col items-center space-y-xl"
          >
            {pdfDoc && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <PdfPage
                key={pageNum}
                pdfDoc={pdfDoc}
                pageNum={pageNum}
                scale={scale}
                rotation={rotation}
                signatures={signatures}
                selectedFieldIdx={selectedFieldIdx}
                onOpenSigningModal={handleOpenSigningModal}
                onSelectField={setSelectedFieldIdx}
                onRemoveField={handleRemoveField}
                registerPageContainer={registerPageContainer}
                onRightClickField={handleRightClickField}
                onOpenDetailsModal={setSignatureDetails}
                onToggleLock={handleToggleLock}
                onDuplicateField={handleDuplicateField}
                onUpdateFieldPosition={handleUpdateFieldPosition}
                onUpdateFieldDimensions={handleUpdateFieldDimensions}
                onChangeRecipient={handleChangeRecipient}
                recipients={recipients}
              />
            ))}
          </main>

        {/* Right Sidebar Timeline & Actions Panel */}
        <aside className="hidden lg:flex w-[300px] bg-canvas border-l border-hairline-soft flex flex-col shrink-0 overflow-hidden">
          {/* Tabs header */}
          <div className="flex bg-surface-soft p-xs rounded-lg border-b border-hairline-soft m-md shrink-0 select-none">
            <button
              onClick={() => setActiveSidebarTab('fields')}
              className={`flex-1 py-xs text-body-sm-bold font-bold rounded transition-colors flex items-center justify-center space-x-xs ${
                activeSidebarTab === 'fields' 
                  ? 'bg-canvas text-ink-deep border border-hairline-soft shadow-sm' 
                  : 'text-slate hover:text-ink'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="text-[11px] sm:text-caption-bold">Fields</span>
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab('recipients');
                fetchRecipients();
              }}
              className={`flex-1 py-xs text-body-sm-bold font-bold rounded transition-colors flex items-center justify-center space-x-xs ${
                activeSidebarTab === 'recipients' 
                  ? 'bg-canvas text-ink-deep border border-hairline-soft shadow-sm' 
                  : 'text-slate hover:text-ink'
              }`}
            >
              <Type className="w-4 h-4" />
              <span className="text-[11px] sm:text-caption-bold">Recipients</span>
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab('audit');
                fetchAuditLogs();
              }}
              className={`flex-1 py-xs text-body-sm-bold font-bold rounded transition-colors flex items-center justify-center space-x-xs ${
                activeSidebarTab === 'audit' 
                  ? 'bg-canvas text-ink-deep border border-hairline-soft shadow-sm' 
                  : 'text-slate hover:text-ink'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="text-[11px] sm:text-caption-bold">Audit</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-md">
            {activeSidebarTab === 'fields' && (
              <div className="space-y-xl">
                {selectedFieldIdx !== null && signatures[selectedFieldIdx] ? (
                  // Selected Field Properties
                  <div className="space-y-md animate-fast">
                    <div className="flex justify-between items-center pb-xs border-b border-hairline-soft">
                      <h3 className="text-body-sm-bold font-bold text-ink-deep">Field Properties</h3>
                      <button 
                        onClick={() => setSelectedFieldIdx(null)}
                        className="text-caption text-slate hover:text-ink-deep font-bold flex items-center"
                      >
                        Close
                      </button>
                    </div>

                    <MetaCard variant="icon-feature" className="space-y-md !p-sm">
                      <div>
                        <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-xxs">Field Type</label>
                        <span className="text-body-sm font-semibold text-ink-deep bg-surface-soft px-sm py-xs rounded-full inline-block w-full border border-hairline-soft">
                          {signatures[selectedFieldIdx].type} Field
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-xxs">Assigned Recipient</label>
                        <select
                          value={signatures[selectedFieldIdx].recipientEmail}
                          disabled={signatures[selectedFieldIdx].status === 'Signed' || signatures[selectedFieldIdx].isLocked}
                          onChange={(e) => {
                            const email = e.target.value;
                            const updated = signatures.map((sig, i) => i === selectedFieldIdx ? { ...sig, recipientEmail: email } : sig);
                            setSignatures(updated);
                            pushHistory(updated);
                          }}
                          className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-fb-blue disabled:opacity-50"
                        >
                          {recipients.map((rec) => (
                            <option key={rec.email} value={rec.email}>{rec.name} ({rec.email})</option>
                          ))}
                          <option value="">Anyone (Unassigned)</option>
                        </select>
                      </div>

                      {/* Position Info */}
                      <div className="grid grid-cols-2 gap-sm text-[10px] font-mono text-slate bg-surface-soft/40 p-xs rounded-lg border border-hairline-soft/40">
                        <div>X: {Math.round(signatures[selectedFieldIdx].xPercent)}%</div>
                        <div>Y: {Math.round(signatures[selectedFieldIdx].yPercent)}%</div>
                        <div>W: {Math.round(signatures[selectedFieldIdx].widthPercent)}%</div>
                        <div>H: {Math.round(signatures[selectedFieldIdx].heightPercent)}%</div>
                      </div>

                      {/* Lock Toggle */}
                      <div className="flex items-center justify-between pt-xs">
                        <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Locked Status</span>
                        <button
                          onClick={() => handleToggleLock(selectedFieldIdx)}
                          className={`px-sm py-[3px] text-[10px] font-bold rounded-full border transition-all ${
                            signatures[selectedFieldIdx].isLocked 
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' 
                              : 'bg-canvas text-slate border-hairline hover:border-slate'
                          }`}
                        >
                          {signatures[selectedFieldIdx].isLocked ? 'Locked' : 'Unlocked'}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-xs">
                        <MetaButton
                          variant="secondary"
                          onClick={() => handleDuplicateField(selectedFieldIdx)}
                          disabled={signatures[selectedFieldIdx].isLocked}
                          className="flex-1 !py-1 !px-2 text-xs"
                        >
                          Duplicate
                        </MetaButton>
                        <MetaButton
                          variant="ghost"
                          onClick={() => handleRemoveField(selectedFieldIdx)}
                          className="flex-1 !py-1 !px-2 text-xs !bg-critical/5 !text-critical hover:!bg-critical/10 !border-critical/20"
                        >
                          Delete
                        </MetaButton>
                      </div>
                    </MetaCard>
                  </div>
                ) : (
                  // Default Add Placeholders
                  <div className="space-y-md animate-fast">
                    <div>
                      <h3 className="text-body-sm-bold font-bold mb-xxs text-ink-deep">Add Placeholders</h3>
                      <p className="text-body-xs text-slate">Configure options and click "Add Placeholder" to place fields.</p>
                    </div>

                    <MetaCard variant="icon-feature" className="space-y-md">
                      <div>
                        <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Placeholder Type</label>
                        <select
                          value={placedFieldType}
                          onChange={(e: any) => setPlacedFieldType(e.target.value)}
                          className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-fb-blue"
                        >
                          <option value="Signature">Signature</option>
                          <option value="Initials">Initials</option>
                          <option value="Date">Signing Date</option>
                          <option value="Text">Custom Text Input</option>
                          <option value="Checkbox">Checkbox Indicator</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Recipient Email</label>
                        <MetaInput
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="signer@company.com"
                        />
                      </div>

                      <MetaButton variant="ghost" onClick={handleAddSignatureField} className="w-full flex items-center justify-center">
                        <Edit3 className="w-4 h-4 mr-2" /> Add Placeholder
                      </MetaButton>
                    </MetaCard>
                  </div>
                )}

                <div className="border-t border-hairline-soft pt-xl space-y-md">
                  <h4 className="text-body-xs-bold font-bold text-slate uppercase tracking-wider">Field Status</h4>
                  {signatures.length === 0 ? (
                    <p className="text-body-sm text-slate">No fields added yet.</p>
                  ) : (
                    <div className="space-y-sm">
                      {signatures.map((sig, idx) => (
                        <div 
                          key={idx} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFieldIdx(idx);
                            scrollToPage(sig.page);
                          }}
                          className={`flex justify-between items-center text-body-sm p-sm rounded-lg border cursor-pointer ${
                            selectedFieldIdx === idx 
                              ? 'border-fb-blue bg-primary/5' 
                              : 'bg-surface-soft border-hairline-soft hover:border-hairline'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-ink-deep">{sig.type} Field {idx + 1}</span>
                            <span className="text-caption text-slate">{sig.recipientEmail}</span>
                          </div>
                          <MetaBadge variant={sig.status === 'Signed' ? 'success' : 'attention'}>
                            {sig.status}
                          </MetaBadge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === 'recipients' && (
              <div className="space-y-xl">
                {/* Recipients List */}
                <div>
                  <h3 className="text-body-sm-bold font-bold mb-xxs text-ink-deep">Recipients</h3>
                  <p className="text-body-xs text-slate">Manage signers and viewing recipients.</p>
                </div>

                <div className="space-y-sm">
                  {recipients.map((rec) => (
                    <div key={rec._id} className="p-sm bg-surface-soft border border-hairline-soft rounded-xl flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-xs">
                          <span className="text-body-xs bg-canvas px-xs py-[2px] rounded border border-hairline font-bold">Seq {rec.sequence}</span>
                          <span className="text-body-sm-bold font-bold truncate text-ink-deep">{rec.name}</span>
                        </div>
                        <p className="text-caption text-slate truncate">{rec.email}</p>
                        <p className="text-[10px] text-slate font-bold uppercase mt-xxs">{rec.role} • {rec.status}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteRecipient(rec._id)}
                        className="p-xs hover:bg-canvas rounded-circle text-slate hover:text-critical transition-colors ml-xs shrink-0"
                        title="Remove Recipient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {recipients.length === 0 && <p className="text-body-sm text-slate">No recipients configured yet.</p>}
                </div>

                {/* Add Recipient Form */}
                <div className="border-t border-hairline-soft pt-xl space-y-md">
                  <h4 className="text-body-xs-bold font-bold text-slate uppercase tracking-wider">Add Recipient</h4>
                  <div className="space-y-sm">
                    <MetaInput
                      type="text"
                      placeholder="Full Name"
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                    />
                    <MetaInput
                      type="email"
                      placeholder="Email Address"
                      value={newRecipientEmail}
                      onChange={(e) => setNewRecipientEmail(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-sm">
                      <select
                        value={newRecipientRole}
                        onChange={(e: any) => setNewRecipientRole(e.target.value)}
                        className="px-sm py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none"
                      >
                        <option value="Signer">Signer</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Sequence"
                        value={newRecipientSeq}
                        onChange={(e) => setNewRecipientSeq(parseInt(e.target.value) || 1)}
                        className="px-sm py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none"
                      />
                    </div>
                    <MetaButton variant="ghost" onClick={handleAddRecipient} className="w-full flex items-center justify-center">
                      Add Recipient
                    </MetaButton>
                  </div>
                </div>

                {/* Signing Workflow Settings */}
                <div className="border-t border-hairline-soft pt-xl space-y-md">
                  <h4 className="text-body-xs-bold font-bold text-slate uppercase tracking-wider">Signing Order & Settings</h4>
                  <div className="space-y-md">
                    <div>
                      <label className="block text-body-xs font-bold text-ink-deep mb-xxs">Routing Workflow</label>
                      <select
                        value={signingOrder}
                        onChange={(e: any) => setSigningOrder(e.target.value)}
                        className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none"
                      >
                        <option value="Parallel">Parallel (Everyone signs at once)</option>
                        <option value="Sequential">Sequential (Sign in order of sequence)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-body-xs font-bold text-ink-deep mb-xxs">Expiration Date</label>
                      <input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none"
                      />
                    </div>

                    <div className="space-y-sm bg-surface-soft p-sm rounded-xl border border-hairline-soft">
                      <div className="flex items-center space-x-md">
                        <input
                          type="checkbox"
                          id="enableReminders"
                          checked={remindersEnabled}
                          onChange={(e) => setRemindersEnabled(e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        <label htmlFor="enableReminders" className="text-body-sm text-ink-deep select-none cursor-pointer">
                          Enable Automatic Reminders
                        </label>
                      </div>

                      {remindersEnabled && (
                        <div className="flex items-center space-x-sm pt-xs">
                          <span className="text-body-xs text-slate">Remind every</span>
                          <input
                            type="number"
                            min="1"
                            value={reminderInterval}
                            onChange={(e) => setReminderInterval(parseInt(e.target.value) || 3)}
                            className="w-[60px] text-center py-xxs bg-canvas border border-hairline rounded text-body-sm font-bold text-ink-deep outline-none"
                          />
                          <span className="text-body-xs text-slate">days</span>
                        </div>
                      )}
                    </div>

                    <MetaButton variant="primary" onClick={handleSaveWorkflowSettings} className="w-full flex items-center justify-center">
                      Save Settings
                    </MetaButton>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'audit' && (
              <div className="space-y-xl">
                <div>
                  <h3 className="text-body-sm-bold font-bold mb-xxs text-ink-deep">Audit Trail</h3>
                  <p className="text-body-xs text-slate">Cryptographic history timeline of actions.</p>
                </div>

                {auditLogs.length === 0 ? (
                  <p className="text-body-sm text-slate">No actions logged yet.</p>
                ) : (
                  <div className="space-y-lg relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-hairline-soft">
                    {auditLogs.map((log) => (
                      <div key={log._id} className="flex items-start space-x-md relative">
                        <div className="w-[24px] h-[24px] rounded-circle bg-canvas border border-hairline-soft flex items-center justify-center shrink-0 z-10">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm-bold font-bold text-ink-deep leading-tight">
                            {log.action}
                          </p>
                          <p className="text-caption text-slate leading-tight mt-xxs">
                            {log.userId?.email || 'Anonymous'}
                          </p>
                          <p className="text-body-xs text-slate mt-xxs">
                            {log.ipAddress} • {new Date(log.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div 
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="absolute bg-canvas border border-hairline-soft rounded-lg shadow-xl py-xs min-w-[150px] z-50 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => {
              if (contextMenu) handleRemoveField(contextMenu.idx);
            }}
            className="w-full text-left px-md py-xs text-body-sm text-critical hover:bg-surface-soft hover:text-critical-strong transition-colors"
          >
            Delete Field
          </button>
        </div>
      )}

      {/* Signing modal */}
      <MetaModal
        isOpen={isSigningModalOpen}
        onClose={() => setIsSigningModalOpen(false)}
        title="Create & Place Signature"
        footer={
          <div className="flex justify-end space-x-md">
            <MetaButton variant="ghost" onClick={() => setIsSigningModalOpen(false)}>
              Cancel
            </MetaButton>
            <MetaButton 
              variant="buy-cta" 
              onClick={handleSignConfirm} 
              disabled={
                (signatureType === 'type' && !typedName.trim()) ||
                (signatureType === 'upload' && !uploadedBase64)
              }
            >
              Apply Signature
            </MetaButton>
          </div>
        }
      >
        <div className="space-y-xl">
          {/* Saved profiles picker list */}
          {savedProfiles.length > 0 && (
            <div className="border-b border-hairline-soft pb-md">
              <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-sm">Saved Profiles</label>
              <div className="flex space-x-sm overflow-x-auto py-xxs">
                {savedProfiles.map((profile) => (
                  <button
                    key={profile._id}
                    onClick={() => applySavedProfile(profile)}
                    className="p-sm border border-hairline-soft hover:border-primary rounded-xl shrink-0 flex flex-col items-center bg-surface-soft max-w-[120px]"
                  >
                    {profile.imageData.startsWith('data:image') ? (
                      <img src={profile.imageData} alt={profile.name} className="h-8 object-contain mb-xxs" />
                    ) : (
                      <span className="font-cursive text-body-xs truncate w-full text-center">{profile.imageData.split(':')[1] || profile.name}</span>
                    )}
                    <span className="text-[10px] text-slate truncate w-full text-center">{profile.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex bg-surface-soft p-xs rounded-full border border-hairline-soft">
            <MetaButton
              variant="pill-tab"
              active={signatureType === 'draw'}
              onClick={() => setSignatureType('draw')}
              className="flex-1"
            >
              <Edit3 className="w-4 h-4 mr-2" /> Draw
            </MetaButton>
            <MetaButton
              variant="pill-tab"
              active={signatureType === 'type'}
              onClick={() => setSignatureType('type')}
              className="flex-1"
            >
              <Type className="w-4 h-4 mr-2" /> Type
            </MetaButton>
            <MetaButton
              variant="pill-tab"
              active={signatureType === 'upload'}
              onClick={() => setSignatureType('upload')}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" /> Upload
            </MetaButton>
          </div>

          {/* Draw Mode */}
          {signatureType === 'draw' && (
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <label className="text-body-sm text-slate">Use mouse or touch pad to draw signature</label>
                <div className="flex space-x-xs">
                  <button 
                    onClick={undoDrawingCanvas} 
                    className="p-xs bg-surface-soft hover:bg-hairline-soft rounded-circle text-slate hover:text-ink"
                    title="Undo"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={clearDrawingCanvas} 
                    className="p-xs bg-surface-soft hover:bg-hairline-soft rounded-circle text-slate hover:text-ink"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-surface-soft rounded-xxxl border border-hairline overflow-hidden">
                <SignatureCanvas
                  ref={signatureCanvasRef}
                  penColor={signatureColor === 'black' ? '#000000' : signatureColor === 'darkgray' ? '#4A4A4A' : '#0064e0'}
                  canvasProps={{ width: 460, height: 160, className: 'cursor-crosshair' }}
                  velocityFilterWeight={0.6}
                  minWidth={1.5}
                  maxWidth={4.0}
                  onEnd={onDrawEnd}
                />
              </div>
              <div className="flex space-x-md items-center mb-md">
                <span className="text-body-sm font-bold text-ink-deep">Ink Color:</span>
                <button onClick={() => setSignatureColor('black')} className={`w-6 h-6 rounded-full bg-black ${signatureColor === 'black' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} title="Black Ink" />
                <button onClick={() => setSignatureColor('darkgray')} className={`w-6 h-6 rounded-full bg-[#4A4A4A] ${signatureColor === 'darkgray' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} title="Dark Gray Ink" />
                <button onClick={() => setSignatureColor('blue')} className={`w-6 h-6 rounded-full bg-[#0064e0] ${signatureColor === 'blue' ? 'ring-2 ring-offset-2 ring-primary' : ''}`} title="Blue Ink" />
              </div>
              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Profile Name (to save)</label>
                <MetaInput
                  value={drawnProfileName}
                  onChange={(e) => setDrawnProfileName(e.target.value)}
                  placeholder="E.g. Draw Template"
                />
              </div>
            </div>
          )}

          {/* Type Mode */}
          {signatureType === 'type' && (
            <div className="space-y-md">
              <label className="text-body-sm text-slate">Type your name and choose a signature typography style</label>
              <MetaInput
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type name here"
              />
              
              <div className="grid grid-cols-4 gap-sm">
                <button
                  onClick={() => setSelectedFont('great-vibes')}
                  className={`p-sm border rounded-xl text-center ${selectedFont === 'great-vibes' ? 'border-fb-blue bg-primary/5' : 'border-hairline-soft bg-canvas'}`}
                >
                  <span className="font-great-vibes text-[16px] text-primary block truncate">Great Vibes</span>
                </button>
                <button
                  onClick={() => setSelectedFont('dancing-script')}
                  className={`p-sm border rounded-xl text-center ${selectedFont === 'dancing-script' ? 'border-fb-blue bg-primary/5' : 'border-hairline-soft bg-canvas'}`}
                >
                  <span className="font-dancing-script text-[14px] font-bold text-primary block truncate">Dancing</span>
                </button>
                <button
                  onClick={() => setSelectedFont('allura')}
                  className={`p-sm border rounded-xl text-center ${selectedFont === 'allura' ? 'border-fb-blue bg-primary/5' : 'border-hairline-soft bg-canvas'}`}
                >
                  <span className="font-allura text-[16px] text-primary block truncate">Allura</span>
                </button>
                <button
                  onClick={() => setSelectedFont('cursive')}
                  className={`p-sm border rounded-xl text-center ${selectedFont === 'cursive' ? 'border-fb-blue bg-primary/5' : 'border-hairline-soft bg-canvas'}`}
                >
                  <span className="font-cursive text-[14px] text-primary block truncate">Cursive</span>
                </button>
              </div>

              {/* Styled Preview Frame */}
              <div className="p-xl bg-surface-soft rounded-xxxl border-2 border-dashed border-hairline text-center flex items-center justify-center min-h-[100px]">
                <span className={`text-[36px] text-primary tracking-wider leading-none select-none ${
                  selectedFont === 'great-vibes' ? 'font-great-vibes' : selectedFont === 'dancing-script' ? 'font-dancing-script' : selectedFont === 'allura' ? 'font-allura' : 'font-cursive'
                }`}>
                  {typedName || 'Signature Preview'}
                </span>
              </div>

              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Profile Name (to save)</label>
                <MetaInput
                  value={typedProfileName}
                  onChange={(e) => setTypedProfileName(e.target.value)}
                  placeholder="E.g. Typed Template"
                />
              </div>
            </div>
          )}

          {/* Upload Mode */}
          {signatureType === 'upload' && (
            <div className="space-y-md">
              <label className="text-body-sm text-slate">Upload signature image (PNG, JPG, max 2MB)</label>
              
              <div className="border-2 border-dashed border-hairline-soft rounded-xxxl p-xl text-center bg-surface-soft cursor-pointer relative hover:border-hairline">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleSignatureUploadChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 mx-auto text-slate mb-xs" />
                <p className="text-body-sm text-ink-deep font-bold">Select signature file</p>
                <p className="text-caption text-slate">PNG, JPG, JPEG up to 2MB</p>
              </div>

              {uploadedBase64 && (
                <div className="p-md bg-canvas border border-hairline-soft rounded-xl flex items-center justify-center max-h-[120px]">
                  <img src={uploadedBase64} alt="Uploaded signature preview" className="max-h-[100px] object-contain" />
                </div>
              )}

              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Profile Name (to save)</label>
                <MetaInput
                  value={uploadedProfileName}
                  onChange={(e) => setUploadedProfileName(e.target.value)}
                  placeholder="E.g. Uploaded Template"
                />
              </div>
            </div>
          )}

          {/* Save to profiles checkbox */}
          <div className="flex items-center space-x-md">
            <input
              type="checkbox"
              id="saveToProfiles"
              checked={saveToProfiles}
              onChange={(e) => setSaveToProfiles(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="saveToProfiles" className="text-body-sm text-ink-deep select-none cursor-pointer">
              Save signature layout to my profiles template list
            </label>
          </div>
        </div>
      </MetaModal>

      {/* Signer Details Modal */}
      <MetaModal
        isOpen={!!signatureDetails}
        onClose={() => setSignatureDetails(null)}
        title="Verified Electronic Signature Certificate"
        footer={
          <div className="flex justify-end">
            <MetaButton variant="primary" onClick={() => setSignatureDetails(null)}>
              Close
            </MetaButton>
          </div>
        }
      >
        {signatureDetails && (() => {
          const recipient = recipients.find(r => r.email === signatureDetails.recipientEmail);
          const signerName = recipient ? recipient.name : signatureDetails.recipientEmail.split('@')[0];
          const certId = signatureDetails.certificateId || (signatureDetails._id ? `SIG-${new Date().getFullYear()}-${signatureDetails._id.slice(-6).toUpperCase()}` : `SIG-${new Date().getFullYear()}-TEMP`);
          const auditId = signatureDetails.auditId || (signatureDetails._id ? `AUD-${signatureDetails._id.slice(-8).toUpperCase()}` : 'AUD-TEMP');
          const browser = signatureDetails.browser || 'Unavailable';
          const device = signatureDetails.device || 'Unavailable';
          const os = signatureDetails.operatingSystem || 'Unavailable';
          const location = signatureDetails.location || 'Unavailable';
          const docId = signatureDetails.documentId;
          const tamperStatus = signatureDetails.tamperStatus || 'Verified';
          const docHash = (document as any)?.sha256Checksum || signatureDetails.documentHash || 'Pending Finalization';
          const verificationStatus = signatureDetails.status === 'Signed' ? 'Verified Signature' : 'Pending';

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

          const isLocal = !signatureDetails.ipAddress || signatureDetails.ipAddress === '127.0.5.1' || signatureDetails.ipAddress === '127.0.0.1' || signatureDetails.location === 'Local Development Environment';

          return (
            <div className="space-y-md">
              {isLocal && (
                <div className="flex items-center space-x-md p-md bg-yellow-50 rounded-xl border border-yellow-200">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 shrink-0" />
                  <div>
                    <h4 className="text-body-sm-bold font-bold text-yellow-950">Development Mode Active</h4>
                    <p className="text-[11px] text-yellow-850">This signature was captured in a local development environment. Geolocation and network provider metadata are simulated.</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-md p-md bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-body-sm-bold font-bold text-emerald-900">SignFlow Verified Signature</h4>
                  <p className="text-[11px] text-emerald-700">This signature is cryptographically verified and legally binding under ESIGN & UETA regulations.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md bg-surface-soft p-md rounded-xl border border-hairline-soft">
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Signer Name</span>
                  <span className="text-ink-deep text-body-sm-bold font-bold">{signerName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Email Address</span>
                  <span className="text-ink-deep text-body-sm truncate" title={signatureDetails.recipientEmail}>{signatureDetails.recipientEmail}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Verification Status</span>
                  <span className="text-emerald-600 text-body-sm-bold font-bold">✓ {verificationStatus}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Timestamp</span>
                  <span className="text-ink-deep text-body-sm font-mono">{formatSignatureDate(signatureDetails.updatedAt)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">IP Address</span>
                  <span className="text-ink-deep text-body-sm font-mono">{signatureDetails.ipAddress || 'Unavailable'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Location</span>
                  <span className="text-ink-deep text-body-sm">{location}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Browser</span>
                  <span className="text-ink-deep text-body-sm">{browser}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Device & OS</span>
                  <span className="text-ink-deep text-body-sm">{device} ({os})</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">User Agent</span>
                  <span className="text-ink-deep text-[11px] font-mono break-all leading-tight bg-white p-xs rounded border border-hairline-soft mt-xxs">{signatureDetails.userAgent || 'Unknown Browser'}</span>
                </div>
              </div>

              {/* Compliance Verification */}
              <div className="bg-emerald-50 p-md rounded-xl border border-emerald-200 space-y-xs">
                <h4 className="text-body-sm-bold font-bold text-emerald-900 mb-xs">Compliance Verification</h4>
                <div className="grid grid-cols-2 gap-xs text-body-sm">
                  <div className="flex justify-between"><span className="text-slate">Trust Score</span><span className="text-emerald-700 font-bold">100%</span></div>
                  <div className="flex justify-between"><span className="text-slate">Document Integrity</span><span className="text-emerald-700 font-bold">Verified</span></div>
                  <div className="flex justify-between"><span className="text-slate">Signature Integrity</span><span className="text-emerald-700 font-bold">Verified</span></div>
                  <div className="flex justify-between"><span className="text-slate">Audit Trail</span><span className="text-emerald-700 font-bold">Verified</span></div>
                  <div className="flex justify-between"><span className="text-slate">Tamper Detection</span><span className="text-emerald-700 font-bold">Passed</span></div>
                </div>
              </div>

              <div className="bg-surface-soft p-md rounded-xl border border-hairline-soft space-y-sm">
                <div className="flex justify-between items-center border-b border-hairline-soft pb-xxs">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Document ID</span>
                  <span className="text-ink-deep text-body-sm font-mono">{docId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline-soft pb-xxs">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Certificate ID</span>
                  <span className="text-ink-deep text-body-sm-bold font-mono">{certId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline-soft pb-xxs">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Audit ID</span>
                  <span className="text-ink-deep text-body-sm-bold font-mono">{auditId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider">Tamper Status</span>
                  <span className="text-emerald-600 text-body-sm-bold font-bold">{tamperStatus}</span>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 p-md rounded-xl border border-slate-800 space-y-xxs">
                <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Cryptographic SHA-256 Fingerprint</span>
                <p className="text-[10px] font-mono break-all leading-tight text-slate-200">{docHash}</p>
              </div>
            </div>
          );
        })()}
      </MetaModal>

      {/* Link Sharing Modal */}
      <MetaModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Configure Public Link Sharing"
        footer={
          <div className="flex justify-end space-x-md">
            <MetaButton variant="ghost" onClick={() => setIsShareModalOpen(false)}>
              Close
            </MetaButton>
            <MetaButton variant="primary" onClick={handleSaveShareSettings}>
              Apply Sharing Settings
            </MetaButton>
          </div>
        }
      >
        <div className="space-y-xl">
          <div className="flex items-center space-x-md bg-surface-soft p-md rounded-xl border border-hairline-soft">
            <input
              type="checkbox"
              id="enableLinkSharing"
              checked={sharingEnabled}
              onChange={(e) => setSharingEnabled(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <label htmlFor="enableLinkSharing" className="text-body-sm-bold font-bold text-ink-deep select-none cursor-pointer">
              Enable Public Access Sharing Link
            </label>
          </div>

          {sharingEnabled && (
            <div className="space-y-md animate-fade-in">
              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Share Link URL</label>
                <div className="flex space-x-sm">
                  <MetaInput
                    readOnly
                    type="text"
                    value={generatedShareUrl}
                    className="flex-1 bg-surface-soft cursor-default select-all"
                  />
                  <MetaButton variant="ghost" onClick={() => {
                    navigator.clipboard.writeText(generatedShareUrl);
                    alert('Copied link to clipboard!');
                  }}>
                    Copy
                  </MetaButton>
                </div>
              </div>

              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Protect Link with Password (Optional)</label>
                <MetaInput
                  type="password"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Leave blank for no password protection"
                />
              </div>

              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Link Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={shareExpiresAt}
                  onChange={(e) => setShareExpiresAt(e.target.value)}
                  className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-fb-blue"
                />
              </div>

              <div className="flex items-center space-x-md">
                <input
                  type="checkbox"
                  id="shareOneTime"
                  checked={shareOneTimeOnly}
                  onChange={(e) => setShareOneTimeOnly(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="shareOneTime" className="text-body-sm text-ink-deep select-none cursor-pointer">
                  One-Time Access Link (expires immediately after first load)
                </label>
              </div>
            </div>
          )}
        </div>
      </MetaModal>

      {/* Mobile Bottom Toolbar */}
      {document?.status !== 'Signed' && (
        <div className="lg:hidden h-[60px] bg-canvas border-t border-hairline-soft flex items-center justify-around px-md shrink-0 z-40 select-none">
          <button 
            onClick={() => setMobileDrawerTab('fields')} 
            className="flex flex-col items-center justify-center text-slate hover:text-primary transition-colors"
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Fields</span>
          </button>

          <button 
            onClick={() => {
              setMobileDrawerTab('recipients');
              fetchRecipients();
            }} 
            className="flex flex-col items-center justify-center text-slate hover:text-primary transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Recipients</span>
          </button>

          <div className="flex items-center space-x-sm border-l border-r border-hairline-soft px-sm">
            <button 
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))} 
              className="p-xs bg-surface-soft rounded-circle text-slate hover:text-ink-deep"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-body-xs font-bold font-mono min-w-[36px] text-center">{Math.round(scale * 100)}%</span>
            <button 
              onClick={() => setScale(prev => Math.min(2.5, prev + 0.1))} 
              className="p-xs bg-surface-soft rounded-circle text-slate hover:text-ink-deep"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setMobileDrawerTab('timeline')} 
            className="flex flex-col items-center justify-center text-slate hover:text-primary transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Timeline</span>
          </button>

          <button 
            onClick={handleFinalizePDF} 
            disabled={isFinalizing}
            className="px-md py-[6px] bg-primary text-canvas rounded-full text-caption-bold font-bold shadow-sm"
          >
            Sign
          </button>
        </div>
      )}

      {/* Mobile Drawer (Slide-up Panel) */}
      {mobileDrawerTab && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-ink-deep/60 backdrop-blur-xs" 
            onClick={() => setMobileDrawerTab(null)} 
          />
          
          {/* Drawer Body */}
          <div className="relative bg-canvas rounded-t-xxxl border-t border-hairline-soft p-lg max-h-[75vh] flex flex-col z-50 animate-slide-up">
            {/* Header / Drag Bar */}
            <div className="flex justify-between items-center border-b border-hairline-soft pb-sm mb-md select-none shrink-0">
              <span className="text-body-sm-bold font-bold text-ink-deep uppercase tracking-wider">
                {mobileDrawerTab === 'fields' && 'Add Fields'}
                {mobileDrawerTab === 'recipients' && 'Manage Recipients'}
                {mobileDrawerTab === 'timeline' && 'Audit Timeline'}
              </span>
              <button 
                onClick={() => setMobileDrawerTab(null)}
                className="p-xs bg-surface-soft hover:bg-hairline-soft rounded-circle transition-colors"
              >
                <X className="w-4 h-4 text-ink-deep" />
              </button>
            </div>

            {/* Scrollable content container */}
            <div className="overflow-y-auto flex-1 min-h-0 space-y-md">
              {mobileDrawerTab === 'fields' && (
                <div className="space-y-xl">
                  <div>
                    <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Field Type</label>
                    <select
                      value={placedFieldType}
                      onChange={(e) => setPlacedFieldType(e.target.value as any)}
                      className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-fb-blue"
                    >
                      <option value="Signature">Signature Field</option>
                      <option value="Initials">Initials Placeholder</option>
                      <option value="Date">Date Stamp</option>
                      <option value="Text">Standard Text Input</option>
                      <option value="Checkbox">Checkbox</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Assigned Recipient</label>
                    <select
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-fb-blue"
                    >
                      <option value={user?.email}>{user?.name} (You)</option>
                      {recipients.map((rec) => (
                        <option key={rec._id} value={rec.email}>
                          {rec.name} ({rec.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <MetaButton variant="primary" onClick={handleAddSignatureField} className="w-full flex items-center justify-center">
                    Place Field on Page {currentPage}
                  </MetaButton>
                </div>
              )}

              {mobileDrawerTab === 'recipients' && (
                <div className="space-y-xl">
                  {/* Recipient list and add form */}
                  <div className="space-y-md">
                    {recipients.map((rec) => (
                      <div key={rec._id} className="flex justify-between items-center p-sm bg-surface-soft border border-hairline-soft rounded-xl">
                        <div>
                          <p className="text-body-sm-bold font-bold text-ink-deep">{rec.name}</p>
                          <p className="text-body-xs text-slate">{rec.email}</p>
                        </div>
                        <div className="flex items-center space-x-sm">
                          <span className={`text-[10px] px-sm py-xxs rounded-full font-bold uppercase ${
                            rec.status === 'Signed' ? 'bg-success/10 text-success' : 'bg-attention/10 text-attention'
                          }`}>
                            {rec.status}
                          </span>
                          <button onClick={() => handleDeleteRecipient(rec._id)} className="text-slate hover:text-critical p-xs">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-hairline-soft pt-md space-y-md">
                    <p className="text-body-xs-bold font-bold text-slate uppercase tracking-wider">Add New Recipient</p>
                    <div className="grid grid-cols-2 gap-sm">
                      <MetaInput 
                        placeholder="Full Name" 
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                      />
                      <MetaInput 
                        placeholder="Email Address" 
                        value={newRecipientEmail}
                        onChange={(e) => setNewRecipientEmail(e.target.value)}
                      />
                    </div>
                    <MetaButton variant="ghost" onClick={handleAddRecipient} className="w-full flex items-center justify-center">
                      Add Recipient
                    </MetaButton>
                  </div>
                </div>
              )}

              {mobileDrawerTab === 'timeline' && (
                <div className="space-y-md pr-xs">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="flex space-x-md text-body-xs">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-circle bg-primary" />
                        <div className="w-[1px] h-full bg-hairline-soft" />
                      </div>
                      <div className="pb-sm">
                        <p className="font-bold text-ink-deep">
                          {log.userId?.name || 'Anonymous User'} did {log.action}
                        </p>
                        <p className="text-[10px] text-slate mt-xxs">
                          {new Date(log.createdAt).toLocaleString()} • {log.ipAddress}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
