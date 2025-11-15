import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage bucket name for toy images
 */
const TOYS_BUCKET = 'toys';

/**
 * File extension for uploaded images
 */
const FILE_EXTENSION = '.jpg';

/**
 * Result of successful image upload to Supabase Storage
 */
export interface UploadResult {
  path: string;
  thumbnailPath: string;
  publicUrl: string;
}

/**
 * Generates a storage path for a toy image
 *
 * Path format: /toys/{user_id}/{toy_id}/{image_order}_{timestamp}.jpg
 *
 * @param userId - ID of the user who owns the toy
 * @param toyId - ID of the toy listing
 * @param imageOrder - Zero-based index of the image (0 for first, 1 for second, etc.)
 * @returns Storage path string
 */
function generateImagePath(userId: string, toyId: string, imageOrder: number): string {
  const timestamp = Date.now();
  return `toys/${userId}/${toyId}/${imageOrder}_${timestamp}${FILE_EXTENSION}`;
}

/**
 * Generates a storage path for a toy thumbnail
 *
 * Path format: /toys/{user_id}/{toy_id}/{image_order}_thumb_{timestamp}.jpg
 *
 * @param userId - ID of the user who owns the toy
 * @param toyId - ID of the toy listing
 * @param imageOrder - Zero-based index of the image (0 for first, 1 for second, etc.)
 * @returns Storage path string
 */
function generateThumbnailPath(userId: string, toyId: string, imageOrder: number): string {
  const timestamp = Date.now();
  return `toys/${userId}/${toyId}/${imageOrder}_thumb_${timestamp}${FILE_EXTENSION}`;
}

/**
 * Gets the public URL for a storage file
 *
 * @param path - Storage path (without bucket name)
 * @returns Public URL for accessing the file
 */
function getPublicUrl(path: string): string {
  return `${TOYS_BUCKET}/${path}`;
}

/**
 * Uploads both resized and thumbnail images to Supabase Storage
 *
 * Storage structure:
 * - toys/{user_id}/{toy_id}/{image_order}_{timestamp}.jpg (main image)
 * - toys/{user_id}/{toy_id}/{image_order}_thumb_{timestamp}.jpg (thumbnail)
 *
 * Files are stored in the 'toys' bucket with:
 * - Content-Type: image/jpeg
 * - Cache-Control: public, max-age=31536000 (1 year - images are immutable)
 *
 * Both uploads are performed sequentially. If either upload fails,
 * the operation is aborted and an error is thrown.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the user who owns the toy
 * @param toyId - ID of the toy listing
 * @param imageOrder - Zero-based index of the image in the listing
 * @param resizedBuffer - Processed main image buffer (800x800px)
 * @param thumbnailBuffer - Processed thumbnail buffer (300x300px)
 * @returns Upload result with paths and public URL
 * @throws Error if either upload fails
 *
 * @example
 * const result = await uploadImage(
 *   supabase,
 *   'user123',
 *   'toy456',
 *   0,
 *   resizedImageBuffer,
 *   thumbnailImageBuffer
 * );
 * console.log('Image uploaded at:', result.publicUrl);
 */
export async function uploadImage(
  supabase: SupabaseClient,
  userId: string,
  toyId: string,
  imageOrder: number,
  resizedBuffer: Buffer,
  thumbnailBuffer: Buffer
): Promise<UploadResult> {
  // Validate inputs
  if (!userId || userId.trim().length === 0) {
    throw new Error('userId is required and must not be empty');
  }

  if (!toyId || toyId.trim().length === 0) {
    throw new Error('toyId is required and must not be empty');
  }

  if (imageOrder < 0 || !Number.isInteger(imageOrder)) {
    throw new Error('imageOrder must be a non-negative integer');
  }

  if (!resizedBuffer || resizedBuffer.length === 0) {
    throw new Error('resizedBuffer is required and must not be empty');
  }

  if (!thumbnailBuffer || thumbnailBuffer.length === 0) {
    throw new Error('thumbnailBuffer is required and must not be empty');
  }

  // Generate storage paths
  const imagePath = generateImagePath(userId, toyId, imageOrder);
  const thumbnailPath = generateThumbnailPath(userId, toyId, imageOrder);

  try {
    // Upload main image
    const { error: imageError } = await supabase.storage
      .from(TOYS_BUCKET)
      .upload(imagePath, resizedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year - images are immutable
        upsert: false, // Prevent accidental overwrites
      });

    if (imageError) {
      throw new Error(`Failed to upload main image: ${imageError.message}`);
    }

    // Upload thumbnail
    const { error: thumbError } = await supabase.storage
      .from(TOYS_BUCKET)
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year - images are immutable
        upsert: false, // Prevent accidental overwrites
      });

    if (thumbError) {
      // Clean up uploaded main image on thumbnail upload failure
      await supabase.storage.from(TOYS_BUCKET).remove([imagePath]).catch(() => {
        // Silently ignore cleanup errors
      });

      throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
    }

    // Get public URL for the main image
    const { data: publicUrlData } = supabase.storage
      .from(TOYS_BUCKET)
      .getPublicUrl(imagePath);

    const publicUrl = publicUrlData?.publicUrl || getPublicUrl(imagePath);

    return {
      path: imagePath,
      thumbnailPath,
      publicUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Image upload failed: ${errorMessage}`);
  }
}

/**
 * Deletes an image and its thumbnail from Supabase Storage
 *
 * This is a utility function for cleanup operations when
 * a toy listing is deleted or images need to be replaced.
 *
 * @param supabase - Supabase client instance
 * @param imagePath - Path to the main image
 * @param thumbnailPath - Path to the thumbnail
 * @throws Error if deletion fails
 */
export async function deleteImages(
  supabase: SupabaseClient,
  imagePath: string,
  thumbnailPath: string
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(TOYS_BUCKET)
      .remove([imagePath, thumbnailPath]);

    if (error) {
      throw new Error(`Failed to delete images: ${error.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Image deletion failed: ${errorMessage}`);
  }
}
