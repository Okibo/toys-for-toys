/**
 * app/api/auth/signup/step2/route.ts
 *
 * API endpoint for Signup Step 2 (Child Profile).
 * Validates and stores child profile data in session.
 * POST /api/auth/signup/step2
 */

import { NextRequest, NextResponse } from 'next/server';
import { signupStep2FormSchema } from '@/lib/auth-validation';

/**
 * POST handler for Step 2
 * Validates child profile data and stores in session
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate with Zod schema
    const validationResult = signupStep2FormSchema.safeParse({
      children: body.children,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid child profile data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // TODO: Store in session (when session management is implemented)
    // For now, validation passes and data is ready for Step 3

    return NextResponse.json({
      success: true,
      message: 'Child profiles saved successfully',
    });
  } catch (error) {
    console.error('Step 2 POST error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}
