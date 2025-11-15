import React from 'react';
import ImageUploadZone from './ImageUploadZone';
import ImagePreviewCarousel from './ImagePreviewCarousel';

interface UploadedImage {
  id: string;
  preview: string;
  order: number;
}

interface ImageUploadSectionProps {
  images: UploadedImage[];
  onAddImages: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onReorderImages: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  isLoading?: boolean;
  errors?: {
    maxImages?: string;
    fileSize?: string;
    invalidFormat?: string;
    general?: string;
  };
  className?: string;
}

/**
 * Image upload section combining drag-drop zone and preview carousel
 * Provides complete image management functionality for toy listings
 */
export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  onAddImages,
  onRemoveImage,
  onReorderImages,
  disabled = false,
  isLoading = false,
  errors = {},
  className = ''
}) => {
  return (
    <div className={`mt-6 ${className}`}>
      {/* Section label */}
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Add Images
        <span className="text-gray-500 text-sm font-normal ml-2">(required, min 1, max 5)</span>
      </h2>

      {/* Upload zone */}
      <ImageUploadZone
        onFilesSelected={onAddImages}
        disabled={disabled}
        isLoading={isLoading}
        hasImages={images.length > 0}
        errors={errors}
      />

      {/* Preview carousel */}
      {images.length > 0 && (
        <ImagePreviewCarousel
          images={images}
          onRemove={onRemoveImage}
          onReorder={onReorderImages}
          disabled={disabled}
        />
      )}

      {/* Info text */}
      <p className="mt-4 text-xs text-gray-600">
        <span className="font-medium">Tip:</span> Upload at least 1 clear photo of the toy to increase interest from other users.
      </p>
    </div>
  );
};

export default ImageUploadSection;
