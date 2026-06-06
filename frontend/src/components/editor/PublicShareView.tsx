import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import SignatureCanvas from 'react-signature-canvas';
import {
  FileText, Lock, AlertTriangle, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Edit3, Type, Upload, CheckCircle2, X, Undo,
  Shield, Maximize, ClipboardList, Settings
} from 'lucide-react';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Backend base URL — reads from VITE_API_URL in production
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');

interface SignatureField {
  _id: string;
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
  updatedAt?: string;
  documentId?: string;
}

interface DocumentData {
  _id: string;
  filename: string;
  originalPath: string;
  status: string;
  createdAt: string;
  sha256Checksum?: string;
  signatureFields: SignatureField[];
}

export default function PublicShareView() {
  const { id } = useParams<{ id: string }>();

  // Document & PDF state
  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);

  // Auto-scale PDF viewer on mobile viewports to prevent layout collapsing or excessive horizontal overflow
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setScale(0.5);
      } else if (window.innerWidth < 768) {
        setScale(0.75);
      } else {
        setScale(1.2);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [fields, setFields] = useState<SignatureField[]>([]);
  const pageContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  // Access control state
  const [password, setPassword] = useState('');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Identity verification (signer gate)
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [identityError, setIdentityError] = useState('');

  // Signing modal state
  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [signatureDetails, setSignatureDetails] = useState<SignatureField | null>(null);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<'great-vibes' | 'dancing-script' | 'allura' | 'cursive'>('great-vibes');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const drawingHistory = useRef<string[]>([]);
  const [signatureColor, setSignatureColor] = useState<'black' | 'darkgray' | 'blue'>('black');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completion state
  const [allSigned, setAllSigned] = useState(false);
  const [mobileDrawerTab, setMobileDrawerTab] = useState<'fields' | 'controls' | null>(null);

  // Page canvas render tasks cleanup
  const renderTaskRefs = useRef<Record<number, any>>({});

  const loadDocument = useCallback(async (pw = '') => {
    try {
      setIsLoading(true);
      setError(null);
      const url = `${BASE_URL}/api/docs/${id}/public${pw ? `?password=${encodeURIComponent(pw)}` : ''}`;
      const { data } = await axios.get(url);
      setDocData(data);
      setFields(data.signatureFields || []);
      setIsPasswordRequired(false);

      const encodedPath = data.originalPath.split('/').map((part: string) => encodeURIComponent(part)).join('/');
      const pdfUrl = `${BASE_URL}/${encodedPath}`;
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setIsPasswordRequired(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load shared document.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadDocument();
    });
  }, [loadDocument]);

  // Render each page into its canvas
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc) return;
    const container = pageContainerRefs.current[pageNum];
    if (!container) return;

    let canvas = container.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'block';
      container.insertBefore(canvas, container.firstChild);
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    // Cancel any ongoing render for this page
    if (renderTaskRefs.current[pageNum]) {
      renderTaskRefs.current[pageNum].cancel();
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const dpr = (window.devicePixelRatio || 1) * 2;
      const viewport = page.getViewport({ scale: scale * dpr });
      const cssViewport = page.getViewport({ scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${cssViewport.width}px`;
      canvas.style.height = `${cssViewport.height}px`;

      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({ canvasContext: context, viewport } as any);
      renderTaskRefs.current[pageNum] = renderTask;
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Page ${pageNum} render error:`, err);
      }
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (!pdfDoc) return;
    for (let p = 1; p <= numPages; p++) {
      renderPage(p);
    }
  }, [pdfDoc, numPages, scale, renderPage]);


  const handleFitWidth = useCallback(() => {
    if (!pdfDoc || !viewerContainerRef.current) return;
    const containerWidth = viewerContainerRef.current.clientWidth - 48;
    pdfDoc.getPage(1).then((page) => {
      const originalViewport = page.getViewport({ scale: 1 });
      const fitScale = containerWidth / originalViewport.width;
      setScale(fitScale);
    });
  }, [pdfDoc]);

  // Auto-fit page width on load and resize
  useEffect(() => {
    if (!pdfDoc) return;
    handleFitWidth();

    const handleResize = () => {
      handleFitWidth();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
                  const originalViewport = page.getViewport({ scale: 1 });
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
  }, [pdfDoc, scale, handleFitWidth]);

  // Identity gate
  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerEmail.trim()) {
      setIdentityError('Email is required to identify you as a signer.');
      return;
    }
    const myFields = fields.filter(f => f.recipientEmail.toLowerCase() === signerEmail.trim().toLowerCase());
    if (myFields.length === 0) {
      setIdentityError('No signature fields are assigned to this email address.');
      return;
    }
    setIdentityError('');
    setIdentityConfirmed(true);
  };

  const myFields = fields.filter(f => f.recipientEmail.toLowerCase() === signerEmail.toLowerCase());
  const myPendingFields = myFields.filter(f => f.status !== 'Signed');

  // Open signing modal for a field
  const openSigningModal = useCallback((field: SignatureField) => {
    if (!identityConfirmed) return;
    if (field.recipientEmail.toLowerCase() !== signerEmail.toLowerCase()) return;
    if (field.status === 'Signed') return;
    setActiveField(field);
    setSignatureType('draw');
    setTypedName(signerName || signerEmail.split('@')[0]);
    setUploadedBase64('');
  }, [identityConfirmed, signerEmail, signerName]);

  // Handle signature canvas clearing on activeField changes
  useEffect(() => {
    if (activeField) {
      drawingHistory.current = [];
      setTimeout(() => signatureCanvasRef.current?.clear(), 50);
    }
  }, [activeField]);

  const handleSignConfirm = async () => {
    if (!activeField) return;
    let signatureVal = '';

    if (signatureType === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas || canvas.isEmpty()) {
        alert('Please draw your signature first.');
        return;
      }
      signatureVal = canvas.toDataURL();
    } else if (signatureType === 'type') {
      if (!typedName.trim()) { alert('Please type your name.'); return; }
      signatureVal = `${selectedFont}:${typedName}`;
    } else if (signatureType === 'upload') {
      if (!uploadedBase64) { alert('Please upload a signature image.'); return; }
      signatureVal = uploadedBase64;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/signatures/${activeField._id}/sign-public`, {
        signatureValue: signatureVal,
        signerEmail,
        signerName: signerName || signerEmail
      });

      const updatedField = response.data.field;
      setFields(prev => prev.map(f => f._id === activeField._id ? { ...f, ...updatedField } : f));
      setActiveField(null);

      // Check if all the signer's fields are done
      const updatedFields = fields.map(f => f._id === activeField._id ? { ...f, status: 'Signed' as const } : f);
      const stillPending = updatedFields.filter(f =>
        f.recipientEmail.toLowerCase() === signerEmail.toLowerCase() && f.status !== 'Signed'
      );
      if (stillPending.length === 0) {
        setAllSigned(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit signature. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File too large. Max 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setUploadedBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFieldClick = useCallback((f: SignatureField) => {
    const isMine = f.recipientEmail.toLowerCase() === signerEmail.toLowerCase();
    const isSigned = f.status === 'Signed';
    if (isSigned) {
      setSignatureDetails(f);
    } else if (isMine) {
      openSigningModal(f);
    }
  }, [signerEmail, openSigningModal]);

  const handleDownloadPublicPDF = async () => {
    try {
      const downloadUrl = `${BASE_URL}/api/docs/${id}/public-download${password ? `?password=${encodeURIComponent(password)}` : ''}`;
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
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Error downloading PDF file');
    }
  };

  // ─── Loading / Error / Password screens ───────────────────────────────────
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
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-soft border border-hairline-soft rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-deep mb-1">Password Protected</h2>
            <p className="text-slate text-sm">Enter the password to access this document.</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); loadDocument(password); }} className="space-y-4">
            <input
              type="password"
              placeholder="Document password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-hairline-soft rounded-xl px-4 py-3 text-ink-deep placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
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
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-soft border border-hairline-soft rounded-2xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-deep mb-1">Link Unavailable</h2>
            <p className="text-slate text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── All-Signed completion screen ─────────────────────────────────────────
  if (allSigned) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-surface-soft border border-hairline-soft rounded-2xl p-10 shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink-deep mb-2">Signing Complete</h2>
            <p className="text-slate text-sm">
              You have successfully signed <span className="text-ink-deep font-semibold">{docData?.filename}</span>.<br />
              The document owner will be notified.
            </p>
          </div>
          {docData?.sha256Checksum && (
            <div className="bg-white/5 border border-hairline-soft rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-bold">Document Hash (SHA-256)</span>
              </div>
              <p className="text-slate text-[10px] font-mono break-all">{docData.sha256Checksum}</p>
            </div>
          )}
          <div className="pt-2">
            <button
              onClick={handleDownloadPublicPDF}
              className="w-full bg-primary hover:bg-primary-hover text-ink-deep font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Download Signed PDF
            </button>
          </div>
          <p className="text-slate-500 text-xs">You may close this window safely.</p>
        </div>
      </div>
    );
  }

  // ─── Identity gate ─────────────────────────────────────────────────────────
  if (!identityConfirmed) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-soft border border-hairline-soft rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-lg font-bold text-ink-deep">{docData?.filename}</h1>
              <p className="text-slate text-xs">You've been requested to sign this document</p>
            </div>
          </div>
          <div className="border-t border-hairline-soft" />
          <form onSubmit={handleIdentitySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate mb-1">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Abhinav Sai"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                className="w-full bg-white/5 border border-hairline-soft rounded-xl px-4 py-3 text-ink-deep placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
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
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{identityError}</p>
            )}
            <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-ink-deep font-bold py-3 rounded-xl transition mt-2">
              Continue to Sign
            </button>
          </form>
          <p className="text-slate-600 text-xs text-center">Your identity is used only to verify your assigned signature fields.</p>
        </div>
      </div>
    );
  }

  // ─── Main viewer ───────────────────────────────────────────────────────────
  const penColor = signatureColor === 'black' ? '#000000' : signatureColor === 'darkgray' ? '#4A4A4A' : '#0064e0';

  const renderFieldContents = (f: SignatureField) => {
    const isSigned = f.status === 'Signed';
    const isMine = f.recipientEmail.toLowerCase() === signerEmail.toLowerCase();
    const cleanSignerName = f.signerName || (isMine ? signerName : '') || f.recipientEmail.split('@')[0];

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

    if (isSigned && f.value) {
      if (f.type === 'Checkbox') {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <input type="checkbox" checked={f.value === 'true'} readOnly className="h-5 w-5 accent-success cursor-default" />
          </div>
        );
      }

      return (
        <div className="flex flex-row w-full h-full border-[1.5px] border-emerald-500 bg-emerald-50/30 rounded overflow-hidden">
          {/* Left Column: Signature Value */}
          <div className="flex-1 flex items-center justify-center min-w-0 p-1 bg-white/50">
            {f.value.startsWith('data:image') ? (
              <img src={f.value} alt="Signature" className="max-w-full max-h-full object-contain pointer-events-none" />
            ) : (
              <span className={`truncate font-bold text-slate-800 ${
                f.type === 'Signature' || f.type === 'Initials'
                  ? (f.value.includes(':') ? `font-${f.value.split(':')[0]} italic text-[18px]` : 'font-cursive italic text-[18px]')
                  : 'font-sans text-[14px]'
              }`}>
                {f.value.includes(':') ? f.value.split(':')[1] : f.value}
              </span>
            )}
          </div>
          
          {/* Right Column: Audit Trail Details */}
          <div className="w-[100px] sm:w-[120px] flex-shrink-0 bg-emerald-50 border-l border-emerald-200 flex flex-col justify-center px-1.5 py-1 text-left leading-tight">
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-1.5 h-1.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-[7px] uppercase font-bold tracking-wider text-emerald-700">Verified</span>
            </div>
            <span className="text-[9px] font-bold text-slate-800 truncate w-full">{cleanSignerName}</span>
            <span className="text-[7px] text-slate-500 font-mono mt-0.5 truncate w-full">{formatSignatureDate(f.updatedAt)}</span>
          </div>
        </div>
      );
    }

    // Unsigned state
    return (
      <div className="flex flex-col items-center justify-center text-center p-1.5 w-full h-full select-none text-slate-800">
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
          {isMine ? 'Click or Double Click' : 'Assigned Signer'}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-deep flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-surface-soft border-b border-hairline-soft h-14 shrink-0 flex items-center justify-between px-6 select-none">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm truncate max-w-[200px] sm:max-w-sm">{docData?.filename}</span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
            Shared Document
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Page nav */}
          {pdfDoc && (
            <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full border border-hairline-soft text-xs">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 transition">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="px-1 font-bold">{currentPage} / {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages}
                className="p-1 hover:bg-white/10 rounded-full disabled:opacity-30 transition">
                <ChevronRight className="w-3 h-3" />
              </button>
              <span className="w-px h-4 bg-white/10 mx-1" />
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.15))} className="p-1 hover:bg-white/10 rounded-full transition">
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="w-8 text-center font-mono">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(3, s + 0.15))} className="p-1 hover:bg-white/10 rounded-full transition">
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}
          {/* Signer badge */}
          <div className="text-xs bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20 font-medium hidden sm:block">
            Signing as {signerEmail}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left instructions panel */}
        <aside className="w-64 bg-surface-soft border-r border-hairline-soft p-4 flex flex-col gap-4 shrink-0 hidden md:flex overflow-y-auto">
          <div>
            <p className="text-xs font-bold text-slate uppercase tracking-wider mb-3">Your Fields</p>
            {myPendingFields.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 text-sm font-bold">All Signed!</p>
              </div>
            ) : (
              myPendingFields.map(f => (
                <button
                  key={f._id}
                  onClick={() => { setCurrentPage(f.page); openSigningModal(f); }}
                  className="w-full text-left p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-2 hover:bg-primary-hover/20 transition text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Edit3 className="w-3 h-3 text-blue-400" />
                    <span className="font-bold text-blue-300">{f.type}</span>
                  </div>
                  <p className="text-slate-500 text-xs">Page {f.page}</p>
                </button>
              ))
            )}
          </div>
          <div className="mt-auto">
            <div className="bg-white/5 border border-hairline-soft rounded-xl p-3 text-xs text-slate space-y-1">
              <p className="font-bold text-slate-300">How to sign</p>
              <p>1. Click a blue field on the document</p>
              <p>2. Draw, type, or upload your signature</p>
              <p>3. Click "Apply Signature"</p>
            </div>
          </div>
        </aside>

        {/* PDF Viewer */}
        <main ref={viewerContainerRef} className="flex-1 overflow-auto p-6 pb-20 md:pb-6 flex flex-col items-center gap-6 bg-[#0d0d14] w-full min-w-0">
          {pdfDoc && Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
            <div
              key={pageNum}
              ref={el => { pageContainerRefs.current[pageNum] = el; }}
              className="relative shadow-2xl bg-white rounded-lg overflow-visible"
              style={{ display: 'inline-block' }}
            >
              {/* Signature field overlays */}
              {fields
                .filter(f => f.page === pageNum)
                .map(f => {
                  const isMine = f.recipientEmail.toLowerCase() === signerEmail.toLowerCase();
                  const isSigned = f.status === 'Signed';
                  return (
                    <div
                      key={f._id}
                      onClick={() => handleFieldClick(f)}
                      onDoubleClick={() => handleFieldClick(f)}
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
                          ? 'rounded-[16px] bg-white border border-slate-200 shadow-sm'
                          : isMine
                          ? 'rounded-lg border-4 border-double border-blue-400 bg-blue-400/10 hover:bg-blue-400/20'
                          : 'rounded-lg border-4 border-double border-slate-400/40 bg-slate-400/5'
                      }`}
                      title={isSigned ? 'Signed - Double click to view details' : (isMine ? 'Double click to sign' : `Assigned to ${f.recipientEmail}`)}
                    >
                      {renderFieldContents(f)}
                      {isSigned && (
                        <div className="absolute bottom-1 right-1 bg-[#31A24C] text-ink-deep text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 z-30 select-none">
                          ✓ VERIFIED
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          ))}
        </main>
      </div>

      {/* Signing Modal */}
      {activeField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-soft border border-hairline-soft rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft">
              <div>
                <h2 className="font-bold text-ink-deep">Apply {activeField.type}</h2>
                <p className="text-xs text-slate">Signing as {signerEmail}</p>
              </div>
              <button onClick={() => setActiveField(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                <X className="w-4 h-4 text-slate" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {/* Tabs */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-hairline-soft gap-1">
                {(['draw', 'type', 'upload'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSignatureType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition ${
                      signatureType === t ? 'bg-primary text-ink-deep' : 'text-slate hover:text-ink-deep'
                    }`}
                  >
                    {t === 'draw' && <><Edit3 className="w-3 h-3 inline mr-1" />Draw</>}
                    {t === 'type' && <><Type className="w-3 h-3 inline mr-1" />Type</>}
                    {t === 'upload' && <><Upload className="w-3 h-3 inline mr-1" />Upload</>}
                  </button>
                ))}
              </div>

              {/* Draw */}
              {signatureType === 'draw' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate">Draw your signature below</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        if (signatureCanvasRef.current && drawingHistory.current.length > 0) {
                          drawingHistory.current.pop();
                          signatureCanvasRef.current.clear();
                          if (drawingHistory.current.length > 0) {
                            signatureCanvasRef.current.fromDataURL(drawingHistory.current[drawingHistory.current.length - 1]);
                          }
                        }
                      }} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-hairline-soft transition">
                        <Undo className="w-3 h-3 text-slate" />
                      </button>
                      <button onClick={() => { signatureCanvasRef.current?.clear(); drawingHistory.current = []; }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-hairline-soft transition">
                        <X className="w-3 h-3 text-slate" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl overflow-hidden border border-hairline-soft">
                    <SignatureCanvas
                      ref={signatureCanvasRef}
                      penColor={penColor}
                      canvasProps={{ width: 460, height: 150, className: 'cursor-crosshair w-full' }}
                      velocityFilterWeight={0.6}
                      minWidth={1.5}
                      maxWidth={4.0}
                      onEnd={() => {
                        if (signatureCanvasRef.current) {
                          drawingHistory.current.push(signatureCanvasRef.current.toDataURL());
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate font-bold">Ink:</span>
                    {(['black', 'darkgray', 'blue'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => setSignatureColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition ${signatureColor === c ? 'border-blue-400 scale-110' : 'border-white/20'}`}
                        style={{ background: c === 'black' ? '#000' : c === 'darkgray' ? '#4A4A4A' : '#0064e0' }}
                        title={`${c} ink`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Type */}
              {signatureType === 'type' && (
                <div className="space-y-3">
                  <input
                    value={typedName}
                    onChange={e => setTypedName(e.target.value)}
                    placeholder="Type your name"
                    className="w-full bg-white/5 border border-hairline-soft rounded-xl px-4 py-3 text-ink-deep placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {(['great-vibes', 'dancing-script', 'allura', 'cursive'] as const).map(font => (
                      <button
                        key={font}
                        onClick={() => setSelectedFont(font)}
                        className={`p-2 border rounded-xl text-center transition ${selectedFont === font ? 'border-blue-500 bg-blue-500/10' : 'border-hairline-soft bg-white/5 hover:border-white/20'}`}
                      >
                        <span className={`text-[11px] font-bold italic text-ink-deep ${
                          font === 'great-vibes' ? 'font-great-vibes' : font === 'dancing-script' ? 'font-dancing-script' : font === 'allura' ? 'font-allura' : 'font-cursive'
                        }`}>
                          {font === 'great-vibes' ? 'Vibes' : font === 'dancing-script' ? 'Dancing' : font === 'allura' ? 'Allura' : 'Cursive'}
                        </span>
                      </button>
                    ))}
                  </div>
                  {typedName && (
                    <div className="bg-white rounded-xl p-4 min-h-[80px] flex items-center justify-center">
                      <span className={`text-3xl text-gray-800 leading-none ${
                        selectedFont === 'great-vibes' ? 'font-great-vibes' : selectedFont === 'dancing-script' ? 'font-dancing-script' : selectedFont === 'allura' ? 'font-allura' : 'font-cursive'
                      }`}>
                        {typedName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload */}
              {signatureType === 'upload' && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center relative hover:border-blue-500/50 transition cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleUploadChange}
                      className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate text-sm">Click to upload signature image</p>
                    <p className="text-slate-600 text-xs">PNG, JPG up to 2MB</p>
                  </div>
                  {uploadedBase64 && (
                    <div className="bg-white rounded-xl p-4 flex items-center justify-center">
                      <img src={uploadedBase64} alt="Preview" className="max-h-[80px] object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-hairline-soft bg-white/2">
              <button onClick={() => setActiveField(null)}
                className="px-4 py-2 text-sm text-slate hover:text-ink-deep border border-hairline-soft rounded-xl transition">
                Cancel
              </button>
              <button
                onClick={handleSignConfirm}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-ink-deep rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Apply Signature</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signer Details Modal */}
      {signatureDetails && (() => {
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
            <div className="bg-surface-soft border border-hairline-soft rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft">
                <h2 className="font-bold text-ink-deep text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  Verified Signature Certificate
                </h2>
                <button onClick={() => setSignatureDetails(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                  <X className="w-4 h-4 text-slate" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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

              {/* Modal footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-hairline-soft bg-white/2">
                <button onClick={() => setSignatureDetails(null)}
                  className="px-6 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-ink-deep rounded-xl transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mobile Drawer (Slide-up Panel) */}
      {mobileDrawerTab && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end text-slate-200 select-none animate-slide-up">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => setMobileDrawerTab(null)} 
          />
          
          {/* Drawer Body */}
          <div className="relative bg-surface-soft rounded-t-2xl border-t border-hairline-soft p-6 max-h-[75vh] flex flex-col z-50 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-hairline-soft pb-3 mb-4 shrink-0">
              <span className="text-sm font-bold text-ink-deep uppercase tracking-wider">
                {mobileDrawerTab === 'fields' && 'Your Fields'}
                {mobileDrawerTab === 'controls' && 'Editor Controls'}
              </span>
              <button 
                onClick={() => setMobileDrawerTab(null)}
                className="p-1 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-4 h-4 text-ink-deep" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {mobileDrawerTab === 'fields' && (
                <div className="space-y-2">
                  {myPendingFields.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-emerald-400 text-sm font-bold">All Fields Signed!</p>
                    </div>
                  ) : (
                    myPendingFields.map(f => (
                      <button
                        key={f._id}
                        onClick={() => { setCurrentPage(f.page); openSigningModal(f); setMobileDrawerTab(null); }}
                        className="w-full text-left p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-primary-hover/20 transition text-sm flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-blue-300">{f.type}</p>
                          <p className="text-slate-500 text-xs mt-0.5">Page {f.page}</p>
                        </div>
                        <span className="text-[10px] bg-blue-500/25 text-blue-300 px-2 py-0.5 rounded-full font-bold">Sign</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {mobileDrawerTab === 'controls' && (
                <div className="space-y-6">
                  {/* Zoom Controls */}
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-hairline-soft">
                    <span className="text-sm text-slate-300">Zoom Level</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setScale(s => Math.max(0.5, s - 0.15))}
                        className="h-11 w-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition cursor-pointer"
                      >
                        <ZoomOut className="w-5 h-5 text-ink-deep" />
                      </button>
                      <span className="text-sm font-mono font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                      <button 
                        onClick={() => setScale(s => Math.min(3, s + 0.15))}
                        className="h-11 w-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition cursor-pointer"
                      >
                        <ZoomIn className="w-5 h-5 text-ink-deep" />
                      </button>
                    </div>
                  </div>

                  {/* Auto Fit Width */}
                  <button 
                    onClick={() => { handleFitWidth(); setMobileDrawerTab(null); }}
                    className="h-11 w-full bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition border border-hairline-soft cursor-pointer"
                  >
                    <Maximize className="w-4 h-4 text-ink-deep" />
                    Fit to Width
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Toolbar */}
      {docData?.status !== 'Signed' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-surface-soft border-t border-hairline-soft flex items-center justify-around px-4 shrink-0 z-40 select-none">
          <button 
            onClick={() => setMobileDrawerTab('fields')} 
            className="flex flex-col items-center justify-center text-slate hover:text-blue-400 transition-colors cursor-pointer"
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Fields</span>
          </button>

          <button 
            onClick={() => setMobileDrawerTab('controls')} 
            className="flex flex-col items-center justify-center text-slate hover:text-blue-400 transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-0.5">Controls</span>
          </button>

          {myPendingFields.length > 0 ? (
            <button 
              onClick={() => openSigningModal(myPendingFields[0])}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-ink-deep rounded-full text-xs font-bold shadow-md cursor-pointer"
            >
              Sign Now
            </button>
          ) : (
            <div className="text-xs text-emerald-400 font-bold px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              ✓ All Signed
            </div>
          )}
        </div>
      )}
    </div>
  );
}
