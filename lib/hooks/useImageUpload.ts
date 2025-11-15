import { useState, useCallback } from 'react';

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  order: number;
  isLoading?: boolean;
  error?: string;
}

export interface ImageUploadErrors {
  maxImages?: string;
  fileSize?: string;
  invalidFormat?: string;
  general?: string;
}

export interface UseImageUploadReturn {
  images: UploadedImage[];
  errors: ImageUploadErrors;
  isLoading: boolean;
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;
  clearImages: () => void;
  getOrderedImages: () => UploadedImage[];
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Custom hook for managing image uploads with validation and reordering
 * Handles multiple file uploads, previews, and drag-to-reorder functionality
 */
export function useImageUpload(): UseImageUploadReturn {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<ImageUploadErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate a single file
   */
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File "${file.name}" is too large. Maximum size is 10MB.`
      };
    }

    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        error: `File "${file.name}" has an invalid format. Only JPG, PNG, and WebP are allowed.`
      };
    }

    return { isValid: true };
  }, []);

  /**
   * Add images from file list
   * Validates file count, size, and format
   */
  const addImages = useCallback(async (files: File[]) => {
    setErrors({});
    const newErrors: ImageUploadErrors = {};

    // Check if adding these files would exceed the limit
    if (images.length + files.length > MAX_IMAGES) {
      newErrors.maxImages = `You can only upload a maximum of ${MAX_IMAGES} images. Currently have ${images.length}.`;
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const validFiles: UploadedImage[] = [];
      const fileErrors: string[] = [];

      // Validate and process each file
      for (const file of files) {
        const validation = validateFile(file);

        if (!validation.isValid) {
          fileErrors.push(validation.error || 'Invalid file');
          continue;
        }

        // Create preview URL
        const preview = URL.createObjectURL(file);
        const id = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        validFiles.push({
          id,
          file,
          preview,
          order: images.length + validFiles.length,
          isLoading: false
        });
      }

      // Update images state
      if (validFiles.length > 0) {
        setImages(prev => {
          const updated = [...prev, ...validFiles];
          // Update order for all images
          return updated.map((img, idx) => ({ ...img, order: idx }));
        });
      }

      // Set errors if any files failed validation
      if (fileErrors.length > 0) {
        newErrors.general = `${fileErrors.length} file(s) failed validation`;
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  }, [images.length, validateFile]);

  /**
   * Remove an image by ID
   */
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      // Revoke the blob URL to free memory
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      // Update order for remaining images
      return updated.map((img, idx) => ({ ...img, order: idx }));
    });
    setErrors({});
  }, []);

  /**
   * Reorder images (drag-to-reorder)
   */
  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= images.length || toIndex < 0 || toIndex >= images.length) {
      return;
    }

    setImages(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      // Update order for all images
      return updated.map((img, idx) => ({ ...img, order: idx }));
    });
  }, [images.length]);

  /**
   * Clear all images
   */
  const clearImages = useCallback(() => {
    // Revoke all blob URLs to free memory
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setErrors({});
  }, [images]);

  /**
   * Get images in order
   */
  const getOrderedImages = useCallback(() => {
    return [...images].sort((a, b) => a.order - b.order);
  }, [images]);

  return {
    images,
    errors,
    isLoading,
    addImages,
    removeImage,
    reorderImages,
    clearImages,
    getOrderedImages
  };
}
