/**
 * app/api/profiles/[id]/route.ts
 *
 * API endpoint for retrieving user profiles with field-level filtering.
 * Implements security-first design:
 * - RLS policy allows all authenticated users to read all profiles
 * - This endpoint enforces field-level filtering via allowlist
 * - Public profiles: id, full_name, language, user_stats (limited)
 * - Own profile: all fields including email and preferences
 *
 * Security Note: Field filtering is critical because RLS does not restrict field access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { filterPublicProfile, type FullProfile } from '@/lib/profiles';

// Extend params to include dynamic route parameter
interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/profiles/[id]
 *
 * Retrieve a user profile with field-level filtering based on authentication context.
 *
 * Query Parameters:
 *   - None (ID is in route)
 *
 * Response:
 *   - Public profile (limited fields) if not own profile
 *   - Full profile if viewing own profile
 *   - 400 if profile ID is invalid
 *   - 401 if not authenticated
 *   - 404 if profile not found
 *
 * @param request - Next.js request object
 * @param context - Route params containing profile ID
 * @returns Filtered profile data or error response
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = params;

    // Validate profile ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!profileId || !uuidRegex.test(profileId)) {
      return NextResponse.json(
        {
          error: 'Invalid profile ID',
          message: 'Profile ID must be a valid UUID',
        },
        { status: 400 }
      );
    }

    // Get authorization header to check if user is authenticated
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required to view profiles',
        },
        { status: 401 }
      );
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user token for RLS enforcement
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user ID from auth
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Invalid or expired authentication token',
        },
        { status: 401 }
      );
    }

    // Fetch full profile from database (RLS will enforce row access)
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        full_name,
        language,
        notification_preference,
        created_at,
        updated_at
      `
      )
      .eq('id', profileId)
      .maybeSingle();

    // Handle database errors
    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to retrieve profile',
        },
        { status: 500 }
      );
    }

    // Handle profile not found
    if (!profiles) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Profile not found',
        },
        { status: 404 }
      );
    }

    // Fetch user_stats separately (it's a separate table with 1-to-1 relationship)
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select(
        'avg_overall_rating, review_count, total_exchanges, avg_condition_rating, avg_communication_rating'
      )
      .eq('user_id', profileId)
      .maybeSingle();

    if (statsError) {
      console.error('Error fetching user stats:', statsError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to retrieve user stats',
        },
        { status: 500 }
      );
    }

    // Construct full profile object
    const profile: FullProfile = {
      ...profiles,
      user_stats: userStats,
    };

    // Apply field-level filtering based on whether user is viewing own profile
    const filteredProfile = filterPublicProfile(profile, currentUser.id);

    // Return filtered profile
    return NextResponse.json(filteredProfile, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in profile endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
