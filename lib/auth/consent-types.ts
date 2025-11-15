/**
 * Consent Form Types
 * Types and interfaces for consent management and GDPR compliance
 */

export interface ConsentFormState {
  privacy_policy: boolean;
  terms_of_service: boolean;
  behavioral_analytics: boolean;
}

export interface ConsentFieldErrors {
  privacy_policy?: string;
  terms_of_service?: string;
  behavioral_analytics?: string;
}

export interface UseConsentReturn {
  formState: ConsentFormState;
  errors: ConsentFieldErrors;
  isLoading: boolean;
  isSuccess: boolean;
  successMessage: string;
  apiError: string | null;
  updateField: (field: keyof ConsentFormState, value: boolean) => void;
  validateForm: () => boolean;
  submit: () => Promise<void>;
  reset: () => void;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  privacy_policy: boolean;
  terms_of_service: boolean;
  behavioral_analytics: boolean;
  analytics_withdrawn_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsentRequest {
  privacy_policy: boolean;
  terms_of_service: boolean;
  behavioral_analytics: boolean;
}

export interface ConsentResponse {
  success: boolean;
  data?: {
    id: string;
    user_id: string;
    message: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface ConsentWithdrawalRequest {
  consent_type: 'behavioral_analytics';
}

export interface ConsentWithdrawalResponse {
  success: boolean;
  data?: {
    message: string;
    withdrawn_at: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface UseConsentStatusReturn {
  consentStatus: ConsentRecord | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseConsentWithdrawalReturn {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  successMessage: string;
  withdraw: (consentType: 'behavioral_analytics') => Promise<void>;
}
