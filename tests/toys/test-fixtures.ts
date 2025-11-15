/**
 * Test Fixtures for Toy Listing Tests
 * Provides factory functions for creating test data and mock objects
 * Used across unit, integration, and E2E tests
 */

import { ToyCategory, ToyAgeGroup, ToyCondition, CreateToyRequest } from '../../lib/types/toy-listing';

/**
 * Create a valid toy listing request body
 * All required fields with valid values
 */
export function createValidToyListingData(): CreateToyRequest {
  return {
    category: ToyCategory.BLOCKS,
    description: 'This is a beautiful wooden toy building set with over 50 pieces. Great condition!',
    tags: ['wooden', 'educational', 'building'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.LIKE_NEW,
  };
}

/**
 * Create valid toy listing data with custom values
 */
export function createToyListingDataWithValues(overrides: Partial<CreateToyRequest>): CreateToyRequest {
  return {
    ...createValidToyListingData(),
    ...overrides,
  };
}

/**
 * Create an image buffer with specified dimensions and format
 * Returns a valid PNG or JPEG binary buffer
 */
export function createImageBuffer(width: number, height: number, format: 'png' | 'jpeg' = 'png'): Buffer {
  // Minimal PNG header for width x height transparent image
  if (format === 'png') {
    // PNG signature (8 bytes)
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk (25 bytes: 4 length + 4 type + 13 data + 4 CRC)
    const ihdr = Buffer.alloc(25);
    let offset = 0;
    ihdr.writeUInt32BE(13, offset); // chunk length = 13 bytes
    offset += 4;
    ihdr.write('IHDR', offset); // chunk type
    offset += 4;
    ihdr.writeUInt32BE(width, offset); // width (4 bytes)
    offset += 4;
    ihdr.writeUInt32BE(height, offset); // height (4 bytes)
    offset += 4;
    ihdr[offset++] = 8; // bit depth
    ihdr[offset++] = 6; // color type (RGBA)
    ihdr[offset++] = 0; // compression method
    ihdr[offset++] = 0; // filter method
    ihdr[offset++] = 0; // interlace method
    ihdr.writeUInt32BE(0x7F3F29D8, offset); // CRC (placeholder)

    // IDAT chunk (minimal, 16 bytes: 4 length + 4 type + 1 data + 4 CRC)
    const idat = Buffer.alloc(16);
    offset = 0;
    idat.writeUInt32BE(1, offset); // chunk length
    offset += 4;
    idat.write('IDAT', offset); // chunk type
    offset += 4;
    idat[offset++] = 0; // minimal image data
    idat.writeUInt32BE(0, offset); // CRC (placeholder)

    // IEND chunk (12 bytes: 4 length + 4 type + 4 CRC)
    const iend = Buffer.alloc(12);
    offset = 0;
    iend.writeUInt32BE(0, offset); // chunk length
    offset += 4;
    iend.write('IEND', offset); // chunk type
    offset += 4;
    iend.writeUInt32BE(0xAE426082, offset); // CRC

    return Buffer.concat([pngSignature, ihdr, idat, iend]);
  }

  // Minimal JPEG header for testing
  const jpegStart = Buffer.from([0xFF, 0xD8, 0xFF]); // SOI marker
  const app0 = Buffer.from([0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00]); // APP0 marker
  const dqt = Buffer.from([0xFF, 0xDB, 0x00, 0x43]); // DQT marker
  const sof = Buffer.from([0xFF, 0xC0]); // SOF marker
  const jpegEnd = Buffer.from([0xFF, 0xD9]); // EOI marker

  const padding = Buffer.alloc(100);
  return Buffer.concat([jpegStart, app0, dqt, sof, padding, jpegEnd]);
}

/**
 * Create a valid JPEG image buffer
 * Standard dimensions: 800x600
 */
export function validJpgBuffer(): Buffer {
  return createImageBuffer(800, 600, 'jpeg');
}

/**
 * Create a valid PNG image buffer
 * Standard dimensions: 800x600
 */
export function validPngBuffer(): Buffer {
  return createImageBuffer(800, 600, 'png');
}

/**
 * Create a small valid image buffer (thumbnail size)
 * Used for testing minimum dimension requirements
 */
export function smallImageBuffer(): Buffer {
  return createImageBuffer(150, 150, 'png');
}

/**
 * Create an image buffer that's too small
 * Used for testing minimum size validation
 */
export function tooSmallImageBuffer(): Buffer {
  return createImageBuffer(50, 50, 'png');
}

/**
 * Create a corrupted image buffer
 * Invalid JPEG header without proper end marker
 */
export function createInvalidImageBuffer(): Buffer {
  const corrupted = Buffer.from([
    0xFF, 0xD8, 0xFF, // JPEG start
    0x00, 0x00, 0x00, // Invalid bytes
    0x12, 0x34, 0x56, 0x78, // Random data
  ]);
  return corrupted;
}

/**
 * Create an image buffer larger than 5MB
 * Used for testing file size validation
 */
export function oversizeImageBuffer(): Buffer {
  const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024); // 5MB + 1KB

  // Add JPEG header and footer so it's recognized as JPEG
  largeBuffer[0] = 0xFF;
  largeBuffer[1] = 0xD8;
  largeBuffer[2] = 0xFF;
  largeBuffer[largeBuffer.length - 2] = 0xFF;
  largeBuffer[largeBuffer.length - 1] = 0xD9;

  return largeBuffer;
}

/**
 * Create an empty image buffer (0 bytes)
 * Used for testing empty file validation
 */
export function emptyImageBuffer(): Buffer {
  return Buffer.alloc(0);
}

/**
 * Create multiple image buffers
 * Useful for testing image array validation
 */
export function createMultipleImages(count: number, format: 'png' | 'jpeg' = 'png'): Buffer[] {
  const images: Buffer[] = [];
  for (let i = 0; i < count; i++) {
    images.push(createImageBuffer(800, 600, format));
  }
  return images;
}

/**
 * Create a File-like object for testing (browser File doesn't exist in Node.js)
 * Mimics the File interface for multipart form data tests
 */
export function createMockFile(
  content: Buffer | string,
  filename: string,
  mimeType: string
): File {
  const buffer = typeof content === 'string' ? Buffer.from(content) : content;
  const blob = new Blob([buffer], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Create mock image files with valid content
 */
export function createValidImageFile(index: number = 0): File {
  const buffer = validPngBuffer();
  return createMockFile(buffer, `toy-image-${index}.png`, 'image/png');
}

/**
 * Create mock image files array (for multiple images)
 */
export function createValidImageFiles(count: number = 3): File[] {
  const files: File[] = [];
  for (let i = 0; i < count; i++) {
    files.push(createValidImageFile(i));
  }
  return files;
}

/**
 * Create an invalid image file (wrong MIME type)
 */
export function createInvalidMimeTypeFile(): File {
  const buffer = Buffer.from('This is not an image');
  return createMockFile(buffer, 'not-image.txt', 'text/plain');
}

/**
 * Create an oversized image file
 */
export function createOversizedImageFile(): File {
  const buffer = oversizeImageBuffer();
  return createMockFile(buffer, 'huge-image.jpg', 'image/jpeg');
}

/**
 * Create an empty image file
 */
export function createEmptyImageFile(): File {
  return createMockFile(Buffer.alloc(0), 'empty.png', 'image/png');
}

/**
 * Create a corrupted image file
 */
export function createCorruptedImageFile(): File {
  const buffer = createInvalidImageBuffer();
  return createMockFile(buffer, 'corrupted.jpg', 'image/jpeg');
}

/**
 * Test data for valid toy listings with different categories
 */
export const VALID_TOY_LISTINGS = {
  blocks: {
    category: ToyCategory.BLOCKS,
    description: 'Wooden building blocks set with 100 pieces',
    tags: ['wooden', 'educational'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.LIKE_NEW,
  },
  vehicles: {
    category: ToyCategory.VEHICLES,
    description: 'Die-cast car collection with 20 vehicles',
    tags: ['cars', 'collectible'],
    age_group: ToyAgeGroup.AGES_6_8,
    condition: ToyCondition.GOOD,
  },
  boardGames: {
    category: ToyCategory.BOARD_GAMES,
    description: 'Classic family board game in excellent condition',
    tags: ['family', 'fun'],
    age_group: ToyAgeGroup.AGES_9_11,
    condition: ToyCondition.GOOD,
  },
  educational: {
    category: ToyCategory.EDUCATIONAL,
    description: 'STEM learning kit with experiments and materials',
    tags: ['science', 'learning'],
    age_group: ToyAgeGroup.AGES_12_14,
    condition: ToyCondition.LIKE_NEW,
  },
};

/**
 * Invalid toy listing test cases
 */
export const INVALID_TOY_LISTINGS = {
  noCategory: {
    description: 'A toy without category',
    tags: ['toy'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  invalidCategory: {
    category: 'invalid_category',
    description: 'A toy with invalid category',
    tags: ['toy'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  missingDescription: {
    category: ToyCategory.BLOCKS,
    tags: ['toy'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  emptyDescription: {
    category: ToyCategory.BLOCKS,
    description: '',
    tags: ['toy'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  tooLongDescription: {
    category: ToyCategory.BLOCKS,
    description: 'A'.repeat(501),
    tags: ['toy'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  noTags: {
    category: ToyCategory.BLOCKS,
    description: 'A toy without tags',
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  emptyTags: {
    category: ToyCategory.BLOCKS,
    description: 'A toy with empty tags array',
    tags: [],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  tooManyTags: {
    category: ToyCategory.BLOCKS,
    description: 'A toy with too many tags',
    tags: ['tag1', 'tag2', 'tag3', 'tag4'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  emptyTag: {
    category: ToyCategory.BLOCKS,
    description: 'A toy with an empty tag',
    tags: ['', 'valid'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: ToyCondition.GOOD,
  },
  invalidAgeGroup: {
    category: ToyCategory.BLOCKS,
    description: 'A toy with invalid age group',
    tags: ['toy'],
    age_group: 'invalid-age',
    condition: ToyCondition.GOOD,
  },
  invalidCondition: {
    category: ToyCategory.BLOCKS,
    description: 'A toy with invalid condition',
    tags: ['toy'],
    age_group: ToyAgeGroup.AGES_3_5,
    condition: 'broken',
  },
};
