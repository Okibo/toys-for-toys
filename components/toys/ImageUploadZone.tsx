import React, { useRef, useState, useCallback } from 'react';

interface ImageUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasImages?: boolean;
  errors?: {
    maxImages?: string;
    fileSize?: string;
    invalidFormat?: string;
    general?: string;
  };
  className?: string;
}

/**
 * Drag-and-drop file upload zone for toy images
 * Supports drag-over visual feedback and file input button
 */
export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onFilesSelected,
  disabled = false,
  isLoading = false,
  hasImages = false,
  errors = {},
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  }, [disabled, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isLoading) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, isLoading, onFilesSelected]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input value to allow selecting the same file again
    e.currentTarget.value = '';
  }, [onFilesSelected]);

  const handleClickZone = useCallback(() => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isLoading]);

  const hasErrors = Object.keys(errors).some(key => errors[key as keyof typeof errors]);

  return (
    <div className={className}>
      {/* Upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickZone}
        className={`
          p-8 sm:p-12 md:p-16 rounded-lg border-2 border-dashed
          transition-all cursor-pointer
          ${
            isDragOver
              ? 'border-blue-500 bg-blue-50'
              : hasErrors
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50'
          }
          ${
            disabled || isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-blue-400 hover:bg-blue-50'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        role="button"
        tabIndex={disabled || isLoading ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isLoading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-disabled={disabled || isLoading}
        aria-label="Drag and drop images here or click to select"
      >
        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="text-4xl mb-4 text-gray-400" aria-hidden="true">
            📸
          </div>

          {/* Text */}
          <p className="text-gray-700 font-medium mb-2">
            {isDragOver ? 'Drop images here' : 'Drag images here or click to select'}
          </p>

          {/* Helper text */}
          <p className="text-sm text-gray-500 mb-4">
            {isLoading ? 'Processing images...' : 'Max 5 images, up to 10MB each, JPG/PNG/WebP'}
          </p>

          {/* Choose Files button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={disabled || isLoading}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
              border border-gray-300 bg-white text-gray-700
              hover:bg-gray-50 hover:border-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:ring-blue-500
            `}
            aria-label="Choose images to upload"
          >
            {isLoading ? 'Processing...' : 'Choose Images'}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        disabled={disabled || isLoading}
        className="hidden"
        aria-hidden="true"
      />

      {/* Error messages */}
      {hasErrors && (
        <div
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          {errors.maxImages && (
            <p className="text-red-700 text-sm font-medium mb-1">{errors.maxImages}</p>
          )}
          {errors.fileSize && (
            <p className="text-red-700 text-sm font-medium mb-1">{errors.fileSize}</p>
          )}
          {errors.invalidFormat && (
            <p className="text-red-700 text-sm font-medium mb-1">{errors.invalidFormat}</p>
          )}
          {errors.general && (
            <p className="text-red-700 text-sm font-medium">{errors.general}</p>
          )}
        </div>
      )}

      {/* Info text */}
      {hasImages && !hasErrors && (
        <p className="mt-3 text-sm text-green-600 font-medium">
          ✓ Images uploaded successfully
        </p>
      )}
    </div>
  );
};

export default ImageUploadZone;
