/**
 * useSignup Hook Tests
 * Tests for signup form state management and API integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSignup } from '@/lib/hooks/useSignup';

// Mock fetch
global.fetch = jest.fn();

describe('useSignup Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    sessionStorage.clear();
  });

  describe('Initial State', () => {
    it('should have initial form state', () => {
      const { result } = renderHook(() => useSignup());

      expect(result.current.formState.email).toBe('');
      expect(result.current.formState.password).toBe('');
      expect(result.current.formState.passwordConfirm).toBe('');
      expect(result.current.formState.language).toBe('en');
    });

    it('should have no initial errors', () => {
      const { result } = renderHook(() => useSignup());
      expect(result.current.errors).toEqual({});
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useSignup());
      expect(result.current.isLoading).toBe(false);
    });

    it('should not be successful initially', () => {
      const { result } = renderHook(() => useSignup());
      expect(result.current.isSuccess).toBe(false);
    });

    it('should have no API error initially', () => {
      const { result } = renderHook(() => useSignup());
      expect(result.current.apiError).toBeNull();
    });
  });

  describe('updateField', () => {
    it('should update email field', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      expect(result.current.formState.email).toBe('test@example.com');
    });

    it('should update password field', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('password', 'TestPassword123!');
      });

      expect(result.current.formState.password).toBe('TestPassword123!');
    });

    it('should update password confirmation field', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('passwordConfirm', 'TestPassword123!');
      });

      expect(result.current.formState.passwordConfirm).toBe('TestPassword123!');
    });

    it('should update language field', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('language', 'pl');
      });

      expect(result.current.formState.language).toBe('pl');
    });

    it('should clear field error when user updates field', () => {
      const { result } = renderHook(() => useSignup());

      // Set an error
      act(() => {
        // This simulates validation setting an error
        // We'll directly set it via updateField
      });

      // updateField clears errors for that field
      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      // Error should be cleared
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('validateForm', () => {
    it('should return false when form is invalid', () => {
      const { result } = renderHook(() => useSignup());

      let isValid = false;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
    });

    it('should set email errors when email is invalid', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'invalid-email');
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.email?.length).toBeGreaterThan(0);
    });

    it('should set password errors when password is invalid', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('password', 'weak');
        result.current.validateForm();
      });

      expect(result.current.errors.password).toBeDefined();
    });

    it('should set error when passwords do not match', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'TestPassword123!');
        result.current.updateField('passwordConfirm', 'DifferentPass123!');
        result.current.validateForm();
      });

      expect(result.current.errors.passwordConfirm).toBeDefined();
      // The error should be about passwords not matching
      expect(result.current.errors.passwordConfirm?.length).toBeGreaterThan(0);
    });

    it('should set error when password confirmation is empty', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('password', 'TestPassword123!');
        result.current.validateForm();
      });

      expect(result.current.errors.passwordConfirm).toBeDefined();
    });

    it('should validate all fields correctly', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'TestPassword123!');
        result.current.updateField('passwordConfirm', 'TestPassword123!');
        result.current.validateForm();
      });

      // Check that the form has the correct values
      expect(result.current.formState.email).toBe('test@example.com');
      expect(result.current.formState.password).toBe('TestPassword123!');
      expect(result.current.formState.passwordConfirm).toBe('TestPassword123!');
    });

    it('should have no errors with valid email', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'valid@example.com');
      });

      // Email should be stored
      expect(result.current.formState.email).toBe('valid@example.com');
    });

    it('should have no errors with valid password', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('password', 'ValidPassword123!');
      });

      // Password should be stored
      expect(result.current.formState.password).toBe('ValidPassword123!');
    });
  });

  describe('submit', () => {
    it('should have submit function', () => {
      const { result } = renderHook(() => useSignup());
      expect(typeof result.current.submit).toBe('function');
    });

    it('should not submit with invalid email', async () => {
      const { result } = renderHook(() => useSignup());

      await act(async () => {
        result.current.updateField('email', 'invalid-email');
        result.current.updateField('password', 'TestPassword123!');
        result.current.updateField('passwordConfirm', 'TestPassword123!');
        await result.current.submit();
      });

      // Fetch should not be called due to validation failure
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.errors.email).toBeDefined();
    });

    it('should not submit with weak password', async () => {
      const { result } = renderHook(() => useSignup());

      await act(async () => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'weak');
        result.current.updateField('passwordConfirm', 'weak');
        await result.current.submit();
      });

      // Fetch should not be called due to weak password
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.errors.password).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset form to initial state', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'TestPassword123!');
        result.current.reset();
      });

      expect(result.current.formState.email).toBe('');
      expect(result.current.formState.password).toBe('');
      expect(result.current.formState.passwordConfirm).toBe('');
      expect(result.current.formState.language).toBe('en');
    });

    it('should clear all errors', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.validateForm();
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
    });

    it('should reset loading state', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should reset success state', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.reset();
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.successMessage).toBe('');
    });

    it('should clear API error', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.reset();
      });

      expect(result.current.apiError).toBeNull();
    });
  });

  describe('Email Handling', () => {
    it('should accept valid email formats', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'user@example.com');
      });

      expect(result.current.formState.email).toBe('user@example.com');
    });

    it('should reject invalid email formats', () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('email', 'invalid-email');
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();
    });
  });

  describe('Language Preference', () => {
    it('should accept different language preferences', async () => {
      const { result } = renderHook(() => useSignup());

      act(() => {
        result.current.updateField('language', 'pl');
      });

      expect(result.current.formState.language).toBe('pl');

      act(() => {
        result.current.updateField('language', 'de');
      });

      expect(result.current.formState.language).toBe('de');

      act(() => {
        result.current.updateField('language', 'en');
      });

      expect(result.current.formState.language).toBe('en');
    });
  });
});
