/**
 * POST /api/toys/create
 *
 * Toy Listing Creation API Endpoint
 * Allows authenticated users to list toys for exchange using tickets
 *
 * Request Format: multipart/form-data
 * - Fields: category, description, tags (JSON array), age_group, condition
 * - Files: 1-5 JPG/PNG image files (max 5MB each)
 *
 * Authentication: JWT token in __auth_access cookie
 *
 * Workflow:
 * 1. Validate JWT token from cookie
 * 2. Extract user_id from token payload
 * 3. Validate form fields (category, description, tags, age_group, condition)
 * 4. Validate image files (count, size, format)
 * 5. Fetch user profile to get postal_code
 * 6. Check user has sufficient ticket balance (total - frozen_listing - frozen_exchange >= 1)
 * 7. Create toy record in database
 * 8. Upload images to storage and create toy_images records
 * 9. Decrement user's frozen_listing ticket balance
 * 10. Log analytics event
 * 11. Return toy_id and updated ticket balance
 *
 * Error Codes:
 * - 400: Validation error (invalid fields, file issues)
 * - 401: Unauthorized (missing/invalid token)
 * - 402: Insufficient tickets
 * - 413: File too large
 * - 500: Server error (database, storage)
 */

import { NextResponse, NextRequest } from 'next/server';
import { getCookieFromRequest } from '@/lib/auth/cookie-handler';
import { validateAccessToken } from '@/lib/auth/token-validator';
import { getSupabaseServerClient } from '@/lib/auth/supabase-server';
import { processImage } from '@/lib/images/image-processor';
import { uploadImage } from '@/lib/images/storage-uploader';
import {
  validateToyListingRequest,
  validateImages,
  formatValidationErrors
} from '@/lib/toys/toy-listing-validator';
import {
  CreateToyResponse,
  ToyListingErrorResponse,
  ToyCategory,
  ToyAgeGroup,
  ToyCondition,
  RequestTokenPayload,
  UserProfile,
  UploadedImageMetadata
} from '@/lib/types/toy-listing';

/**
 * Extracts token from request cookies
 */
function getTokenFromRequest(req: NextRequest): string | null {
  return getCookieFromRequest(req, '__auth_access');
}

/**
 * Validates JWT token and returns payload
 */
function validateToken(token: string | null): { valid: boolean; payload?: RequestTokenPayload; error?: string } {
  if (!token) {
    return {
      valid: false,
      error: 'Authentication token is missing. Please log in.'
    };
  }

  const validation = validateAccessToken(token);
  if (!validation.isValid) {
    return {
      valid: false,
      error: validation.errors[0] || 'Invalid authentication token'
    };
  }

  return {
    valid: true,
    payload: validation.payload as RequestTokenPayload
  };
}

/**
 * Fetches user profile from database
 */
async function getUserProfile(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('profiles')
      .select('user_id, postal_code')
      .eq('user_id', userId)
      .single() as any);

    if (error) {
      return {
        success: false,
        error: `Failed to fetch user profile: ${error.message}`
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'User profile not found. Please complete your profile setup.'
      };
    }

    return {
      success: true,
      profile: {
        user_id: data.user_id as string,
        postal_code: data.postal_code as string
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Database error: ${errorMessage}`
    };
  }
}

/**
 * Fetches user ticket balance and validates sufficiency
 */
async function checkTicketBalance(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string
): Promise<{ sufficient: boolean; balance?: { total: number; available: number; frozen_listing: number }; error?: string }> {
  try {
    const { data, error } = await (supabase
      .from('tickets')
      .select('balance, frozen_listing, frozen_exchange')
      .eq('user_id', userId)
      .single() as any);

    if (error) {
      return {
        sufficient: false,
        error: `Failed to fetch ticket balance: ${error.message}`
      };
    }

    if (!data) {
      return {
        sufficient: false,
        error: 'User ticket record not found'
      };
    }

    const total = (data.balance as number) || 0;
    const frozen_listing = (data.frozen_listing as number) || 0;
    const frozen_exchange = (data.frozen_exchange as number) || 0;
    const available = total - frozen_listing - frozen_exchange;

    // User needs at least 1 available ticket to list a toy
    const sufficient = available >= 1;

    return {
      sufficient,
      balance: {
        total,
        available,
        frozen_listing
      },
      error: sufficient ? undefined : 'Insufficient tickets to list a toy. You need at least 1 available ticket.'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      sufficient: false,
      error: `Database error: ${errorMessage}`
    };
  }
}

/**
 * Creates toy record in database
 */
async function createToyRecord(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  category: ToyCategory,
  description: string,
  tags: string[],
  ageGroup: ToyAgeGroup,
  condition: ToyCondition,
  postalCode: string
): Promise<{ success: boolean; toyId?: string; error?: string }> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now

    const { data, error } = await (supabase
      .from('toys') as any)
      .insert([
        {
          user_id: userId,
          category,
          description: description.trim(),
          tags,
          age_group: ageGroup,
          condition,
          postal_code: postalCode,
          is_active: true,
          frozen_listing_tickets: 1,
          expires_at: expiresAt.toISOString()
        }
      ])
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create toy listing: ${error.message}`
      };
    }

    return {
      success: true,
      toyId: (data.id as string) || undefined
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Database error: ${errorMessage}`
    };
  }
}

/**
 * Uploads images for toy listing
 */
async function uploadToyImages(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  toyId: string,
  files: File[]
): Promise<{ success: boolean; images?: UploadedImageMetadata[]; error?: string }> {
  const uploadedImages: UploadedImageMetadata[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageOrder = i + 1; // Database image_order is 1-indexed

      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Process image (resize and create thumbnail)
      let processedImages;
      try {
        processedImages = await processImage(buffer);
      } catch (processError) {
        const errorMessage = processError instanceof Error ? processError.message : 'Unknown error';
        return {
          success: false,
          error: `Image processing failed for file ${i + 1}: ${errorMessage}`
        };
      }

      // Upload processed images to storage
      let uploadResult;
      try {
        uploadResult = await uploadImage(
          supabase,
          userId,
          toyId,
          i, // storage path uses 0-indexed order
          processedImages.resized,
          processedImages.thumbnail
        );
      } catch (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
        return {
          success: false,
          error: `Image upload failed for file ${i + 1}: ${errorMessage}`
        };
      }

      // Create toy_images record
      try {
        const { data, error } = await (supabase
          .from('toy_images') as any)
          .insert([
            {
              toy_id: toyId,
              storage_path: uploadResult.path,
              image_order: imageOrder
            }
          ])
          .select('id')
          .single();

        if (error) {
          return {
            success: false,
            error: `Failed to save image metadata for file ${i + 1}: ${error.message}`
          };
        }

        uploadedImages.push({
          toyImageId: (data.id as string) || '',
          storagePath: uploadResult.path,
          thumbnailPath: uploadResult.thumbnailPath,
          publicUrl: uploadResult.publicUrl,
          imageOrder
        });
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
        return {
          success: false,
          error: `Database error while saving image metadata for file ${i + 1}: ${errorMessage}`
        };
      }
    }

    return {
      success: true,
      images: uploadedImages
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Unexpected error during image upload: ${errorMessage}`
    };
  }
}

/**
 * Updates frozen_listing balance for user
 */
async function updateFrozenBalance(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  increment: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fallback: use regular update since RPC might not be available
    const { data: current, error: fetchError } = await (supabase
      .from('tickets')
      .select('frozen_listing')
      .eq('user_id', userId)
      .single() as any);

    if (fetchError) {
      return {
        success: false,
        error: `Failed to update frozen balance: ${fetchError.message}`
      };
    }

    const newFrozenBalance = ((current as any)?.frozen_listing as number) || 0;
    const { error: updateError } = await (supabase
      .from('tickets') as any)
      .update({ frozen_listing: newFrozenBalance + increment })
      .eq('user_id', userId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update frozen balance: ${updateError.message}`
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Database error: ${errorMessage}`
    };
  }
}

/**
 * Logs analytics event for toy listing
 */
async function logAnalyticsEvent(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  toyId: string,
  category: ToyCategory,
  tags: string[],
  postalCode: string
): Promise<void> {
  try {
    await (supabase
      .from('search_analytics') as any)
      .insert([
        {
          toy_id: toyId,
          user_id: userId,
          category,
          tags,
          postal_code: postalCode,
          timestamp: new Date().toISOString()
        }
      ]);
  } catch (error) {
    // Analytics failures should not break the listing creation
    // Log but don't return error
    console.error('Analytics logging failed:', error);
  }
}

/**
 * POST endpoint handler
 * Processes toy listing creation request
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Validate JWT token
    const token = getTokenFromRequest(req);
    const tokenValidation = validateToken(token);

    if (!tokenValidation.valid) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: tokenValidation.error || 'Authentication failed',
          code: 'AUTHENTICATION_ERROR'
        },
        { status: 401 }
      );
    }

    const userId = tokenValidation.payload!.userId;

    // Step 2: Parse request body
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: 'Failed to parse form data',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Step 3: Extract form fields
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const tagsJson = formData.get('tags') as string;
    const ageGroup = formData.get('age_group') as string;
    const condition = formData.get('condition') as string;

    // Parse tags from JSON string
    let tags: string[] = [];
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch (error) {
        return NextResponse.json<ToyListingErrorResponse>(
          {
            success: false,
            error: 'Tags must be valid JSON array',
            code: 'VALIDATION_ERROR',
            details: { tags: 'Invalid JSON format' }
          },
          { status: 400 }
        );
      }
    }

    // Step 4: Validate form fields
    const fieldValidation = validateToyListingRequest({
      category,
      description,
      tags,
      age_group: ageGroup,
      condition
    });

    if (!fieldValidation.valid) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatValidationErrors(fieldValidation.errors)
        },
        { status: 400 }
      );
    }

    // Step 5: Extract and validate files
    const files: File[] = [];
    const fileEntries = formData.entries();

    for (const [key, value] of fileEntries) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    const fileValidation = validateImages(files);
    if (!fileValidation.valid) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: 'Image validation failed',
          code: 'FILE_ERROR',
          details: formatValidationErrors(fileValidation.errors)
        },
        { status: 400 }
      );
    }

    // Step 6: Initialize Supabase client
    const supabase = getSupabaseServerClient();

    // Step 7: Fetch user profile for postal code
    const profileResult = await getUserProfile(supabase, userId);
    if (!profileResult.success) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: profileResult.error || 'Failed to fetch user profile',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    const postalCode = profileResult.profile!.postal_code;

    // Step 8: Check ticket balance
    const balanceResult = await checkTicketBalance(supabase, userId);
    if (!balanceResult.sufficient) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: balanceResult.error || 'Insufficient tickets',
          code: 'INSUFFICIENT_TICKETS'
        },
        { status: 402 }
      );
    }

    // Step 9: Create toy record
    const createResult = await createToyRecord(
      supabase,
      userId,
      category as ToyCategory,
      description,
      tags,
      ageGroup as ToyAgeGroup,
      condition as ToyCondition,
      postalCode
    );

    if (!createResult.success) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: createResult.error || 'Failed to create toy listing',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    const toyId = createResult.toyId!;

    // Step 10: Upload images and create image records
    const imagesResult = await uploadToyImages(supabase, userId, toyId, files);
    if (!imagesResult.success) {
      // Note: In production, consider rolling back toy record here
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: imagesResult.error || 'Failed to upload images',
          code: 'STORAGE_ERROR'
        },
        { status: 500 }
      );
    }

    // Step 11: Update frozen_listing balance
    const balanceUpdateResult = await updateFrozenBalance(supabase, userId, 1);
    if (!balanceUpdateResult.success) {
      return NextResponse.json<ToyListingErrorResponse>(
        {
          success: false,
          error: balanceUpdateResult.error || 'Failed to update ticket balance',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    // Step 12: Log analytics event (non-blocking)
    logAnalyticsEvent(supabase, userId, toyId, category as ToyCategory, tags, postalCode).catch(error => {
      console.error('Analytics logging failed:', error);
    });

    // Step 13: Return success response with updated balance
    const updatedBalance = {
      total: balanceResult.balance!.total,
      available: balanceResult.balance!.available - 1, // Decrement available
      frozen_listing: balanceResult.balance!.frozen_listing + 1 // Increment frozen
    };

    const response: CreateToyResponse = {
      success: true,
      toy_id: toyId,
      message: 'Toy listed successfully',
      ticket_balance: updatedBalance
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Toy creation error:', errorMessage);

    return NextResponse.json<ToyListingErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'DATABASE_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Method not allowed
 */
export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
