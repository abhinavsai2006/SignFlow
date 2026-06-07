import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import { X, Undo, Upload, Type, Edit3, CheckCircle2 } from 'lucide-react';
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

export function SignatureModal({
  activeField,
  signerEmail,
  signerName,
  onClose,
  onSignConfirm,
  isSubmitting
}: SignatureModalProps) {
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<'great-vibes' | 'dancing-script' | 'allura' | 'cursive'>('great-vibes');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [signatureColor, setSignatureColor] = useState<'black' | 'darkgray' | 'blue'>('black');
  
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const drawingHistory = useRef<string[]>([]);

  useEffect(() => {
    if (activeField) {
      drawingHistory.current = [];
      setTimeout(() => signatureCanvasRef.current?.clear(), 50);
      setSignatureType('draw');
      setTypedName(signerName || signerEmail.split('@')[0]);
      setUploadedBase64('');
    }
  }, [activeField, signerName, signerEmail]);

  if (!activeField) return null;

  const handleConfirm = async () => {
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

    await onSignConfirm(signatureVal, signerName || signerEmail);
  };

  const handleUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File too large. Max 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setUploadedBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const penColor = signatureColor === 'black' ? '#000000' : signatureColor === 'darkgray' ? '#4A4A4A' : '#0064e0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-soft border border-hairline-soft rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-soft shrink-0">
          <div>
            <h2 className="font-bold text-ink-deep">Apply {activeField.type}</h2>
            <p className="text-xs text-slate">Signing as {signerEmail}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-4 h-4 text-slate" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
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

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-hairline-soft bg-white/2 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate hover:text-ink-deep border border-hairline-soft rounded-xl transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
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
  );
}
