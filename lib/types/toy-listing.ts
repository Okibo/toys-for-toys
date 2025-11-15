/**
 * Toy Listing Types Module
 * Defines types for toy listing creation, validation, and API responses
 *
 * Enums and types match the Supabase database schema:
 * - ToyCategory: blocks, vehicles, dolls, board_games, educational, sports, art, other
 * - ToyAgeGroup: 0-2, 3-5, 6-8, 9-11, 12-14, 15+
 * - ToyCondition: like_new, good, fair, well_loved
 */

/**
 * Toy category enum - matches PostgreSQL toy_category type
 */
export enum ToyCategory {
  BLOCKS = 'blocks',
  VEHICLES = 'vehicles',
  DOLLS = 'dolls',
  BOARD_GAMES = 'board_games',
  EDUCATIONAL = 'educational',
  SPORTS = 'sports',
  ART = 'art',
  OTHER = 'other'
}

/**
 * Toy age group enum - matches PostgreSQL toy_age_group type
 */
export enum ToyAgeGroup {
  AGES_0_2 = '0-2',
  AGES_3_5 = '3-5',
  AGES_6_8 = '6-8',
  AGES_9_11 = '9-11',
  AGES_12_14 = '12-14',
  AGES_15_PLUS = '15+'
}

/**
 * Toy condition enum - matches PostgreSQL toy_condition type
 */
export enum ToyCondition {
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  WELL_LOVED = 'well_loved'
}

/**
 * Create toy listing request payload
 * Sent as multipart/form-data from frontend
 */
export interface CreateToyRequest {
  category: ToyCategory | string;
  description: string;
  tags: string[];
  age_group: ToyAgeGroup | string;
  condition: ToyCondition | string;
  files?: File[];
}

/**
 * Ticket balance information returned in API response
 */
export interface TicketBalance {
  total: number;
  available: number;
  frozen_listing: number;
}

/**
 * Create toy listing response (HTTP 200)
 * Returned when toy listing is successfully created
 */
export interface CreateToyResponse {
  success: true;
  toy_id: string;
  message: string;
  ticket_balance: TicketBalance;
}

/**
 * Error response for toy listing creation
 * Returned when validation or processing fails
 */
export interface ToyListingErrorResponse {
  success: false;
  error: string;
  code: 'VALIDATION_ERROR' | 'INSUFFICIENT_TICKETS' | 'FILE_ERROR' | 'DATABASE_ERROR' | 'STORAGE_ERROR' | 'AUTHENTICATION_ERROR';
  details?: Record<string, string>;
}

/**
 * Validation error object
 * Contains field name and user-friendly error message
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result object
 * Contains validation status and error list
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Database toy record (after insertion)
 * Represents the toy_listing table row
 */
export interface ToyRecord {
  id: string;
  user_id: string;
  category: ToyCategory;
  description: string;
  tags: string[];
  age_group: ToyAgeGroup;
  condition: ToyCondition;
  postal_code: string;
  is_active: boolean;
  frozen_listing_tickets: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/**
 * User profile minimal data required for toy listing
 * Fetched from profiles table to get postal_code
 */
export interface UserProfile {
  user_id: string;
  postal_code: string;
}

/**
 * Uploaded image metadata
 * Returned after successful image upload to storage
 */
export interface UploadedImageMetadata {
  toyImageId: string;
  storagePath: string;
  thumbnailPath: string;
  publicUrl: string;
  imageOrder: number;
}

/**
 * Request token payload extracted from JWT
 * Used to identify authenticated user
 */
export interface RequestTokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  jti?: string;
}

/**
 * Analytics event for toy listing creation
 * Logged to search_analytics table
 */
export interface ToyListingAnalyticsEvent {
  toy_id: string;
  user_id: string;
  category: ToyCategory;
  tags: string[];
  postal_code: string;
  timestamp: string;
}
