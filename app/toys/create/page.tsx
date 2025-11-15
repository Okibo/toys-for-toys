'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ToyListingForm from '@/components/toys/ToyListingForm';
import { useToyListing } from '@/lib/hooks/useToyListing';
import { useImageUpload } from '@/lib/hooks/useImageUpload';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Toy Listing Creation Page
 * Path: /toys/create
 * Allows authenticated users to create new toy listings
 * Includes form validation, image uploads, and submission handling
 *
 * Protected route - redirects to login if not authenticated
 * Requires email verification before listing
 */
export default function CreateToyPage() {
  const router = useRouter();
  const { user_id, loading: authLoading, isAuthenticated } = useAuth();
  const toyListing = useToyListing();
  const imageUpload = useImageUpload();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user_id) {
    return null;
  }

  const handleFieldChange = useCallback((field: string, value: string | string[]) => {
    toyListing.updateField(field as keyof typeof toyListing.formState, value);
  }, [toyListing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that we have at least one image
    if (imageUpload.images.length === 0) {
      // Show error message
      console.error('Please upload at least one image');
      return;
    }

    // Submit the form
    const result = await toyListing.submit();

    if (result.success) {
      // Show success message and redirect
      router.push(`/toys/${result.listing_id}`);
    }
  };

  const handleCancel = useCallback(() => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.back();
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-4">
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm mb-4 flex items-center gap-2"
            aria-label="Go back"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">List a Toy</h1>
          <p className="text-gray-600 mt-1">
            Share your toy and earn tickets to exchange for others
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        {/* Info Card */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-sm font-medium">
            <span className="block font-bold mb-1">Listing Cost: 1 Ticket</span>
            You'll spend 1 ticket to list this toy. Earn tickets back when your toy is exchanged with another user.
          </p>
        </div>

        {/* Form */}
        <ToyListingForm
          formState={toyListing.formState}
          errors={toyListing.errors}
          images={imageUpload.images}
          imageErrors={imageUpload.errors}
          isLoading={toyListing.isLoading}
          apiError={toyListing.apiError}
          onFieldChange={handleFieldChange}
          onAddImages={imageUpload.addImages}
          onRemoveImage={imageUpload.removeImage}
          onReorderImages={imageUpload.reorderImages}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tips for a Great Listing</h3>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                <li>Take clear, well-lit photos</li>
                <li>Be honest about the toy's condition</li>
                <li>Include relevant details and features</li>
                <li>Add helpful tags to improve visibility</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Community Guidelines</h3>
              <ul className="space-y-1 text-gray-600 list-disc list-inside">
                <li>Toys must be safe and non-hazardous</li>
                <li>No damaged or broken items</li>
                <li>Respect other members</li>
                <li>Fair exchange for all</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
