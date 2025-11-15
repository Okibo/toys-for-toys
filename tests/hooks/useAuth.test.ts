import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock fetch
global.fetch = jest.fn();

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should have loading state true on mount', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
    });

    test('should have isAuthenticated false on mount', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should have no error on mount', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBeUndefined();
    });

    test('should have logout function', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('Authentication Check', () => {
    test('should call /api/auth/me endpoint on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: 'test-user', email: 'test@example.com' })
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/me',
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });
    });

    test('should set isAuthenticated to true when user is logged in', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    test('should set user_id when user is logged in', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user_id).toBe('test-user-id');
      });
    });

    test('should set email when user is logged in', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.email).toBe('test@example.com');
      });
    });

    test('should set loading to false after checking auth', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    test('should set isAuthenticated to false when API returns 401', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    test('should set loading to false when auth check fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    test('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe('Network error');
      });
    });

    test('should set error message when network error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection timeout'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.error).toBe('Connection timeout');
      });
    });
  });

  describe('logout', () => {
    test('should call /api/auth/logout endpoint', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Logged out' })
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });

    test('should set isAuthenticated to false after logout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should clear user_id after logout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user_id).toBe('test-user-id');
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user_id).toBeUndefined();
    });

    test('should clear email after logout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.email).toBe('test@example.com');
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.email).toBeUndefined();
    });

    test('should clear error after successful logout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.error).toBeUndefined();
    });

    test('should throw error when logout fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Logout failed' })
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.logout();
        });
      }).rejects.toThrow('Logout failed');
    });

    test('should set error message when logout fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      try {
        await act(async () => {
          await result.current.logout();
        });
      } catch (error) {
        // Expected error
      }

      expect(result.current.error).toBeDefined();
    });

    test('should handle network error during logout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.logout();
        });
      }).rejects.toThrow('Network error');
    });
  });

  describe('State Updates', () => {
    test('should maintain isAuthenticated state after logout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    test('should not have error initially', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.error).toBeUndefined();
    });

    test('should maintain loading state false after auth check completes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: 'test-user-id', email: 'test@example.com' })
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
