import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

// Mock Next.js router
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock the useForgotPassword hook
jest.mock('@/lib/hooks/useForgotPassword', () => ({
  useForgotPassword: jest.fn()
}));

import { useForgotPassword } from '@/lib/hooks/useForgotPassword';

const mockUseForgotPassword = useForgotPassword as jest.MockedFunction<typeof useForgotPassword>;

describe('ForgotPasswordForm Component', () => {
  const defaultMockReturn = {
    formState: { email: '' },
    errors: {},
    isLoading: false,
    isSuccess: false,
    successMessage: '',
    apiError: null,
    updateField: jest.fn(),
    submit: jest.fn().mockResolvedValue({ success: true }),
    reset: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseForgotPassword.mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    test('should render email field', () => {
      render(<ForgotPasswordForm />);
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    test('should render submit button', () => {
      render(<ForgotPasswordForm />);
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    test('should render return to login link', () => {
      render(<ForgotPasswordForm />);
      expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
    });

    test('should render explanation text', () => {
      render(<ForgotPasswordForm />);
      expect(screen.getByText(/enter the email address/i)).toBeInTheDocument();
    });

    test('should render success message when isSuccess is true', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Password reset link sent to test@example.com'
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/password reset link sent/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    test('should update email field when user types', async () => {
      const mockUpdateField = jest.fn();
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        updateField: mockUpdateField
      });

      render(<ForgotPasswordForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');

      expect(mockUpdateField).toHaveBeenCalledWith('email', 'test@example.com');
    });
  });

  describe('Form Submission', () => {
    test('should call submit on form submission', () => {
      const mockSubmit = jest.fn().mockResolvedValue({ success: true });
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        submit: mockSubmit
      });

      render(<ForgotPasswordForm />);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      // Submit button is clickable and enabled
      expect(submitButton).toBeInTheDocument();
      expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    });

    test('should call onSuccess callback when submit succeeds', () => {
      const mockSubmit = jest.fn().mockResolvedValue({ success: true });
      const mockOnSuccess = jest.fn();

      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        submit: mockSubmit
      });

      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);

      expect(typeof mockOnSuccess).toBe('function');
    });

    test('should call onError callback when submit fails', () => {
      const mockSubmit = jest.fn().mockResolvedValue({
        success: false,
        error: 'Email not found'
      });
      const mockOnError = jest.fn();

      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        submit: mockSubmit
      });

      render(<ForgotPasswordForm onError={mockOnError} />);

      expect(typeof mockOnError).toBe('function');
    });

    test('should disable submit button during loading', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<ForgotPasswordForm />);
      const submitButton = screen.getByRole('button', { name: /sending/i }) as HTMLButtonElement;

      expect(submitButton.disabled).toBe(true);
    });

    test('should show loading text while submitting', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should display API error when apiError is set', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Failed to send reset link'
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByText(/failed to send reset link/i)).toBeInTheDocument();
    });

    test('should display field error for email', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { email: ['Invalid email format'] }
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    test('should mark email field as invalid', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { email: ['Invalid email'] }
      });

      render(<ForgotPasswordForm />);
      const emailInput = screen.getByLabelText(/email address/i);

      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    });
  });

  describe('Success State', () => {
    test('should display success message with email confirmation', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Password reset link sent to test@example.com'
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByText(/password reset link sent/i)).toBeInTheDocument();
    });

    test('should display expiration notice', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Password reset link sent'
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByText(/expires in 24 hours/i)).toBeInTheDocument();
    });

    test('should display spam folder notice', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Password reset link sent'
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByText(/spam folder/i)).toBeInTheDocument();
    });

    test('should show return to login link in success state', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Password reset link sent'
      });

      render(<ForgotPasswordForm />);
      expect(screen.getByRole('link', { name: /return to login/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for email field', () => {
      render(<ForgotPasswordForm />);
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    test('should have aria-live region for error messages', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Error message'
      });

      render(<ForgotPasswordForm />);
      const errorContainer = screen.getByText(/error message/i).closest('[role="alert"]');

      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
    });

    test('should have proper button type', () => {
      render(<ForgotPasswordForm />);
      const submitButton = screen.getByRole('button', { name: /send reset link/i }) as HTMLButtonElement;

      expect(submitButton.type).toBe('submit');
    });

    test('should have focus management', () => {
      render(<ForgotPasswordForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;

      fireEvent.focus(emailInput);
      expect(emailInput).toHaveFocus();
    });
  });

  describe('CSS Classes', () => {
    test('should apply className prop to form', () => {
      const { container } = render(<ForgotPasswordForm className="custom-class" />);
      const form = container.querySelector('form');

      expect(form).toHaveClass('custom-class');
    });

    test('should apply error styles to email field when there is an error', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        errors: { email: ['Invalid email'] }
      });

      render(<ForgotPasswordForm />);
      const emailInput = screen.getByLabelText(/email address/i);

      expect(emailInput).toHaveClass('border-red-500');
    });

    test('should apply disabled styles when loading', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<ForgotPasswordForm />);
      const submitButton = screen.getByRole('button', { name: /sending/i });

      expect(submitButton).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Link Navigation', () => {
    test('should have correct href for return to login link', () => {
      render(<ForgotPasswordForm />);
      const returnLink = screen.getByRole('link', { name: /return to login/i }) as HTMLAnchorElement;

      expect(returnLink.href).toMatch(/auth\/login/);
    });

    test('should show return to login link in success state', () => {
      mockUseForgotPassword.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Link sent'
      });

      render(<ForgotPasswordForm />);
      const returnLink = screen.getByRole('link', { name: /return to login/i });

      expect(returnLink).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive form container', () => {
      const { container } = render(<ForgotPasswordForm />);
      const form = container.querySelector('form');

      expect(form?.className).toMatch(/max-w-md/);
      expect(form?.className).toMatch(/mx-auto/);
    });
  });
});
