import { useState, useCallback } from 'react';

export interface ToyListingFormState {
  category: string;
  description: string;
  ageGroup: string;
  condition: string;
  tags: string[];
}

export interface ToyListingFieldErrors {
  category?: string[];
  description?: string[];
  ageGroup?: string[];
  condition?: string[];
  tags?: string[];
}

export interface ToyListingSubmitResult {
  success: boolean;
  listing_id?: string;
  error?: string;
}

export interface UseToyListingReturn {
  formState: ToyListingFormState;
  errors: ToyListingFieldErrors;
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string | null;
  updateField: (field: keyof ToyListingFormState, value: string | string[]) => void;
  validateForm: () => boolean;
  submit: () => Promise<ToyListingSubmitResult>;
  reset: () => void;
}

const INITIAL_STATE: ToyListingFormState = {
  category: '',
  description: '',
  ageGroup: '',
  condition: '',
  tags: []
};

const CATEGORIES = ['Blocks', 'Vehicles', 'Dolls', 'Board Games', 'Educational', 'Sports', 'Art', 'Other'];
const AGE_GROUPS = ['0-2', '3-5', '6-8', '9-11', '12-14', '15+'];
const CONDITIONS = ['Like New', 'Good', 'Fair', 'Well-Loved'];

/**
 * Custom hook for managing toy listing form state and API integration
 * Handles form validation, submission, and error management
 */
export function useToyListing(): UseToyListingReturn {
  const [formState, setFormState] = useState<ToyListingFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<ToyListingFieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Update a single form field
   */
  const updateField = useCallback((field: keyof ToyListingFormState, value: string | string[]) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear field errors when user starts editing
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }, []);

  /**
   * Validate the entire form before submission
   * Returns true if all validations pass
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ToyListingFieldErrors = {};

    // Validate category
    if (!formState.category || formState.category.trim().length === 0) {
      newErrors.category = ['Category is required'];
    } else if (!CATEGORIES.includes(formState.category)) {
      newErrors.category = ['Please select a valid category'];
    }

    // Validate description
    if (!formState.description || formState.description.trim().length === 0) {
      newErrors.description = ['Description is required'];
    } else if (formState.description.length < 10) {
      newErrors.description = ['Description must be at least 10 characters'];
    } else if (formState.description.length > 500) {
      newErrors.description = ['Description cannot exceed 500 characters'];
    }

    // Validate ageGroup
    if (!formState.ageGroup || formState.ageGroup.trim().length === 0) {
      newErrors.ageGroup = ['Age group is required'];
    } else if (!AGE_GROUPS.includes(formState.ageGroup)) {
      newErrors.ageGroup = ['Please select a valid age group'];
    }

    // Validate condition
    if (!formState.condition || formState.condition.trim().length === 0) {
      newErrors.condition = ['Condition is required'];
    } else if (!CONDITIONS.includes(formState.condition)) {
      newErrors.condition = ['Please select a valid condition'];
    }

    // Validate tags
    if (!Array.isArray(formState.tags) || formState.tags.length === 0) {
      newErrors.tags = ['Please select at least one tag'];
    } else if (formState.tags.length > 3) {
      newErrors.tags = ['You can select a maximum of 3 tags'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Submit toy listing form to API
   */
  const submit = useCallback(async (): Promise<ToyListingSubmitResult> => {
    // Reset previous errors
    setApiError(null);
    setIsSuccess(false);

    // Validate form
    if (!validateForm()) {
      return { success: false, error: 'Please fix the errors above' };
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/toys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: formState.category,
          description: formState.description,
          age_group: formState.ageGroup,
          condition: formState.condition,
          tags: formState.tags
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to create listing';
        setApiError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setIsSuccess(true);
      setFormState(INITIAL_STATE);

      return {
        success: true,
        listing_id: data.listing_id || data.id
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setApiError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [formState, validateForm]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormState(INITIAL_STATE);
    setErrors({});
    setApiError(null);
    setIsSuccess(false);
  }, []);

  return {
    formState,
    errors,
    isLoading,
    isSuccess,
    apiError,
    updateField,
    validateForm,
    submit,
    reset
  };
}
