import { useState, useCallback, useEffect } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  user_id?: string;
  email?: string;
  loading: boolean;
  error?: string;
}

export interface UseAuthReturn extends AuthState {
  logout: () => Promise<void>;
}

/**
 * Custom hook for managing global authentication state
 * Checks for existing JWT token on mount and provides logout functionality
 */
export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: undefined
  });

  /**
   * Check if user is authenticated by validating JWT token
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if JWT token exists in httpOnly cookie
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include' // Send cookies with request
        });

        if (response.ok) {
          const data = await response.json();
          setAuthState({
            isAuthenticated: true,
            user_id: data.user_id,
            email: data.email,
            loading: false,
            error: undefined
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            loading: false,
            error: undefined
          });
        }
      } catch (error) {
        setAuthState({
          isAuthenticated: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to check authentication'
        });
      }
    };

    checkAuth();
  }, []);

  /**
   * Logout user and clear session
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Send cookies with request
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setAuthState({
        isAuthenticated: false,
        loading: false,
        error: undefined
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  return {
    ...authState,
    logout
  };
}
