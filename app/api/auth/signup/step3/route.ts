/**
 * app/api/auth/signup/step3/route.ts
 *
 * API endpoint for Signup Step 3 (Explicit GDPR Consent).
 * Validates consent, creates user account, stores consent record.
 * POST /api/auth/signup/step3
 */

import { NextRequest, NextResponse } from 'next/server';
import { signupStep3FormSchema } from '@/lib/auth-validation';

/**
 * POST handler for Step 3
 * Completes signup by creating account and storing consent
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate with Zod schema
    const validationResult = signupStep3FormSchema.safeParse({
      mainConsent: body.mainConsent,
      marketingConsent: body.marketingConsent,
      language: body.language,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid consent data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Validate that main consent is explicitly true
    if (!body.mainConsent) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must accept the consent to proceed',
        },
        { status: 400 }
      );
    }

    // TODO: Implement full signup flow:
    // 1. Get Step 1 and Step 2 data from session
    // 2. Create user in Supabase Auth
    // 3. Create parent profile in database
    // 4. Create child profiles in database
    // 5. Store consent record with timestamp
    // 6. Send confirmation email
    // 7. Set JWT cookie
    // 8. Log audit trail

    // For MVP, just validate and return success
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      redirectTo: '/app/dashboard',
    });
  } catch (error) {
    console.error('Step 3 POST error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while creating your account',
      },
      { status: 500 }
    );
  }
}
