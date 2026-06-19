import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import MetaButton from '../ui/MetaButton';
import MetaModal from '../ui/MetaModal';
import MetaInput from '../ui/MetaInput';
import { Edit3, Type, Upload, Undo, X } from 'lucide-react';

interface SignatureField {
  _id?: string;
  type: 'Signature' | 'Initials' | 'Date' | 'Text' | 'Checkbox';
  recipientEmail: string;
  signerName?: string;
}

interface SignatureProfile {
  _id: string;
  name: string;
  type: 'draw' | 'type' | 'upload';
  imageData: string;
}

interface SigningModalProps {
  isOpen: boolean;
  field: SignatureField | null;
  savedProfiles?: SignatureProfile[];
  onConfirm: (signatureVal: string, profileName: string, signatureType: 'draw' | 'type' | 'upload', saveProfile: boolean) => void;
  onClose: () => void;
}

export default function SigningModal({ isOpen, field, savedProfiles = [], onConfirm, onClose }: SigningModalProps) {
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const drawingHistory = useRef<string[]>([]);
  
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signatureColor, setSignatureColor] = useState<'black' | 'darkgray' | 'blue'>('black');
  
  // Input fields
  const [drawnProfileName, setDrawnProfileName] = useState('Draw Template');
  const [typedName, setTypedName] = useState('');
  const [typedProfileName, setTypedProfileName] = useState('Typed Template');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [uploadedProfileName, setUploadedProfileName] = useState('Uploaded Template');
  
  const [saveToProfiles, setSaveToProfiles] = useState(false);
  const [selectedFont, setSelectedFont] = useState<'great-vibes' | 'dancing-script' | 'allura' | 'cursive'>('great-vibes');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset inputs when modal is loaded/opened
  useEffect(() => {
    if (isOpen && field) {
      setTypedName(field.signerName || '');
      setErrorMsg('');
      setUploadedBase64('');
      drawingHistory.current = [];
      if (signatureCanvasRef.current) {
        signatureCanvasRef.current.clear();
      }
    }
  }, [isOpen, field]);

  const onDrawEnd = () => {
    if (signatureCanvasRef.current) {
      drawingHistory.current.push(signatureCanvasRef.current.toDataURL());
      if (drawingHistory.current.length > 10) {
        drawingHistory.current.shift(); // Eviction logic: limit to 10 entries
      }
      setErrorMsg('');
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

  const handleSignatureUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
      setErrorMsg('Invalid file format. Upload accepts PNG and JPEG images only.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    setErrorMsg('');
    let signatureVal = '';
    let profileName = 'My Signature';

    if (signatureType === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas || canvas.isEmpty()) {
        setErrorMsg('Please draw your signature before applying.');
        return;
      }
      signatureVal = canvas.toDataURL();
      profileName = drawnProfileName;
    } else if (signatureType === 'type') {
      if (!typedName.trim()) {
        setErrorMsg('Please enter your name before applying.');
        return;
      }
      signatureVal = `${selectedFont}:${typedName}`;
      profileName = typedProfileName;
    } else if (signatureType === 'upload') {
      if (!uploadedBase64) {
        setErrorMsg('Please upload an image signature.');
        return;
      }
      signatureVal = uploadedBase64;
      profileName = uploadedProfileName;
    }

    onConfirm(signatureVal, profileName, signatureType, saveToProfiles);
  };

  const getPenColor = () => {
    if (signatureColor === 'black') return '#000000';
    if (signatureColor === 'darkgray') return '#4A4A4A';
    return '#0064E0';
  };

  return (
    <MetaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create & Place Signature"
      footer={
        <div className="flex justify-end space-x-md">
          <MetaButton variant="ghost" onClick={onClose} className="rounded-full text-[14px] font-bold tracking-[-0.14px]">
            Cancel
          </MetaButton>
          <MetaButton 
            variant="buy-cta" 
            onClick={handleConfirm}
            className="rounded-full text-[14px] font-bold tracking-[-0.14px] bg-[#0064E0] hover:bg-[#0052b4]"
          >
            Apply Signature
          </MetaButton>
        </div>
      }
    >
      <div className="space-y-xl rounded-2xl">
        {/* Saved Profiles picker */}
        {savedProfiles.length > 0 && (
          <div className="border-b border-[#ced0d4] pb-md">
            <label className="block text-body-xs-bold font-bold text-[#5d6c7b] uppercase tracking-wider mb-sm">Saved Profiles</label>
            <div className="flex space-x-sm overflow-x-auto py-xxs">
              {savedProfiles.map((profile) => (
                <button
                  key={profile._id}
                  onClick={() => onConfirm(profile.imageData, profile.name, profile.type, false)}
                  className="p-sm border border-[#ced0d4] hover:border-[#0064E0] rounded-xl shrink-0 flex flex-col items-center bg-[#f1f4f7] max-w-[120px] cursor-pointer"
                >
                  {profile.imageData.startsWith('data:image') ? (
                    <img src={profile.imageData} alt={profile.name} className="h-8 object-contain mb-xxs" />
                  ) : (
                    <span className="font-cursive text-body-xs truncate w-full text-center">{profile.imageData.split(':')[1] || profile.name}</span>
                  )}
                  <span className="text-[10px] text-[#5d6c7b] truncate w-full text-center">{profile.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#f1f4f7] p-xs rounded-full border border-[#ced0d4] flex-wrap md:flex-nowrap gap-y-1">
          <MetaButton
            variant="pill-tab"
            active={signatureType === 'draw'}
            onClick={() => { setSignatureType('draw'); setErrorMsg(''); }}
            className="flex-1 rounded-full text-[14px] font-bold"
          >
            <Edit3 className="w-4 h-4 mr-2" /> Draw
          </MetaButton>
          <MetaButton
            variant="pill-tab"
            active={signatureType === 'type'}
            onClick={() => { setSignatureType('type'); setErrorMsg(''); }}
            className="flex-1 rounded-full text-[14px] font-bold"
          >
            <Type className="w-4 h-4 mr-2" /> Type
          </MetaButton>
          <MetaButton
            variant="pill-tab"
            active={signatureType === 'upload'}
            onClick={() => { setSignatureType('upload'); setErrorMsg(''); }}
            className="flex-1 rounded-full text-[14px] font-bold"
          >
            <Upload className="w-4 h-4 mr-2" /> Upload
          </MetaButton>
        </div>

        {errorMsg && (
          <div className="p-sm bg-red-50 border border-red-200 text-red-700 text-body-sm rounded-xl" data-testid="error-message">
            {errorMsg}
          </div>
        )}

        {/* Draw Mode */}
        {signatureType === 'draw' && (
          <div className="space-y-md">
            <div className="flex justify-between items-center">
              <label className="text-body-sm text-[#5d6c7b]">Use mouse or touch pad to draw signature</label>
              <div className="flex space-x-xs">
                <button 
                  onClick={undoDrawingCanvas} 
                  className="p-xs bg-[#f1f4f7] hover:bg-[#ced0d4] rounded-full text-[#0a1317]"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button 
                  onClick={clearDrawingCanvas} 
                  className="p-xs bg-[#f1f4f7] hover:bg-[#ced0d4] rounded-full text-[#0a1317]"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-[#f1f4f7] rounded-xxxl border border-[#ced0d4] overflow-hidden relative" style={{ minHeight: '160px' }}>
              {/* Baseline Guide Line */}
              <div className="absolute left-0 right-0 border-t border-dashed border-[#ced0d4] pointer-events-none" style={{ top: '60%' }} />
              <SignatureCanvas
                ref={signatureCanvasRef}
                penColor={getPenColor()}
                canvasProps={{ 
                  style: { width: '100%', minHeight: '160px' },
                  className: 'cursor-crosshair' 
                }}
                velocityFilterWeight={0.6}
                minWidth={1.5}
                maxWidth={4.0}
                onEnd={onDrawEnd}
              />
            </div>
            
            <div className="flex space-x-md items-center mb-md">
              <span className="text-body-sm font-bold text-[#0a1317]">Ink Color:</span>
              <button 
                onClick={() => setSignatureColor('black')} 
                className={`w-7 h-7 rounded-full bg-[#000000] ${signatureColor === 'black' ? 'ring-2 ring-offset-2 ring-[#0064E0]' : ''}`} 
                title="Black Ink" 
              />
              <button 
                onClick={() => setSignatureColor('darkgray')} 
                className={`w-7 h-7 rounded-full bg-[#4A4A4A] ${signatureColor === 'darkgray' ? 'ring-2 ring-offset-2 ring-[#0064E0]' : ''}`} 
                title="Dark Gray Ink" 
              />
              <button 
                onClick={() => setSignatureColor('blue')} 
                className={`w-7 h-7 rounded-full bg-[#0064E0] ${signatureColor === 'blue' ? 'ring-2 ring-offset-2 ring-[#0064E0]' : ''}`} 
                title="Blue Ink" 
              />
            </div>
            
            <div>
              <label className="block text-body-xs-bold font-bold text-[#0a1317] mb-xxs">Profile Name (to save)</label>
              <MetaInput
                value={drawnProfileName}
                onChange={(e) => setDrawnProfileName(e.target.value)}
                placeholder="E.g. Draw Template"
                className="border-[#ced0d4]"
              />
            </div>
          </div>
        )}

        {/* Type Mode */}
        {signatureType === 'type' && (
          <div className="space-y-md">
            <label className="text-body-sm text-[#5d6c7b]">Type your name and choose a signature typography style</label>
            <MetaInput
              value={typedName}
              onChange={(e) => { setTypedName(e.target.value); setErrorMsg(''); }}
              placeholder="Type name here"
              className="border-[#ced0d4]"
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
              <button
                onClick={() => setSelectedFont('great-vibes')}
                className={`p-sm border rounded-xl text-center ${selectedFont === 'great-vibes' ? 'border-[#0064E0] bg-[#0064E0]/5' : 'border-[#ced0d4] bg-white'}`}
              >
                <span className="font-great-vibes text-[16px] text-[#0064E0] block truncate">Great Vibes</span>
              </button>
              <button
                onClick={() => setSelectedFont('dancing-script')}
                className={`p-sm border rounded-xl text-center ${selectedFont === 'dancing-script' ? 'border-[#0064E0] bg-[#0064E0]/5' : 'border-[#ced0d4] bg-white'}`}
              >
                <span className="font-dancing-script text-[14px] font-bold text-[#0064E0] block truncate">Dancing</span>
              </button>
              <button
                onClick={() => setSelectedFont('allura')}
                className={`p-sm border rounded-xl text-center ${selectedFont === 'allura' ? 'border-[#0064E0] bg-[#0064E0]/5' : 'border-[#ced0d4] bg-white'}`}
              >
                <span className="font-allura text-[16px] text-[#0064E0] block truncate">Allura</span>
              </button>
              <button
                onClick={() => setSelectedFont('cursive')}
                className={`p-sm border rounded-xl text-center ${selectedFont === 'cursive' ? 'border-[#0064E0] bg-[#0064E0]/5' : 'border-[#ced0d4] bg-white'}`}
              >
                <span className="font-cursive text-[14px] text-[#0064E0] block truncate">Cursive</span>
              </button>
            </div>

            {/* Styled Preview Frame */}
            <div className="p-xl bg-[#f1f4f7] rounded-xxxl border-2 border-dashed border-[#ced0d4] text-center flex items-center justify-center min-h-[100px]">
              <span className={`text-[36px] text-[#0064E0] tracking-wider leading-none select-none ${
                selectedFont === 'great-vibes' ? 'font-great-vibes' : selectedFont === 'dancing-script' ? 'font-dancing-script' : selectedFont === 'allura' ? 'font-allura' : 'font-cursive'
              }`}>
                {typedName || 'Signature Preview'}
              </span>
            </div>

            <div>
              <label className="block text-body-xs-bold font-bold text-[#0a1317] mb-xxs">Profile Name (to save)</label>
              <MetaInput
                value={typedProfileName}
                onChange={(e) => setTypedProfileName(e.target.value)}
                placeholder="E.g. Typed Template"
                className="border-[#ced0d4]"
              />
            </div>
          </div>
        )}

        {/* Upload Mode */}
        {signatureType === 'upload' && (
          <div className="space-y-md">
            <label className="text-body-sm text-[#5d6c7b]">Upload signature image (PNG, JPG, max 2MB)</label>
            
            <div className="border-2 border-dashed border-[#ced0d4] rounded-xxxl p-xl text-center bg-[#f1f4f7] cursor-pointer relative hover:border-[#5d6c7b] transition-all">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleSignatureUploadChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mx-auto text-[#5d6c7b] mb-xs" />
              <p className="text-body-sm text-[#0a1317] font-bold">Select signature file</p>
              <p className="text-caption text-[#5d6c7b]">PNG, JPG, JPEG up to 2MB</p>
            </div>

            {uploadedBase64 && (
              <div className="p-md bg-white border border-[#ced0d4] rounded-xl flex items-center justify-center max-h-[120px]">
                <img src={uploadedBase64} alt="Uploaded signature preview" className="max-h-[100px] object-contain" />
              </div>
            )}

            <div>
              <label className="block text-body-xs-bold font-bold text-[#0a1317] mb-xxs">Profile Name (to save)</label>
              <MetaInput
                value={uploadedProfileName}
                onChange={(e) => setUploadedProfileName(e.target.value)}
                placeholder="E.g. Uploaded Template"
                className="border-[#ced0d4]"
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
            className="h-4 w-4 accent-[#0064E0]"
          />
          <label htmlFor="saveToProfiles" className="text-body-sm text-[#0a1317] select-none cursor-pointer">
            Save signature layout to my profiles template list
          </label>
        </div>
      </div>
    </MetaModal>
  );
}
