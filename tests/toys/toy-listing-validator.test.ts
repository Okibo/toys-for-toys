/**
 * Toy Listing Validator Tests
 * Comprehensive test suite for toy listing validation functions
 * Tests validation of toy details, images, and form inputs
 */

import {
  validateToyListingRequest,
  validateImages,
  isValidCategory,
  isValidAgeGroup,
  isValidCondition,
  getFileTypeErrorMessage,
  getFileSizeErrorMessage,
  formatValidationErrors,
} from '../../lib/toys/toy-listing-validator';

import {
  ToyCategory,
  ToyAgeGroup,
  ToyCondition,
} from '../../lib/types/toy-listing';

import {
  createValidToyListingData,
  createToyListingDataWithValues,
  validPngBuffer,
  validJpgBuffer,
  oversizeImageBuffer,
  emptyImageBuffer,
  createInvalidImageBuffer,
  createValidImageFile,
  createValidImageFiles,
  createOversizedImageFile,
  createEmptyImageFile,
  createInvalidMimeTypeFile,
  INVALID_TOY_LISTINGS,
} from './test-fixtures';

describe('Toy Listing Validator', () => {
  describe('validateToyListingRequest() - Category Validation', () => {
    it('should reject missing category', () => {
      const data = createToyListingDataWithValues({ category: undefined as any });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'category')).toBe(true);
    });

    it('should reject null category', () => {
      const data = createToyListingDataWithValues({ category: null as any });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'category')).toBe(true);
    });

    it('should reject invalid category', () => {
      const data = createToyListingDataWithValues({ category: 'invalid_category' });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'category')).toBe(true);
      expect(result.errors[0].message).toContain('Invalid category');
    });

    it('should accept all valid categories', () => {
      Object.values(ToyCategory).forEach(category => {
        const data = createToyListingDataWithValues({ category });
        const result = validateToyListingRequest(data);

        // Category error should not exist
        const categoryError = result.errors.find(e => e.field === 'category');
        expect(categoryError).toBeUndefined();
      });
    });

    it('should include valid categories in error message', () => {
      const data = createToyListingDataWithValues({ category: 'invalid' });
      const result = validateToyListingRequest(data);

      const categoryError = result.errors.find(e => e.field === 'category');
      expect(categoryError?.message).toContain('blocks');
      expect(categoryError?.message).toContain('vehicles');
    });
  });

  describe('validateToyListingRequest() - Description Validation', () => {
    it('should reject missing description', () => {
      const data = createToyListingDataWithValues({ description: undefined as any });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('should reject empty description', () => {
      const data = createToyListingDataWithValues({ description: '' });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('should reject description with only whitespace', () => {
      const data = createToyListingDataWithValues({ description: '   ' });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('should accept description with exactly 1 character', () => {
      const data = createToyListingDataWithValues({ description: 'A' });
      const result = validateToyListingRequest(data);

      const descError = result.errors.find(e => e.field === 'description');
      expect(descError).toBeUndefined();
    });

    it('should reject description exceeding 500 characters', () => {
      const longDesc = 'A'.repeat(501);
      const data = createToyListingDataWithValues({ description: longDesc });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      const descError = result.errors.find(e => e.field === 'description');
      expect(descError?.message).toContain('500 characters');
    });

    it('should accept description with exactly 500 characters', () => {
      const desc = 'A'.repeat(500);
      const data = createToyListingDataWithValues({ description: desc });
      const result = validateToyListingRequest(data);

      const descError = result.errors.find(e => e.field === 'description');
      expect(descError).toBeUndefined();
    });

    it('should include character count in error message for oversized', () => {
      const longDesc = 'A'.repeat(550);
      const data = createToyListingDataWithValues({ description: longDesc });
      const result = validateToyListingRequest(data);

      const descError = result.errors.find(e => e.field === 'description');
      expect(descError?.message).toContain('550');
    });

    it('should trim description for validation', () => {
      const data = createToyListingDataWithValues({ description: '  valid description  ' });
      const result = validateToyListingRequest(data);

      const descError = result.errors.find(e => e.field === 'description');
      expect(descError).toBeUndefined();
    });
  });

  describe('validateToyListingRequest() - Tags Validation', () => {
    it('should reject missing tags', () => {
      const data = createToyListingDataWithValues({ tags: undefined as any });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tags')).toBe(true);
    });

    it('should reject tags that are not an array', () => {
      const data = createToyListingDataWithValues({ tags: 'not-array' as any });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tags')).toBe(true);
    });

    it('should reject empty tags array', () => {
      const data = createToyListingDataWithValues({ tags: [] });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tags')).toBe(true);
      expect(result.errors.find(e => e.field === 'tags')?.message).toContain('At least 1 tag');
    });

    it('should accept exactly 1 tag', () => {
      const data = createToyListingDataWithValues({ tags: ['single'] });
      const result = validateToyListingRequest(data);

      const tagErrors = result.errors.filter(e => e.field === 'tags' || e.field.startsWith('tags['));
      expect(tagErrors.length).toBe(0);
    });

    it('should accept exactly 3 tags', () => {
      const data = createToyListingDataWithValues({ tags: ['tag1', 'tag2', 'tag3'] });
      const result = validateToyListingRequest(data);

      const tagErrors = result.errors.filter(e => e.field === 'tags' || e.field.startsWith('tags['));
      expect(tagErrors.length).toBe(0);
    });

    it('should reject more than 3 tags', () => {
      const data = createToyListingDataWithValues({ tags: ['tag1', 'tag2', 'tag3', 'tag4'] });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      const error = result.errors.find(e => e.field === 'tags');
      expect(error?.message).toContain('Maximum 3 tags');
      expect(error?.message).toContain('4');
    });

    it('should reject empty string tags', () => {
      const data = createToyListingDataWithValues({ tags: ['valid', '', 'also valid'] });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tags[1]')).toBe(true);
    });

    it('should reject whitespace-only tags', () => {
      const data = createToyListingDataWithValues({ tags: ['valid', '   ', 'also valid'] });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tags[1]')).toBe(true);
    });

    it('should reject non-string tags', () => {
      const data = createToyListingDataWithValues({ tags: ['valid', 123 as any, 'also valid'] });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tags[1]')).toBe(true);
    });

    it('should report multiple invalid tags correctly', () => {
      const data = createToyListingDataWithValues({ tags: ['', '', 'valid'] });
      const result = validateToyListingRequest(data);

      const invalidTags = result.errors.filter(e => e.field.startsWith('tags['));
      expect(invalidTags.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validateToyListingRequest() - Age Group Validation', () => {
    it('should reject missing age group', () => {
      const data = createToyListingDataWithValues({ age_group: undefined as any });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'age_group')).toBe(true);
    });

    it('should reject invalid age group', () => {
      const data = createToyListingDataWithValues({ age_group: 'invalid-age' });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'age_group')).toBe(true);
    });

    it('should accept all valid age groups', () => {
      Object.values(ToyAgeGroup).forEach(ageGroup => {
        const data = createToyListingDataWithValues({ age_group: ageGroup });
        const result = validateToyListingRequest(data);

        const ageError = result.errors.find(e => e.field === 'age_group');
        expect(ageError).toBeUndefined();
      });
    });
  });

  describe('validateToyListingRequest() - Condition Validation', () => {
    it('should reject missing condition', () => {
      const data = createToyListingDataWithValues({ condition: undefined as any });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'condition')).toBe(true);
    });

    it('should reject invalid condition', () => {
      const data = createToyListingDataWithValues({ condition: 'destroyed' });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'condition')).toBe(true);
    });

    it('should accept all valid conditions', () => {
      Object.values(ToyCondition).forEach(condition => {
        const data = createToyListingDataWithValues({ condition });
        const result = validateToyListingRequest(data);

        const condError = result.errors.find(e => e.field === 'condition');
        expect(condError).toBeUndefined();
      });
    });
  });

  describe('validateToyListingRequest() - Combined Validation', () => {
    it('should accept completely valid request', () => {
      const data = createValidToyListingData();
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accumulate multiple validation errors', () => {
      const data = createToyListingDataWithValues({
        category: 'invalid',
        description: '',
        tags: [],
      });
      const result = validateToyListingRequest(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle null body gracefully', () => {
      const result = validateToyListingRequest(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined body gracefully', () => {
      const result = validateToyListingRequest(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateImages() - File Count Validation', () => {
    it('should reject missing files array', () => {
      const result = validateImages(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'files')).toBe(true);
    });

    it('should reject non-array files parameter', () => {
      const result = validateImages('not-array' as any);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'files')).toBe(true);
    });

    it('should reject empty files array', () => {
      const result = validateImages([]);

      expect(result.valid).toBe(false);
      const filesError = result.errors.find(e => e.field === 'files');
      expect(filesError?.message).toContain('At least');
    });

    it('should accept exactly 1 file', () => {
      const files = createValidImageFiles(1);
      const result = validateImages(files);

      const filesErrors = result.errors.filter(e => e.field === 'files');
      expect(filesErrors.length).toBe(0);
    });

    it('should accept exactly 5 files', () => {
      const files = createValidImageFiles(5);
      const result = validateImages(files);

      const filesErrors = result.errors.filter(e => e.field === 'files');
      expect(filesErrors.length).toBe(0);
    });

    it('should reject more than 5 files', () => {
      const files = createValidImageFiles(6);
      const result = validateImages(files);

      expect(result.valid).toBe(false);
      const filesError = result.errors.find(e => e.field === 'files' && e.message.includes('Maximum'));
      expect(filesError?.message).toContain('Maximum 5');
    });
  });

  describe('validateImages() - MIME Type Validation', () => {
    it('should accept PNG files', () => {
      const file = createValidImageFile(0);
      const result = validateImages([file]);

      const mimeErrors = result.errors.filter(e => e.field === 'files[0]' && e.message.includes('type'));
      expect(mimeErrors.length).toBe(0);
    });

    it('should accept JPEG files', () => {
      const file = createValidImageFile(0);
      // Override MIME type to JPEG
      const jpegFile = new File([file], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImages([jpegFile]);

      const mimeErrors = result.errors.filter(e => e.field === 'files[0]' && e.message.includes('type'));
      expect(mimeErrors.length).toBe(0);
    });

    it('should reject non-image MIME types', () => {
      const file = createInvalidMimeTypeFile();
      const result = validateImages([file]);

      expect(result.valid).toBe(false);
      const mimeError = result.errors.find(e => e.field === 'files[0]' && e.message.includes('type'));
      expect(mimeError).toBeDefined();
    });

    it('should reject unsupported image formats (BMP)', () => {
      const bmpFile = new File(['BM'], 'test.bmp', { type: 'image/bmp' });
      const result = validateImages([bmpFile]);

      expect(result.valid).toBe(false);
      expect(result.errors.find(e => e.field === 'files[0]')).toBeDefined();
    });

    it('should reject unsupported image formats (WebP)', () => {
      const webpFile = new File(['WEBP'], 'test.webp', { type: 'image/webp' });
      const result = validateImages([webpFile]);

      expect(result.valid).toBe(false);
      expect(result.errors.find(e => e.field === 'files[0]')).toBeDefined();
    });

    it('should reject unsupported image formats (GIF)', () => {
      const gifFile = new File(['GIF89a'], 'test.gif', { type: 'image/gif' });
      const result = validateImages([gifFile]);

      expect(result.valid).toBe(false);
      expect(result.errors.find(e => e.field === 'files[0]')).toBeDefined();
    });

    it('should include received MIME type in error message', () => {
      const file = createInvalidMimeTypeFile();
      const result = validateImages([file]);

      const mimeError = result.errors.find(e => e.field === 'files[0]');
      expect(mimeError?.message).toContain('text/plain');
    });
  });

  describe('validateImages() - File Size Validation', () => {
    it('should accept files under 5MB', () => {
      const files = createValidImageFiles(1);
      const result = validateImages(files);

      const sizeErrors = result.errors.filter(e => e.field === 'files[0]' && e.message.includes('large'));
      expect(sizeErrors.length).toBe(0);
    });

    it('should reject files over 5MB', () => {
      const oversizedFile = createOversizedImageFile();
      const result = validateImages([oversizedFile]);

      expect(result.valid).toBe(false);
      const sizeError = result.errors.find(e => e.field === 'files[0]' && e.message.includes('large'));
      expect(sizeError).toBeDefined();
    });

    it('should include file size in error message', () => {
      const oversizedFile = createOversizedImageFile();
      const result = validateImages([oversizedFile]);

      const sizeError = result.errors.find(e => e.field === 'files[0]');
      expect(sizeError?.message).toContain('MB');
    });
  });

  describe('validateImages() - Empty Files Validation', () => {
    it('should reject empty files', () => {
      const emptyFile = createEmptyImageFile();
      const result = validateImages([emptyFile]);

      expect(result.valid).toBe(false);
      const emptyError = result.errors.find(e => e.field === 'files[0]' && e.message.includes('empty'));
      expect(emptyError).toBeDefined();
    });

    it('should accept non-empty files', () => {
      const files = createValidImageFiles(1);
      const result = validateImages(files);

      const emptyErrors = result.errors.filter(e => e.message.includes('empty'));
      expect(emptyErrors.length).toBe(0);
    });
  });

  describe('validateImages() - Invalid File Objects', () => {
    it('should reject null file in array', () => {
      const files = [null as any];
      const result = validateImages(files);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'files[0]')).toBe(true);
    });

    it('should reject non-File objects', () => {
      const notFile = { name: 'test.jpg', size: 100 } as any;
      const result = validateImages([notFile]);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'files[0]')).toBe(true);
    });
  });

  describe('Helper Functions - Enum Validators', () => {
    it('should validate category enum', () => {
      expect(isValidCategory(ToyCategory.BLOCKS)).toBe(true);
      expect(isValidCategory('blocks')).toBe(true);
      expect(isValidCategory('invalid')).toBe(false);
    });

    it('should validate age group enum', () => {
      expect(isValidAgeGroup(ToyAgeGroup.AGES_3_5)).toBe(true);
      expect(isValidAgeGroup('3-5')).toBe(true);
      expect(isValidAgeGroup('invalid')).toBe(false);
    });

    it('should validate condition enum', () => {
      expect(isValidCondition(ToyCondition.LIKE_NEW)).toBe(true);
      expect(isValidCondition('like_new')).toBe(true);
      expect(isValidCondition('invalid')).toBe(false);
    });

    it('should validate all category enum values', () => {
      Object.values(ToyCategory).forEach(cat => {
        expect(isValidCategory(cat)).toBe(true);
      });
    });

    it('should validate all age group enum values', () => {
      Object.values(ToyAgeGroup).forEach(age => {
        expect(isValidAgeGroup(age)).toBe(true);
      });
    });

    it('should validate all condition enum values', () => {
      Object.values(ToyCondition).forEach(cond => {
        expect(isValidCondition(cond)).toBe(true);
      });
    });
  });

  describe('Helper Functions - Error Messages', () => {
    it('should format file type error message with known MIME type', () => {
      const message = getFileTypeErrorMessage('image/gif');

      expect(message).toContain('image/gif');
      expect(message).toContain('JPG');
      expect(message).toContain('PNG');
    });

    it('should format file type error message for unknown MIME type', () => {
      const message = getFileTypeErrorMessage(null);

      expect(message).toContain('could not be determined');
      expect(message).toContain('JPG');
      expect(message).toContain('PNG');
    });

    it('should format file size error message', () => {
      const fileSizeBytes = 6 * 1024 * 1024; // 6MB
      const message = getFileSizeErrorMessage(fileSizeBytes);

      expect(message).toContain('6.00');
      expect(message).toContain('5');
    });

    it('should round file sizes to 2 decimal places', () => {
      const fileSizeBytes = 1234567; // ~1.18 MB
      const message = getFileSizeErrorMessage(fileSizeBytes);

      expect(message).toMatch(/\d+\.\d{2}/);
    });
  });

  describe('Helper Functions - formatValidationErrors()', () => {
    it('should convert validation errors to object', () => {
      const errors = [
        { field: 'category', message: 'Invalid category' },
        { field: 'description', message: 'Too long' },
      ];
      const result = formatValidationErrors(errors);

      expect(result.category).toBe('Invalid category');
      expect(result.description).toBe('Too long');
    });

    it('should handle empty errors array', () => {
      const result = formatValidationErrors([]);

      expect(result).toEqual({});
    });

    it('should concatenate multiple errors for same field', () => {
      const errors = [
        { field: 'tags', message: 'Error 1' },
        { field: 'tags', message: 'Error 2' },
      ];
      const result = formatValidationErrors(errors);

      expect(result.tags).toContain('Error 1');
      expect(result.tags).toContain('Error 2');
    });

    it('should preserve field names including array indices', () => {
      const errors = [
        { field: 'tags[0]', message: 'Invalid tag' },
        { field: 'files[1]', message: 'Invalid file' },
      ];
      const result = formatValidationErrors(errors);

      expect(result['tags[0]']).toBeDefined();
      expect(result['files[1]']).toBeDefined();
    });
  });

  describe('Edge Cases and Special Scenarios', () => {
    it('should handle very long tag values', () => {
      const longTag = 'A'.repeat(1000);
      const data = createToyListingDataWithValues({ tags: [longTag] });
      const result = validateToyListingRequest(data);

      // Should not fail on long tag string itself
      const tagErrors = result.errors.filter(e => e.field.startsWith('tags'));
      expect(tagErrors.length).toBe(0);
    });

    it('should handle special characters in description', () => {
      const special = 'Description with émojis 😀 and spëcial chars!';
      const data = createToyListingDataWithValues({ description: special });
      const result = validateToyListingRequest(data);

      const descError = result.errors.find(e => e.field === 'description');
      expect(descError).toBeUndefined();
    });

    it('should handle numeric strings in fields', () => {
      const data = createToyListingDataWithValues({
        description: '12345',
        tags: ['1', '2', '3'],
      });
      const result = validateToyListingRequest(data);

      const errors = result.errors.filter(e =>
        e.field === 'description' || e.field === 'tags'
      );
      expect(errors.length).toBe(0);
    });

    it('should validate multiple images simultaneously', () => {
      const files = createValidImageFiles(3);
      const result = validateImages(files);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should report all image errors together', () => {
      const invalidFile = createInvalidMimeTypeFile();
      const oversizedFile = createOversizedImageFile();
      const result = validateImages([invalidFile, oversizedFile]);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration Tests - Full Validation Scenarios', () => {
    it('should validate complete valid toy listing with images', () => {
      const listing = createValidToyListingData();
      const files = createValidImageFiles(2);

      const listingResult = validateToyListingRequest(listing);
      const imagesResult = validateImages(files);

      expect(listingResult.valid).toBe(true);
      expect(imagesResult.valid).toBe(true);
    });

    it('should handle all invalid scenarios from fixture', () => {
      Object.entries(INVALID_TOY_LISTINGS).forEach(([key, data]) => {
        const result = validateToyListingRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should validate consistent results for same input', () => {
      const data = createValidToyListingData();
      const result1 = validateToyListingRequest(data);
      const result2 = validateToyListingRequest(data);

      expect(result1.valid).toBe(result2.valid);
      expect(result1.errors).toEqual(result2.errors);
    });
  });
});
