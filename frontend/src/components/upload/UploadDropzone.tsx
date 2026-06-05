import { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';

interface UploadDropzoneProps {
  onUploadSuccess: (document: any) => void;
}

export default function UploadDropzone({ onUploadSuccess }: UploadDropzoneProps) {
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
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/docs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
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
    <div className="w-full max-w-2xl mx-auto mt-8">
      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
            dragActive 
              ? 'border-pink-400 bg-pink-500/10' 
              : 'border-white/20 hover:border-purple-400 hover:bg-white/5 bg-white/5 backdrop-blur-md'
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
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-white/10 rounded-full">
              <UploadCloud className="w-10 h-10 text-pink-300" />
            </div>
            <div>
              <p className="text-xl font-semibold text-white">Click or drag document to upload</p>
              <p className="text-sm text-white/50 mt-1">Only PDF documents up to 10MB are supported</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 relative">
          <button 
            onClick={() => setFile(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <FileIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white font-medium truncate">{file.name}</p>
              <p className="text-white/50 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : null}
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
