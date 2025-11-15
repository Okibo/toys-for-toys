import { renderHook, act, waitFor } from '@testing-library/react';
import { useLogin } from '@/lib/hooks/useLogin';

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

describe('useLogin Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have initial form state with empty values', () => {
      const { result } = renderHook(() => useLogin());

      expect(result.current.formState.email).toBe('');
      expect(result.current.formState.password).toBe('');
      expect(result.current.formState.rememberMe).toBe(false);
    });

    test('should have empty errors on mount', () => {
      const { result } = renderHook(() => useLogin());

      expect(result.current.errors).toEqual({});
    });

    test('should not be loading on mount', () => {
      const { result } = renderHook(() => useLogin());

      expect(result.current.isLoading).toBe(false);
    });

    test('should not be success on mount', () => {
      const { result } = renderHook(() => useLogin());

      expect(result.current.isSuccess).toBe(false);
    });

    test('should have no API error on mount', () => {
      const { result } = renderHook(() => useLogin());

      expect(result.current.apiError).toBeNull();
    });
  });

  describe('updateField', () => {
    test('should update email field', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
      });

      expect(result.current.formState.email).toBe('test@example.com');
    });

    test('should update password field', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('password', 'password123');
      });

      expect(result.current.formState.password).toBe('password123');
    });

    test('should update rememberMe field', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('rememberMe', 'true' as any);
      });

      expect(result.current.formState.rememberMe).toBe('true');
    });

    test('should clear field errors when updating a field', () => {
      const { result } = renderHook(() => useLogin());

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
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(true);
      });
    });

    test('should return false when email is missing', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('password', 'password123');
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });
    });

    test('should return false when password is missing', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });
    });

    test('should set email error when email is invalid', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'invalid-email');
        result.current.updateField('password', 'password123');
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();
    });

    test('should set password error when password is too short', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'short');
        result.current.validateForm();
      });

      expect(result.current.errors.password).toBeDefined();
    });

    test('should clear errors when form becomes valid', () => {
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'invalid');
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('submit', () => {
    test('should not submit when form validation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user_id: 'test-user' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'invalid-email');
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should send request to /api/auth/login endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user_id: 'test-user', message: 'Logged in' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    test('should send credentials in request body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user_id: 'test-user' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
        result.current.updateField('rememberMe', 'true' as any);
      });

      await act(async () => {
        await result.current.submit();
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.email).toBe('test@example.com');
      expect(body.password).toBe('password123');
      expect(body.rememberMe).toBe('true');
    });

    test('should set isLoading to true during submission', async () => {
      let resolveFunc: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolveFunc = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      let submitPromise: any;
      act(() => {
        submitPromise = result.current.submit();
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        resolveFunc!({
          ok: true,
          json: async () => ({ success: true, user_id: 'test-user' })
        });
      });

      await submitPromise;

      expect(result.current.isLoading).toBe(false);
    });

    test('should set isSuccess to true on successful login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user_id: 'test-user', message: 'Logged in' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should return user_id on successful login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user_id: 'test-user-id' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(true);
      expect(submitResult.user_id).toBe('test-user-id');
    });

    test('should reset form state on successful login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user_id: 'test-user' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
        result.current.updateField('rememberMe', 'true' as any);
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.formState.email).toBe('');
      expect(result.current.formState.password).toBe('');
      expect(result.current.formState.rememberMe).toBe(false);
    });

    test('should set apiError on failed login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'wrong-password');
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.apiError).toBe('Invalid credentials');
    });

    test('should return error on failed login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'wrong-password');
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
      expect(submitResult.error).toBe('Invalid credentials');
    });

    test('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
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
      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
        result.current.updateField('rememberMe', 'true' as any);
        result.current.reset();
      });

      expect(result.current.formState.email).toBe('');
      expect(result.current.formState.password).toBe('');
      expect(result.current.formState.rememberMe).toBe(false);
    });

    test('should clear all errors on reset', () => {
      const { result } = renderHook(() => useLogin());

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
      const { result } = renderHook(() => useLogin());

      act(() => {
        // Simulate apiError being set
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.apiError).toBeNull();
    });

    test('should reset isSuccess on reset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, user_id: 'test-user' })
      });

      const { result } = renderHook(() => useLogin());

      act(() => {
        result.current.updateField('email', 'test@example.com');
        result.current.updateField('password', 'password123');
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
  });
});
