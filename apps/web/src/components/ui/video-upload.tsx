'use client';

import { useState, useRef, DragEvent } from 'react';
import { Video, Loader2, X, Film, Upload } from 'lucide-react';
import { mediaApi } from '@/lib/api';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  token: string;
  className?: string;
}

export function VideoUpload({ value, onChange, token, className = '' }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // Validations: MP4, WEBM, MOV/QuickTime
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WEBM, MOV)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('Video file must be smaller than 50MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const url = await mediaApi.uploadVideo(file, token);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Video upload failed. Try a smaller file.');
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
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      <label className="block text-xs font-bold text-[#384148] mb-2">
        <span className="uppercase tracking-wider">Introduction Video</span> <span className="text-[10px] text-[#8c9ba5] italic font-normal lowercase">(optional)</span>
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        disabled={isUploading}
      />

      {value ? (
        <div className="relative border border-[#dadee2] rounded-[12px] bg-slate-50 overflow-hidden group">
          <video
            src={value}
            controls
            className="w-full max-h-56 object-contain bg-black"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-red-500 rounded-full border border-[#dadee2] hover:border-red-200 shadow-md transition-all z-10"
            title="Remove Video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[12px] p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group text-center ${isDragOver
            ? 'border-[#00A453] bg-[#e6f6ee]/30'
            : 'border-[#dadee2] hover:border-[#00A453] bg-white hover:bg-slate-50'
            }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 text-[#00A453] animate-spin" />
              <span className="text-xs font-semibold text-[#00060c]">Uploading video...</span>
              <span className="text-[10px] text-[#8c9ba5]">This might take a minute depending on file size</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 flex items-center justify-center group-hover:text-[#00A453] rounded-full  mb-3 group-hover:scale-105 transition-transform ">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#00060c] group-hover:text-[#00A453] transition-colors">
                Upload Introduction Video
              </span>
              <span className="text-[12px] text-[#8c9ba5] mt-1.5 max-w-xs leading-relaxed">
                Drag & drop your video file here, or click to browse. Max 50MB (MP4, WEBM, MOV).
              </span>
            </div>
          )}
        </div>
      )}

      {error && (
        <span className="text-xs font-semibold text-red-500 text-center mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
