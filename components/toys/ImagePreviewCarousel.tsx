import React, { useState, useCallback, useRef } from 'react';

interface UploadedImage {
  id: string;
  preview: string;
  order: number;
}

interface ImagePreviewCarouselProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Image preview carousel with drag-to-reorder functionality
 * Displays uploaded images in a grid with delete and reorder controls
 */
export const ImagePreviewCarousel: React.FC<ImagePreviewCarouselProps> = ({
  images,
  onRemove,
  onReorder,
  disabled = false,
  className = ''
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  }, []);

  const handleDragLeave = useCallback(() => {
    dragOverIndex.current = null;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    dragOverIndex.current = null;
  }, [draggedIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    dragOverIndex.current = null;
  }, []);

  if (images.length === 0) {
    return null;
  }

  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const totalImages = images.length;

  return (
    <div className={`mt-6 ${className}`}>
      {/* Header with count */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          Preview
        </h3>
        <span className="text-xs text-gray-500 font-medium">
          {totalImages} of 5 images
        </span>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              relative aspect-square rounded-lg overflow-hidden border-2
              transition-all
              ${
                draggedIndex === index
                  ? 'opacity-50 border-blue-400'
                  : dragOverIndex.current === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-100'
              }
              ${!disabled && 'hover:border-gray-400 hover:shadow-md cursor-move group'}
              ${disabled && 'opacity-75'}
            `}
            role="group"
            aria-label={`Image ${index + 1} of ${totalImages}`}
          >
            {/* Image */}
            <img
              src={image.preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay with controls */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end p-2 gap-1">
              {/* Drag handle */}
              {!disabled && (
                <div className="flex-1 flex items-center justify-center bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity py-1 text-xs font-medium cursor-grab active:cursor-grabbing">
                  <span aria-hidden="true">⋮⋮</span>
                  <span className="sr-only">Drag to reorder</span>
                </div>
              )}

              {/* Delete button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(image.id)}
                  className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity p-1 min-w-[32px] h-[32px]"
                  aria-label={`Remove image ${index + 1}`}
                  title="Delete image"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              )}
            </div>

            {/* Order indicator */}
            <div className="absolute top-1 right-1 bg-gray-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {index + 1}
            </div>

            {/* Loading state */}
            {false && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-blue-500" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Help text */}
      {!disabled && totalImages > 1 && (
        <p className="mt-4 text-xs text-gray-600 text-center">
          Drag images to reorder • Click ✕ to delete
        </p>
      )}
    </div>
  );
};

export default ImagePreviewCarousel;
