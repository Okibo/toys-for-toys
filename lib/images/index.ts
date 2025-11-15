/**
 * Image processing and validation utilities for toy listings
 *
 * This module provides a complete pipeline for handling image uploads:
 * - Validation: File format, size, dimensions, and magic bytes
 * - Processing: Resizing, thumbnail creation, EXIF stripping
 * - Storage: Upload to Supabase with error handling
 *
 * @example
 * import { processAndUploadImage } from '@/lib/images';
 *
 * const result = await processAndUploadImage(
 *   supabase,
 *   userId,
 *   toyId,
 *   0,
 *   fileBuffer,
 *   filename
 * );
 */

// Validator exports
export { validateImageFile, type ImageValidationResult } from './image-validator';

// Processor exports
export { processImage, type ProcessedImages } from './image-processor';

// Storage uploader exports
export {
  uploadImage,
  deleteImages,
  type UploadResult,
} from './storage-uploader';

// Image processing service exports
export {
  processAndUploadImage,
  parseImageProcessingError,
  getImageProcessingErrorMessage,
  type ImageProcessingResult,
  type ImageProcessingError,
} from './image-processing-service';
