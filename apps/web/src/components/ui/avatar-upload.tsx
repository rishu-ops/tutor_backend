'use client';

import { useState, useRef, DragEvent } from 'react';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import { mediaApi } from '@/lib/api';

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  token: string;
  className?: string;
}

export function AvatarUpload({ value, onChange, token, className = '' }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // Basic validations
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const url = await mediaApi.uploadImage(file, token);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile photo');
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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
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

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-28 h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 group ${
          isDragOver
            ? 'border-[#00A453] bg-[#e6f6ee]'
            : value
            ? 'border-transparent bg-[#FAFAFA]'
            : 'border-[#dadee2] hover:border-[#00A453] bg-white hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />

        {value ? (
          <>
            {/* Image Preview */}
            <img src={value} alt="Avatar Preview" className="w-full h-full object-cover" />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
              <Camera className="w-6 h-6 mb-1 text-white" />
              <span className="text-[10px] font-semibold">Change Photo</span>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 p-1 bg-white hover:bg-red-50 text-red-500 rounded-full border border-[#dadee2] hover:border-red-200 shadow-sm transition-colors z-10"
              title="Remove Photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : isUploading ? (
          <div className="flex flex-col items-center justify-center text-[#647380] gap-1">
            <Loader2 className="w-6 h-6 text-[#00A453] animate-spin" />
            <span className="text-[10px] font-medium">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3 text-[#647380]">
            <Upload className="w-5 h-5 mb-1.5 text-[#8c9ba5] group-hover:text-[#00A453] transition-colors" />
            <span className="text-[11px] font-semibold text-[#00060c] group-hover:text-[#00A453] transition-colors">
              Upload Photo
            </span>
            <span className="text-[9px] text-[#8c9ba5] mt-0.5">Drag & drop here</span>
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs font-semibold text-red-500 text-center max-w-[200px]">
          {error}
        </span>
      )}
    </div>
  );
}
