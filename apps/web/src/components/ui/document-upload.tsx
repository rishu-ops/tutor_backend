'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, X, FileText, CheckCircle2 } from 'lucide-react';
import { mediaApi } from '@/lib/api';

interface DocumentUploadProps {
  value?: string;
  onChange: (url: string) => void;
  token: string;
  className?: string;
}

export function DocumentUpload({ value, onChange, token, className = '' }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // Validations: PDF or image
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or an image file (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const url = await mediaApi.uploadDocument(file, token);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get simple display filename from URL
  const getDisplayFilename = () => {
    if (!value) return '';
    try {
      const parts = value.split('/');
      const rawName = parts[parts.length - 1];
      // remove prefix timestamp
      return rawName.replace(/^\d+-/, '');
    } catch {
      return 'Certificate File';
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/*"
        className="hidden"
        disabled={isUploading}
      />

      {value ? (
        <div className="flex items-center justify-between gap-3 p-3 bg-[#e6f6ee]/30 border border-[#00A453]/20 rounded-[8px] transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-[#00A453] shrink-0" />
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#00A453] hover:underline truncate"
            >
              {getDisplayFilename()}
            </a>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 text-[#647380] hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#dadee2] hover:border-[#004fcb] text-[#2d2d2d] rounded-[8px] text-xs font-bold transition-all shadow-none hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 text-[#004fcb] animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-[#647380]" />
              <span>Upload Certificate</span>
            </>
          )}
        </button>
      )}

      {error && (
        <span className="text-[10px] font-bold text-red-500 mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
