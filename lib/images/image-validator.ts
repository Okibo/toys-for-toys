import sharp from 'sharp';

/**
 * Magic bytes for image file format validation
 */
const MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
} as const;

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Minimum image dimensions in pixels
 */
const MIN_DIMENSION = 100;

/**
 * Result of image validation with detailed error information
 */
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Checks if buffer starts with expected magic bytes
 */
function checkMagicBytes(buffer: Buffer): 'jpeg' | 'png' | null {
  if (buffer.length < 4) {
    return null;
  }

  // Check JPEG magic bytes (0xFF 0xD8 0xFF)
  if (
    buffer[0] === MAGIC_BYTES.jpeg[0] &&
    buffer[1] === MAGIC_BYTES.jpeg[1] &&
    buffer[2] === MAGIC_BYTES.jpeg[2]
  ) {
    return 'jpeg';
  }

  // Check PNG magic bytes (0x89 0x50 0x4E 0x47)
  if (
    buffer[0] === MAGIC_BYTES.png[0] &&
    buffer[1] === MAGIC_BYTES.png[1] &&
    buffer[2] === MAGIC_BYTES.png[2] &&
    buffer[3] === MAGIC_BYTES.png[3]
  ) {
    return 'png';
  }

  return null;
}

/**
 * Gets file extension from filename
 */
function getFileExtension(filename: string): string | null {
  const match = filename.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Validates extension matches expected format
 */
function validateFileExtension(filename: string, detectedFormat: 'jpeg' | 'png'): boolean {
  const extension = getFileExtension(filename);
  if (!extension) {
    return false;
  }

  if (detectedFormat === 'jpeg') {
    return extension === 'jpg' || extension === 'jpeg';
  }

  return extension === 'png';
}

/**
 * Validates an image file with comprehensive checks
 *
 * Performs the following validation steps:
 * 1. File size validation (max 5MB)
 * 2. Magic bytes verification (0xFF 0xD8 0xFF for JPEG, 0x89 0x50 0x4E 0x47 for PNG)
 * 3. File extension validation
 * 4. MIME type detection via sharp library
 * 5. Image dimensions validation (minimum 100x100px)
 *
 * @param buffer - Raw file buffer to validate
 * @param filename - Original filename for extension validation
 * @returns Validation result with detailed error messages
 *
 * @example
 * const result = await validateImageFile(fileBuffer, 'my-toy.jpg');
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * } else {
 *   console.log('Image dimensions:', result.metadata?.width, 'x', result.metadata?.height);
 * }
 */
export async function validateImageFile(
  buffer: Buffer,
  filename: string
): Promise<ImageValidationResult> {
  const errors: string[] = [];

  // Validate file size
  if (buffer.length === 0) {
    errors.push('File is empty');
    return { valid: false, errors };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed size of 5MB (current: ${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
    return { valid: false, errors };
  }

  // Validate magic bytes to ensure file is actually an image
  const detectedFormat = checkMagicBytes(buffer);
  if (!detectedFormat) {
    errors.push('File does not appear to be a valid JPEG or PNG image (invalid magic bytes)');
    return { valid: false, errors };
  }

  // Validate file extension matches detected format
  if (!validateFileExtension(filename, detectedFormat)) {
    errors.push(
      `File extension does not match detected format. Expected .${detectedFormat === 'jpeg' ? 'jpg or .jpeg' : 'png'} but got .${getFileExtension(filename)}`
    );
  }

  // Extract image metadata using sharp
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to read image metadata: ${errorMessage}`);
    return { valid: false, errors };
  }

  // Validate image format matches expected MIME type
  if (!metadata.format || !['jpeg', 'png'].includes(metadata.format)) {
    errors.push(
      `Image format is not supported. Detected format: ${metadata.format || 'unknown'}. Only JPEG and PNG are allowed.`
    );
  }

  // Validate image dimensions
  if (!metadata.width || !metadata.height) {
    errors.push('Unable to determine image dimensions');
    return { valid: false, errors };
  }

  if (metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION) {
    errors.push(
      `Image dimensions are too small. Minimum required: ${MIN_DIMENSION}x${MIN_DIMENSION}px, but got ${metadata.width}x${metadata.height}px`
    );
  }

  // If there are any validation errors, return invalid result
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // All validations passed
  return {
    valid: true,
    errors: [],
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || 'unknown',
      size: buffer.length,
    },
  };
}
