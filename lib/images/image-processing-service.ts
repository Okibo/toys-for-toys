import { SupabaseClient } from '@supabase/supabase-js';
import { validateImageFile, ImageValidationResult } from './image-validator';
import { processImage, ProcessedImages } from './image-processor';
import { uploadImage, UploadResult } from './storage-uploader';

/**
 * Complete result of the image processing and upload pipeline
 */
export interface ImageProcessingResult extends UploadResult {
  validation: ImageValidationResult;
  processingTime: number;
}

/**
 * Error details for image processing failures
 */
export interface ImageProcessingError {
  stage: 'validation' | 'processing' | 'upload';
  message: string;
  details?: string[];
}

/**
 * Processes and uploads an image through the complete pipeline
 *
 * Pipeline stages:
 * 1. VALIDATION: Checks file size, magic bytes, dimensions, and format
 * 2. PROCESSING: Resizes images and creates thumbnails, strips EXIF data
 * 3. UPLOAD: Stores processed images in Supabase Storage
 *
 * Error handling:
 * - Validation errors are collected and returned with detailed messages
 * - Processing errors abort the operation with context about what failed
 * - Upload errors trigger cleanup of partially uploaded files
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user who owns the toy
 * @param toyId - ID of the toy listing
 * @param imageOrder - Zero-based index of the image in the listing
 * @param fileBuffer - Raw file buffer from user upload
 * @param filename - Original filename for extension validation
 * @returns Complete processing result with paths and metadata
 * @throws Error with ImageProcessingError context if any stage fails
 *
 * @example
 * try {
 *   const result = await processAndUploadImage(
 *     supabase,
 *     'user123',
 *     'toy456',
 *     0,
 *     fileBuffer,
 *     'my-toy.jpg'
 *   );
 *   console.log('Successfully uploaded:', result.publicUrl);
 * } catch (error) {
 *   console.error('Upload failed:', error.message);
 * }
 */
export async function processAndUploadImage(
  supabase: SupabaseClient,
  userId: string,
  toyId: string,
  imageOrder: number,
  fileBuffer: Buffer,
  filename: string
): Promise<ImageProcessingResult> {
  const startTime = performance.now();

  // STAGE 1: VALIDATION
  let validationResult: ImageValidationResult;
  try {
    validationResult = await validateImageFile(fileBuffer, filename);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const processingError: ImageProcessingError = {
      stage: 'validation',
      message: `Image validation failed: ${errorMessage}`,
    };
    throw new Error(JSON.stringify(processingError));
  }

  // Check validation result
  if (!validationResult.valid) {
    const processingError: ImageProcessingError = {
      stage: 'validation',
      message: 'Image validation failed',
      details: validationResult.errors,
    };
    throw new Error(JSON.stringify(processingError));
  }

  // STAGE 2: PROCESSING
  let processedImages: ProcessedImages;
  try {
    processedImages = await processImage(fileBuffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const processingError: ImageProcessingError = {
      stage: 'processing',
      message: `Image processing failed: ${errorMessage}`,
    };
    throw new Error(JSON.stringify(processingError));
  }

  // STAGE 3: UPLOAD
  let uploadResult: UploadResult;
  try {
    uploadResult = await uploadImage(
      supabase,
      userId,
      toyId,
      imageOrder,
      processedImages.resized,
      processedImages.thumbnail
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const processingError: ImageProcessingError = {
      stage: 'upload',
      message: `Image upload failed: ${errorMessage}`,
    };
    throw new Error(JSON.stringify(processingError));
  }

  // Calculate processing time
  const processingTime = performance.now() - startTime;

  return {
    ...uploadResult,
    validation: validationResult,
    processingTime,
  };
}

/**
 * Parses an image processing error thrown by processAndUploadImage
 *
 * Safely extracts error details from the JSON-encoded error message
 * and provides a user-friendly error object.
 *
 * @param error - Error thrown from processAndUploadImage
 * @returns Parsed ImageProcessingError or null if parsing fails
 *
 * @example
 * try {
 *   await processAndUploadImage(...);
 * } catch (error) {
 *   const processingError = parseImageProcessingError(error);
 *   if (processingError?.stage === 'validation') {
 *     console.error('Validation errors:', processingError.details);
 *   }
 * }
 */
export function parseImageProcessingError(
  error: unknown
): ImageProcessingError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  try {
    return JSON.parse(error.message) as ImageProcessingError;
  } catch {
    // If parsing fails, return generic error
    return {
      stage: 'processing',
      message: error.message,
    };
  }
}

/**
 * Gets a user-friendly error message from an image processing error
 *
 * Formats the error details into a readable message suitable for
 * displaying to end users.
 *
 * @param error - Error thrown from processAndUploadImage
 * @returns Formatted error message
 */
export function getImageProcessingErrorMessage(error: unknown): string {
  const processingError = parseImageProcessingError(error);

  if (!processingError) {
    return 'An unknown error occurred while uploading the image';
  }

  const { stage, message, details } = processingError;

  let baseMessage = message;
  if (stage === 'validation' && details && details.length > 0) {
    baseMessage = `Image validation failed:\n${details.join('\n')}`;
  }

  return baseMessage;
}
