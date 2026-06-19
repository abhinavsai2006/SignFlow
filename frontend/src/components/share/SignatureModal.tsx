import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import { X, Upload, Type, Edit3, CheckCircle2, RotateCcw } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import type { SignatureField } from '../../hooks/useShareDocument';

interface SignatureModalProps {
  activeField: SignatureField | null;
  signerEmail: string;
  signerName: string;
  onClose: () => void;
  onSignConfirm: (signatureVal: string, signerName: string) => Promise<void>;
  isSubmitting: boolean;
}

const FONTS = [
  { id: 'great-vibes',    label: 'Elegant',  class: 'font-great-vibes' },
  { id: 'dancing-script', label: 'Dancing',  class: 'font-dancing-script' },
  { id: 'allura',         label: 'Allura',   class: 'font-allura' },
  { id: 'cursive',        label: 'Classic',  class: 'font-cursive' },
] as const;

type FontId = typeof FONTS[number]['id'];
type TabType = 'draw' | 'type' | 'upload';

export function SignatureModal({
  activeField,
  signerEmail,
  signerName,
  onClose,
  onSignConfirm,
  isSubmitting,
}: SignatureModalProps) {
  const [tab, setTab] = useState<TabType>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<FontId>('great-vibes');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [penColor, setPenColor] = useState<'#1a1a1a' | '#1e3a8a' | '#6b21a8'>('#1a1a1a');
  const [isEmpty, setIsEmpty] = useState(true);

  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset state whenever a new field becomes active
  useEffect(() => {
    if (!activeField) return;
    setTab('draw');
    setTypedName(signerName || signerEmail.split('@')[0]);
    setUploadedBase64('');
    setIsEmpty(true);
    const t = setTimeout(() => {
      signatureCanvasRef.current?.clear();
      setIsEmpty(true);
    }, 80);
    return () => clearTimeout(t);
  }, [activeField, signerName, signerEmail]);

  // Keep canvas sized to its container
  useEffect(() => {
    if (tab !== 'draw' || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const observer = new ResizeObserver(() => {
      const canvas = container.querySelector('canvas');
      if (!canvas) return;
      const w = container.clientWidth;
      if (w > 0 && canvas.width !== w) {
        canvas.width = w;
        signatureCanvasRef.current?.clear();
        setIsEmpty(true);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [tab, activeField]);

  if (!activeField) return null;

  const fieldLabel =
    activeField.type === 'Signature' ? 'Signature' :
    activeField.type === 'Initials'  ? 'Initials'  :
    activeField.type;

  const handleConfirm = async () => {
    let val = '';
    if (tab === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas || canvas.isEmpty()) {
        alert('Please draw your signature in the box below.');
        return;
      }
      val = canvas.getCanvas().toDataURL('image/png');
    } else if (tab === 'type') {
      if (!typedName.trim()) { alert('Please enter your name.'); return; }
      val = `${selectedFont}:${typedName.trim()}`;
    } else {
      if (!uploadedBase64) { alert('Please upload a signature image.'); return; }
      val = uploadedBase64;
    }
    await onSignConfirm(val, signerName || signerEmail.split('@')[0]);
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Image too large. Max 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setUploadedBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    /* Full-screen overlay — always centered */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card — fixed width, never shrinks to a sliver */}
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {fieldLabel === 'Signature' ? 'Create Your Signature' : `Add ${fieldLabel}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Signing as <span className="font-semibold text-slate-700">{signerEmail}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white shrink-0">
          {(['draw', 'type', 'upload'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold capitalize transition border-b-2 ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {t === 'draw'   && <><Edit3  className="w-3.5 h-3.5 inline mb-0.5 mr-1" />Draw</>}
              {t === 'type'   && <><Type   className="w-3.5 h-3.5 inline mb-0.5 mr-1" />Type</>}
              {t === 'upload' && <><Upload className="w-3.5 h-3.5 inline mb-0.5 mr-1" />Upload</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">

          {/* DRAW */}
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Draw your signature below</p>
                <div className="flex items-center gap-2">
                  {(['#1a1a1a', '#1e3a8a', '#6b21a8'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => { setPenColor(c); signatureCanvasRef.current?.clear(); setIsEmpty(true); }}
                      className={`w-5 h-5 rounded-full border-2 transition ${penColor === c ? 'border-blue-500 scale-110' : 'border-slate-300'}`}
                      style={{ background: c }}
                    />
                  ))}
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <button
                    onClick={() => { signatureCanvasRef.current?.clear(); setIsEmpty(true); }}
                    className="p-1 hover:bg-slate-100 rounded transition text-slate-500"
                    title="Clear"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div
                ref={canvasContainerRef}
                className="border-2 border-slate-200 rounded-xl bg-white overflow-hidden"
                style={{ height: 160 }}
              >
                <SignatureCanvas
                  ref={signatureCanvasRef}
                  penColor={penColor}
                  canvasProps={{
                    className: 'w-full h-full cursor-crosshair',
                    style: { width: '100%', height: '100%', display: 'block' },
                  }}
                  velocityFilterWeight={0.6}
                  minWidth={1.2}
                  maxWidth={3.5}
                  onBegin={() => setIsEmpty(false)}
                  onEnd={() => setIsEmpty(signatureCanvasRef.current?.isEmpty() ?? true)}
                />
              </div>

              {isEmpty && (
                <p className="text-center text-xs text-slate-400">← Draw your signature inside the box →</p>
              )}
            </div>
          )}

          {/* TYPE */}
          {tab === 'type' && (
            <div className="space-y-4">
              <input
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                autoFocus
              />
              <div className="grid grid-cols-4 gap-2">
                {FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => setSelectedFont(font.id)}
                    className={`py-3 border-2 rounded-xl transition flex flex-col items-center gap-1 ${
                      selectedFont === font.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-lg text-slate-800 leading-none ${font.class}`}>
                      {typedName ? typedName.split(' ')[0] : 'Sign'}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                      {font.label}
                    </span>
                  </button>
                ))}
              </div>
              {typedName && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex items-center justify-center bg-slate-50 min-h-[80px]">
                  <span className={`text-4xl text-slate-800 leading-none ${FONTS.find(f => f.id === selectedFont)?.class}`}>
                    {typedName}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">Click to upload signature image</p>
                <p className="text-xs text-slate-400 mt-1">PNG or JPG • Max 3 MB</p>
              </label>
              {uploadedBase64 && (
                <div className="border-2 border-slate-200 rounded-xl p-4 flex items-center justify-center min-h-[80px] bg-slate-50">
                  <img src={uploadedBase64} alt="Signature preview" className="max-h-[100px] max-w-full object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Applying…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Apply {fieldLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
