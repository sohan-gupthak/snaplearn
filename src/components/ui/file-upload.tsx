import React, { useState, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Upload, X } from 'lucide-react';

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
}

export function FileUpload({
  className,
  onFileSelected,
  accept = 'video/mp4',
  maxSize = 500 * 1024 * 1024, // 500MB default
  label = 'Upload Video',
  ...props
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.match(accept)) {
      setError(`Only ${accept} files are allowed`);
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full',
        className
      )}
      {...props}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer',
            isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">{label} (MP4 up to {maxSize / (1024 * 1024)}MB)</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full p-4 mt-4 bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="text-gray-500 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
