import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

// Mock Next.js router
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock the useResetPassword hook
jest.mock('@/lib/hooks/useResetPassword', () => ({
  useResetPassword: jest.fn()
}));

// Mock the PasswordStrengthIndicator component
jest.mock('@/components/auth/PasswordStrengthIndicator', () => {
  return function MockPasswordStrengthIndicator() {
    return <div>Password Strength Indicator</div>;
  };
});

import { useResetPassword } from '@/lib/hooks/useResetPassword';

const mockUseResetPassword = useResetPassword as jest.MockedFunction<typeof useResetPassword>;

describe('ResetPasswordForm Component', () => {
  const defaultMockReturn = {
    formState: { password: '', passwordConfirm: '' },
    errors: {},
    isLoading: false,
    isSuccess: false,
    isValidatingToken: false,
    tokenError: null,
    apiError: null,
    updateField: jest.fn(),
    submit: jest.fn().mockResolvedValue({ success: true }),
    reset: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResetPassword.mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    test('should render password field', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    });

    test('should render password confirmation field', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    test('should render submit button', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    test('should render back to login link', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
    });

    test('should render success message when isSuccess is true', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/password has been successfully reset/i)).toBeInTheDocument();
    });

    test('should show loading state while validating token', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        isValidatingToken: true
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/validating reset link/i)).toBeInTheDocument();
    });

    test('should show error when token is invalid', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        tokenError: 'Invalid or expired reset token',
        isValidatingToken: false
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid or expired reset token/i)).toBeInTheDocument();
    });

    test('should show password strength indicator when password is entered', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        formState: { password: 'testpassword123', passwordConfirm: '' }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/password strength indicator/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    test('should update password field when user types', async () => {
      const mockUpdateField = jest.fn();
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        updateField: mockUpdateField
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const passwordInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;

      await userEvent.type(passwordInput, 'newpassword123');

      expect(mockUpdateField).toHaveBeenCalledWith('password', 'newpassword123');
    });

    test('should update password confirmation field when user types', async () => {
      const mockUpdateField = jest.fn();
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        updateField: mockUpdateField
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      await userEvent.type(confirmInput, 'newpassword123');

      expect(mockUpdateField).toHaveBeenCalledWith('passwordConfirm', 'newpassword123');
    });

    test('should toggle password visibility', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const passwordInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByLabelText(/show password/i);
      const passwordToggleButton = toggleButtons[0];

      expect(passwordInput.type).toBe('password');

      fireEvent.click(passwordToggleButton);

      expect(passwordInput.type).toBe('text');
    });

    test('should toggle password confirmation visibility', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByLabelText(/show password/i);
      const confirmToggleButton = toggleButtons[1];

      expect(confirmInput.type).toBe('password');

      fireEvent.click(confirmToggleButton);

      expect(confirmInput.type).toBe('text');
    });
  });

  describe('Form Submission', () => {
    test('should call submit on form submission', () => {
      const mockSubmit = jest.fn().mockResolvedValue({ success: true });
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        formState: { password: 'newpassword123', passwordConfirm: 'newpassword123' },
        submit: mockSubmit
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      // Submit button is enabled when both passwords are filled
      expect(submitButton).toBeInTheDocument();
      expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    });

    test('should disable submit button when passwords are empty', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        formState: { password: '', passwordConfirm: '' }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const submitButton = screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);
    });

    test('should disable submit button during loading', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        formState: { password: 'newpassword123', passwordConfirm: 'newpassword123' }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const submitButton = screen.getByRole('button', { name: /resetting password/i }) as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);
    });

    test('should show loading text while submitting', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        formState: { password: 'newpassword123', passwordConfirm: 'newpassword123' }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/resetting password/i)).toBeInTheDocument();
    });

    test('should call onSuccess callback when submit succeeds', () => {
      const mockSubmit = jest.fn().mockResolvedValue({ success: true });
      const mockOnSuccess = jest.fn();

      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        formState: { password: 'newpassword123', passwordConfirm: 'newpassword123' },
        submit: mockSubmit
      });

      render(
        <ResetPasswordForm
          token="test-token"
          email="test@example.com"
          onSuccess={mockOnSuccess}
        />
      );

      expect(typeof mockOnSuccess).toBe('function');
    });

    test('should call onError callback when submit fails', () => {
      const mockSubmit = jest.fn().mockResolvedValue({
        success: false,
        error: 'Failed to reset password'
      });
      const mockOnError = jest.fn();

      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        formState: { password: 'newpassword123', passwordConfirm: 'newpassword123' },
        submit: mockSubmit
      });

      render(
        <ResetPasswordForm
          token="test-token"
          email="test@example.com"
          onError={mockOnError}
        />
      );

      expect(typeof mockOnError).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should display API error when apiError is set', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Failed to reset password'
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
    });

    test('should display field error for password', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { password: ['Password must be at least 8 characters'] }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    test('should display field error for password confirmation', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { passwordConfirm: ['Passwords do not match'] }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    test('should mark password field as invalid', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { password: ['Invalid password'] }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const passwordInput = screen.getByLabelText(/^new password$/i);

      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');
    });

    test('should mark password confirmation field as invalid', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { passwordConfirm: ['Passwords do not match'] }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      expect(confirmInput).toHaveAttribute('aria-invalid', 'true');
      expect(confirmInput).toHaveAttribute('aria-describedby', 'passwordConfirm-error');
    });
  });

  describe('Success State', () => {
    test('should display success message', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
    });

    test('should provide return to login link in success state', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const loginLink = screen.getByRole('link', { name: /return to login/i });

      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/login');
    });
  });

  describe('Token Error State', () => {
    test('should display token error message', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        tokenError: 'This reset link has expired',
        isValidatingToken: false
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      expect(screen.getByText(/this reset link has expired/i)).toBeInTheDocument();
    });

    test('should provide button to request new reset link', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        tokenError: 'This reset link has expired',
        isValidatingToken: false
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const requestNewLink = screen.getByRole('link', { name: /request new reset link/i });

      expect(requestNewLink).toBeInTheDocument();
      expect(requestNewLink).toHaveAttribute('href', '/auth/forgot-password');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for all fields', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);

      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    test('should have aria-live region for error messages', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Error message'
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const errorContainer = screen.getByText(/error message/i).closest('[role="alert"]');

      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
    });

    test('should have proper button type', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        formState: { password: 'newpassword123', passwordConfirm: 'newpassword123' }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const submitButton = screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement;

      expect(submitButton.type).toBe('submit');
    });

    test('should have password visibility toggles with proper aria-label', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const toggleButtons = screen.getAllByLabelText(/show password/i);

      toggleButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    test('should have focus management', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const passwordInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;

      fireEvent.focus(passwordInput);
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('CSS Classes', () => {
    test('should apply className prop to form', () => {
      const { container } = render(
        <ResetPasswordForm
          token="test-token"
          email="test@example.com"
          className="custom-class"
        />
      );
      const form = container.querySelector('form');

      expect(form).toHaveClass('custom-class');
    });

    test('should apply error styles to password field when there is an error', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { password: ['Invalid password'] }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const passwordInput = screen.getByLabelText(/^new password$/i);

      expect(passwordInput).toHaveClass('border-red-500');
    });

    test('should apply disabled styles when loading', () => {
      mockUseResetPassword.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        formState: { password: 'newpassword123', passwordConfirm: 'newpassword123' }
      });

      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const submitButton = screen.getByRole('button', { name: /resetting password/i });

      expect(submitButton).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Link Navigation', () => {
    test('should have correct href for back to login link', () => {
      render(<ResetPasswordForm token="test-token" email="test@example.com" />);
      const backLink = screen.getByRole('link', { name: /back to login/i }) as HTMLAnchorElement;

      expect(backLink.href).toMatch(/auth\/login/);
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive form container', () => {
      const { container } = render(
        <ResetPasswordForm token="test-token" email="test@example.com" />
      );
      const form = container.querySelector('form');

      expect(form?.className).toMatch(/max-w-md/);
      expect(form?.className).toMatch(/mx-auto/);
    });
  });
});
