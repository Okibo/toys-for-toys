import { renderHook, act, waitFor } from '@testing-library/react';
import { useResetPassword } from '@/lib/hooks/useResetPassword';

// Mock fetch
global.fetch = jest.fn();

// Mock the password validator
jest.mock('@/lib/auth/password-validator', () => ({
  validatePassword: jest.fn((password: string) => {
    if (!password) return { isValid: false, errors: ['Password is required'], score: 'weak' };
    if (password.length < 8) return { isValid: false, errors: ['Password must be at least 8 characters'], score: 'weak' };
    return { isValid: true, errors: [], score: 'good' };
  })
}));

describe('useResetPassword Hook', () => {
  const mockToken = 'test-token';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have empty password fields on mount', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      expect(result.current.formState.password).toBe('');
      expect(result.current.formState.passwordConfirm).toBe('');
    });

    test('should have empty errors on mount', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      expect(result.current.errors).toEqual({});
    });

    test('should be validating token on mount', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      expect(result.current.isValidatingToken).toBe(true);
    });

    test('should have no token error on mount', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      expect(result.current.tokenError).toBeNull();
    });

    test('should not be loading on mount', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Token Validation', () => {
    test('should call /api/auth/validate-reset-token endpoint on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/validate-reset-token',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    test('should send token and email in request body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body.token).toBe(mockToken);
        expect(body.email).toBe(mockEmail);
      });
    });

    test('should set isValidatingToken to false after validation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });
    });

    test('should set tokenError when token is invalid', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid or expired token' })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.tokenError).toBe('Invalid or expired token');
      });
    });

    test('should handle network error during token validation', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.tokenError).toBe('Network error');
      });
    });

    test('should revalidate token when token or email changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { rerender } = renderHook(
        ({ token, email }) => useResetPassword(token, email),
        { initialProps: { token: mockToken, email: mockEmail } }
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);

      rerender({ token: 'new-token', email: mockEmail });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('updateField', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });
    });

    test('should update password field', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
      });

      expect(result.current.formState.password).toBe('newpassword123');
    });

    test('should update passwordConfirm field', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('passwordConfirm', 'newpassword123');
      });

      expect(result.current.formState.passwordConfirm).toBe('newpassword123');
    });

    test('should clear field errors when updating', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'short');
        result.current.validateForm();
      });

      expect(result.current.errors.password).toBeDefined();

      act(() => {
        result.current.updateField('password', 'newpassword123');
      });

      expect(result.current.errors.password).toBeUndefined();
    });
  });

  describe('validateForm', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });
    });

    test('should return true when form is valid', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'newpassword123');
      });

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(true);
      });
    });

    test('should return false when password is missing', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });
    });

    test('should return false when passwords do not match', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'differentpassword');
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });
    });

    test('should set error when passwords do not match', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'differentpassword');
        result.current.validateForm();
      });

      expect(result.current.errors.passwordConfirm).toBeDefined();
    });

    test('should set error when password is invalid', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'short');
        result.current.validateForm();
      });

      expect(result.current.errors.password).toBeDefined();
    });
  });

  describe('submit', () => {
    test('should not submit when form validation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'short');
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
    });

    test('should not submit when token is invalid', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid token' })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.tokenError).not.toBeNull();
      });

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
    });

    test('should send request to /api/auth/reset-password endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'newpassword123');
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset' })
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/reset-password',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    test('should send credentials in request body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'newpassword123');
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await act(async () => {
        await result.current.submit();
      });

      const resetCalls = (global.fetch as jest.Mock).mock.calls.filter((call: any[]) =>
        call[0] === '/api/auth/reset-password'
      );

      if (resetCalls.length > 0) {
        const body = JSON.parse(resetCalls[0][1].body);
        expect(body.token).toBe(mockToken);
        expect(body.email).toBe(mockEmail);
        expect(body.password).toBe('newpassword123');
      }
    });

    test('should set isSuccess to true on successful reset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'newpassword123');
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.isSuccess).toBe(true);
    });

    test('should set apiError on failed reset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'newpassword123');
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to reset password' })
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.apiError).toBe('Failed to reset password');
    });

    test('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });

      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'newpassword123');
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const submitResult = await act(async () => {
        return await result.current.submit();
      });

      expect(submitResult.success).toBe(false);
      expect(result.current.apiError).toBe('Network error');
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, valid: true })
      });
    });

    test('should reset form state to initial values', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'newpassword123');
        result.current.updateField('passwordConfirm', 'newpassword123');
        result.current.reset();
      });

      expect(result.current.formState.password).toBe('');
      expect(result.current.formState.passwordConfirm).toBe('');
    });

    test('should clear all errors on reset', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.updateField('password', 'short');
        result.current.validateForm();
      });

      expect(result.current.errors).not.toEqual({});

      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
    });

    test('should clear apiError on reset', async () => {
      const { result } = renderHook(() => useResetPassword(mockToken, mockEmail));

      await waitFor(() => {
        expect(result.current.isValidatingToken).toBe(false);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.apiError).toBeNull();
    });
  });
});
