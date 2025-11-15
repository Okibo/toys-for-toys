import sharp from 'sharp';

/**
 * Dimensions for resized image (main listing image)
 */
const RESIZED_WIDTH = 800;
const RESIZED_HEIGHT = 800;

/**
 * Dimensions for thumbnail image
 */
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

/**
 * JPEG compression quality (0-100)
 */
const JPEG_QUALITY = 85;

/**
 * Background color for contain operations (white)
 */
const BACKGROUND_COLOR = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * Processed images returned from the processor
 */
export interface ProcessedImages {
  resized: Buffer;
  thumbnail: Buffer;
}

/**
 * Processes an image by resizing and creating a thumbnail
 *
 * Operations performed:
 * 1. Resize to 800x800px (contain mode with white background)
 * 2. Generate thumbnail at 300x300px (contain mode with white background)
 * 3. Strip EXIF data for privacy (no metadata retained)
 * 4. Compress as JPEG with quality 85
 *
 * The contain mode ensures the entire image is visible without cropping,
 * letterboxing with white space if necessary to maintain aspect ratio.
 *
 * @param buffer - Raw image buffer to process
 * @returns Object containing both resized and thumbnail buffers
 * @throws Error if image processing fails
 *
 * @example
 * const { resized, thumbnail } = await processImage(imageBuffer);
 * // resized is 800x800px JPEG
 * // thumbnail is 300x300px JPEG
 */
export async function processImage(buffer: Buffer): Promise<ProcessedImages> {
  try {
    // Process resized image
    // - Resize to 800x800 with contain (keeps aspect ratio, adds white padding)
    // - Strip all EXIF metadata for privacy
    // - Convert to JPEG with quality 85
    const resizedBuffer = await sharp(buffer, { failOnError: true })
      .resize(RESIZED_WIDTH, RESIZED_HEIGHT, {
        fit: 'contain',
        background: BACKGROUND_COLOR,
      })
      .toFormat('jpeg', { mozjpeg: true, quality: JPEG_QUALITY }) // Converts to JPEG and strips metadata
      .toBuffer();

    // Process thumbnail image
    // - Resize to 300x300 with contain (keeps aspect ratio, adds white padding)
    // - Strip all EXIF metadata for privacy
    // - Convert to JPEG with quality 85
    const thumbnailBuffer = await sharp(buffer, { failOnError: true })
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'contain',
        background: BACKGROUND_COLOR,
      })
      .toFormat('jpeg', { mozjpeg: true, quality: JPEG_QUALITY }) // Converts to JPEG and strips metadata
      .toBuffer();

    return {
      resized: resizedBuffer,
      thumbnail: thumbnailBuffer,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Image processing failed: ${errorMessage}`);
  }
}
