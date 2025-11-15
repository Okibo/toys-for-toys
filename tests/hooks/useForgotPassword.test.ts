import { renderHook, act } from '@testing-library/react';
import { useForgotPassword } from '@/lib/hooks/useForgotPassword';

// Mock fetch
global.fetch = jest.fn();

// Mock the email validator
jest.mock('@/lib/auth/email-validator', () => ({
  validateEmail: jest.fn((email: string) => {
    if (!email) return { isValid: false, errors: ['Email is required'], normalizedEmail: null };
    if (!email.includes('@')) return { isValid: false, errors: ['Invalid email format'], normalizedEmail: null };
    return { isValid: true, errors: [], normalizedEmail: email };
  })
}));

describe('useForgotPassword Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have empty email on mount', () => {
      const { result } = renderHook(() => useForgotPassword());

      expect(result.current.formState.email).toBe('');
    });

    test('should have empty errors on mount', () => {
      const { result } = renderHook(() => useForgotPassword());

      expect(result.current.errors).toEqual({});
    });

    test('should not be loading on mount', () => {
      const { result } = renderHook(() => useForgotPassword());

      expect(result.current.isLoading).toBe(false);
    });

    test('should not be success on mount', () => {
      const { result } = renderHook(() => useForgotPassword());

      expect(result.current.isSuccess).toBe(false);
    });

    test('should have empty success message on mount', () => {
      const { result } = renderHook(() => useForgotPassword());

      expect(result.current.successMessage).toBe('');
    });

    test('should have no API error on mount', () => {
      const { result } = renderHook(() => useForgotPassword());

      expect(result.current.apiError).toBeNull();
    });
  });

  describe('updateField', () => {
    test('should update email field', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      expect(result.current.formState.email).toBe('test@example.com');
    });

    test('should clear field errors when updating a field', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', '');
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('validateForm', () => {
    test('should return true when form is valid', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(true);
      });
    });

    test('should return false when email is missing', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });
    });

    test('should set email error when email is invalid', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'invalid-email');
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();
    });

    test('should clear errors when form becomes valid', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'invalid');
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('submit', () => {
    test('should not submit when form validation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'invalid-email');
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should send request to /api/auth/forgot-password endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    test('should send email in request body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.email).toBe('test@example.com');
    });

    test('should set isLoading to true during submission', async () => {
      let resolveFunc: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolveFunc = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      let submitPromise: any;
      act(() => {
        submitPromise = result.current.submit();
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        resolveFunc!({
          ok: true,
          json: async () => ({ success: true, message: 'Link sent' })
        });
      });

      await submitPromise;

      expect(result.current.isLoading).toBe(false);
    });

    test('should set isSuccess to true on successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent to test@example.com' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should set success message on successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent to test@example.com' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.successMessage).toBe('Link sent to test@example.com');
    });

    test('should reset form state on successful submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.formState.email).toBe('');
    });

    test('should set apiError on failed submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email not found' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'unknown@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.apiError).toBe('Email not found');
    });

    test('should return error on failed submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email not found' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'unknown@example.com');
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
      expect(submitResult.error).toBe('Email not found');
    });

    test('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
      expect(submitResult.error).toBe('Network error');
      expect(result.current.apiError).toBe('Network error');
    });
  });

  describe('reset', () => {
    test('should reset form state to initial values', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.reset();
      });

      expect(result.current.formState.email).toBe('');
    });

    test('should clear all errors on reset', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'invalid');
        result.current.validateForm();
      });

      expect(result.current.errors).not.toEqual({});

      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
    });

    test('should clear apiError on reset', () => {
      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.apiError).toBeNull();
    });

    test('should reset isSuccess on reset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.isSuccess).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isSuccess).toBe(false);
    });

    test('should clear success message on reset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Link sent' })
      });

      const { result } = renderHook(() => useForgotPassword());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.successMessage).not.toBe('');

      act(() => {
        result.current.reset();
      });

      expect(result.current.successMessage).toBe('');
    });
  });
});
