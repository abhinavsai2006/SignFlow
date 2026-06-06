import { useState, useRef } from 'react';
import api from '../../utils/api';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import MetaButton from '../ui/MetaButton';

interface UploadDropzoneProps {
  onUploadSuccess: (document: any) => void;
  workspaceId?: string;
}

export default function UploadDropzone({ onUploadSuccess, workspaceId }: UploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    if (workspaceId) {
      formData.append('workspaceId', workspaceId);
    }
    
    try {
      const response = await api.post('/docs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFile(null);
      onUploadSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`relative border rounded-xxxl p-xxl text-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-fb-blue bg-fb-blue/5' 
              : 'border-hairline-soft hover:border-hairline bg-surface-soft'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center justify-center space-y-md py-xl">
            <div className="p-sm bg-canvas rounded-circle shadow-sm border border-hairline-soft">
              <UploadCloud className="w-8 h-8 text-ink" />
            </div>
            <div>
              <p className="text-heading-sm text-ink-deep mb-xxs">Click or drag document to upload</p>
              <p className="text-body-sm text-slate">Only PDF documents up to 10MB are supported</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-canvas border border-hairline-soft rounded-xxxl p-xxl relative">
          <button 
            onClick={() => setFile(null)}
            className="absolute top-xl right-xl p-xs bg-surface-soft hover:bg-hairline-soft rounded-circle transition-colors"
          >
            <X className="w-4 h-4 text-ink-deep" />
          </button>
          
          <div className="flex items-center space-x-md mb-xl pr-xl">
            <div className="p-md bg-surface-soft rounded-xl border border-hairline-soft">
              <FileIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-subtitle-md text-ink-deep truncate">{file.name}</p>
              <p className="text-body-sm text-slate">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <MetaButton
              onClick={handleUpload}
              variant="buy-cta"
              isLoading={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </MetaButton>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-md bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg text-body-sm-bold text-center">
          {error}
        </div>
      )}
    </div>
  );
}
