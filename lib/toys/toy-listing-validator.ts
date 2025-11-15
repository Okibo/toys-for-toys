/**
 * Toy Listing Validator Module
 * Validates toy listing requests and image files
 *
 * Features:
 * - Category enum validation
 * - Description length validation (1-500 chars)
 * - Tags validation (1-3 items, non-empty strings)
 * - Age group enum validation
 * - Condition enum validation
 * - Image file validation (count, size, format)
 * - MIME type verification
 */

import {
  ToyCategory,
  ToyAgeGroup,
  ToyCondition,
  ValidationError,
  ValidationResult
} from '../types/toy-listing';

/**
 * Allowed MIME types for image files
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

/**
 * Maximum file size in bytes (5 MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Minimum image files required
 */
const MIN_IMAGES = 1;

/**
 * Maximum image files allowed
 */
const MAX_IMAGES = 5;

/**
 * All valid toy categories
 */
const VALID_CATEGORIES = Object.values(ToyCategory);

/**
 * All valid age groups
 */
const VALID_AGE_GROUPS = Object.values(ToyAgeGroup);

/**
 * All valid conditions
 */
const VALID_CONDITIONS = Object.values(ToyCondition);

/**
 * Validate toy listing request body
 *
 * Checks:
 * - Category is valid enum value
 * - Description is 1-500 characters
 * - Tags are 1-3 non-empty strings
 * - Age group is valid enum value
 * - Condition is valid enum value
 *
 * @param body - Request body object
 * @returns Validation result with any errors
 */
export function validateToyListingRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate category
  if (!body?.category) {
    errors.push({
      field: 'category',
      message: 'Category is required'
    });
  } else if (!VALID_CATEGORIES.includes(body.category)) {
    errors.push({
      field: 'category',
      message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
    });
  }

  // Validate description
  if (!body?.description) {
    errors.push({
      field: 'description',
      message: 'Description is required'
    });
  } else {
    const descriptionLength = String(body.description).trim().length;
    if (descriptionLength < 1) {
      errors.push({
        field: 'description',
        message: 'Description cannot be empty'
      });
    } else if (descriptionLength > 500) {
      errors.push({
        field: 'description',
        message: `Description must be 500 characters or less (current: ${descriptionLength})`
      });
    }
  }

  // Validate tags
  if (!body?.tags) {
    errors.push({
      field: 'tags',
      message: 'Tags are required'
    });
  } else if (!Array.isArray(body.tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array'
    });
  } else {
    if (body.tags.length < 1) {
      errors.push({
        field: 'tags',
        message: 'At least 1 tag is required'
      });
    } else if (body.tags.length > 3) {
      errors.push({
        field: 'tags',
        message: `Maximum 3 tags allowed (provided: ${body.tags.length})`
      });
    }

    // Validate individual tags
    body.tags.forEach((tag: any, index: number) => {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        errors.push({
          field: `tags[${index}]`,
          message: 'Tag must be a non-empty string'
        });
      }
    });
  }

  // Validate age group
  if (!body?.age_group) {
    errors.push({
      field: 'age_group',
      message: 'Age group is required'
    });
  } else if (!VALID_AGE_GROUPS.includes(body.age_group)) {
    errors.push({
      field: 'age_group',
      message: `Invalid age group. Must be one of: ${VALID_AGE_GROUPS.join(', ')}`
    });
  }

  // Validate condition
  if (!body?.condition) {
    errors.push({
      field: 'condition',
      message: 'Condition is required'
    });
  } else if (!VALID_CONDITIONS.includes(body.condition)) {
    errors.push({
      field: 'condition',
      message: `Invalid condition. Must be one of: ${VALID_CONDITIONS.join(', ')}`
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate image files for toy listing
 *
 * Checks:
 * - Between 1-5 files provided
 * - All files are JPG or PNG
 * - All files are under 5 MB
 * - Files array is not empty
 *
 * @param files - Array of File objects from multipart form data
 * @returns Validation result with any errors
 */
export function validateImages(files: File[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Check files array exists and is an array
  if (!files || !Array.isArray(files)) {
    errors.push({
      field: 'files',
      message: 'Files must be provided as an array'
    });
    return { valid: false, errors };
  }

  // Check minimum files
  if (files.length < MIN_IMAGES) {
    errors.push({
      field: 'files',
      message: `At least ${MIN_IMAGES} image file is required`
    });
  }

  // Check maximum files
  if (files.length > MAX_IMAGES) {
    errors.push({
      field: 'files',
      message: `Maximum ${MAX_IMAGES} image files allowed (provided: ${files.length})`
    });
  }

  // Validate individual files
  files.forEach((file, index) => {
    const fileFieldName = `files[${index}]`;

    // Check if file is actually a File object
    if (!file || !(file instanceof File)) {
      errors.push({
        field: fileFieldName,
        message: 'Invalid file object'
      });
      return;
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push({
        field: fileFieldName,
        message: `Invalid file type. Only JPG and PNG allowed (received: ${file.type || 'unknown'})`
      });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxMB = MAX_FILE_SIZE / (1024 * 1024);
      errors.push({
        field: fileFieldName,
        message: `File too large: ${sizeMB}MB (max: ${maxMB}MB)`
      });
    }

    // Check file size is not zero
    if (file.size === 0) {
      errors.push({
        field: fileFieldName,
        message: 'File is empty'
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate category enum value
 *
 * @param category - Category string to validate
 * @returns True if valid
 */
export function isValidCategory(category: string): category is ToyCategory {
  return VALID_CATEGORIES.includes(category as ToyCategory);
}

/**
 * Validate age group enum value
 *
 * @param ageGroup - Age group string to validate
 * @returns True if valid
 */
export function isValidAgeGroup(ageGroup: string): ageGroup is ToyAgeGroup {
  return VALID_AGE_GROUPS.includes(ageGroup as ToyAgeGroup);
}

/**
 * Validate condition enum value
 *
 * @param condition - Condition string to validate
 * @returns True if valid
 */
export function isValidCondition(condition: string): condition is ToyCondition {
  return VALID_CONDITIONS.includes(condition as ToyCondition);
}

/**
 * Get human-readable file type error message
 *
 * @param mimeType - MIME type received
 * @returns User-friendly error message
 */
export function getFileTypeErrorMessage(mimeType: string | null): string {
  if (!mimeType) {
    return 'File type could not be determined. Please use JPG or PNG.';
  }
  return `File type not supported: ${mimeType}. Only JPG and PNG are allowed.`;
}

/**
 * Get human-readable file size error message
 *
 * @param fileSizeBytes - File size in bytes
 * @returns User-friendly error message
 */
export function getFileSizeErrorMessage(fileSizeBytes: number): string {
  const sizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
  const maxMB = MAX_FILE_SIZE / (1024 * 1024);
  return `File size is ${sizeMB}MB but maximum allowed is ${maxMB}MB`;
}

/**
 * Get formatted error list for API response
 * Converts ValidationError array to key-value object
 *
 * @param errors - Array of ValidationError objects
 * @returns Record mapping field names to error messages
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  const formatted: Record<string, string> = {};

  errors.forEach(error => {
    // For array fields like tags[0], just use the field name
    if (error.field in formatted) {
      // If field already exists, append to message
      formatted[error.field] = `${formatted[error.field]}; ${error.message}`;
    } else {
      formatted[error.field] = error.message;
    }
  });

  return formatted;
}
