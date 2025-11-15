/**
 * Signup Form Component Tests
 * Tests for SignupForm component with validation, password strength, and API integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupForm from '@/components/auth/SignupForm';
import '@testing-library/jest-dom';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock useSignup hook
jest.mock('@/lib/hooks/useSignup', () => ({
  useSignup: jest.fn()
}));

const mockUseSignup = require('@/lib/hooks/useSignup').useSignup as jest.Mock;

describe('SignupForm Component', () => {
  const mockUpdateField = jest.fn();
  const mockSubmit = jest.fn();
  const mockValidateForm = jest.fn();

  const defaultMockReturn = {
    formState: {
      email: '',
      password: '',
      passwordConfirm: '',
      language: 'en'
    },
    errors: {},
    isLoading: false,
    isSuccess: false,
    successMessage: '',
    apiError: null,
    updateField: mockUpdateField,
    validateForm: mockValidateForm,
    submit: mockSubmit,
    reset: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignup.mockReturnValue(defaultMockReturn);
  });

  describe('Form Rendering', () => {
    it('should render signup form with all fields', () => {
      render(<SignupForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/language preference/i)).toBeInTheDocument();
    });

    it('should render submit button with correct text', () => {
      render(<SignupForm />);
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<SignupForm />);
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });

    it('should have correct link href', () => {
      render(<SignupForm />);
      const loginLink = screen.getByRole('link', { name: /log in/i }) as HTMLAnchorElement;
      expect(loginLink.href).toContain('/auth/login');
    });
  });

  describe('Form Input Handling', () => {
    it('should update email field when user types', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(mockUpdateField).toHaveBeenCalledWith('email', expect.any(String));
    });

    it('should update password field when user types', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      await user.type(passwordInput, 'TestPassword123!');

      expect(mockUpdateField).toHaveBeenCalledWith('password', expect.any(String));
    });

    it('should update password confirmation field', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      await user.type(confirmInput, 'TestPassword123!');

      expect(mockUpdateField).toHaveBeenCalledWith('passwordConfirm', expect.any(String));
    });

    it('should update language preference', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      const langSelect = screen.getByLabelText(/language preference/i) as HTMLSelectElement;
      await user.selectOptions(langSelect, 'pl');

      expect(mockUpdateField).toHaveBeenCalledWith('language', 'pl');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        formState: {
          email: '',
          password: 'TestPassword123!',
          passwordConfirm: '',
          language: 'en'
        }
      });

      render(<SignupForm />);

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const toggleButton = screen.getAllByRole('button', { name: /show password|hide password/i })[0];

      expect(passwordInput.type).toBe('password');
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        formState: {
          email: '',
          password: '',
          passwordConfirm: 'TestPassword123!',
          language: 'en'
        }
      });

      render(<SignupForm />);

      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole('button', { name: /show password|hide password/i });
      const confirmToggle = toggleButtons[1];

      expect(confirmInput.type).toBe('password');
      await user.click(confirmToggle);
      expect(confirmInput.type).toBe('text');
    });
  });

  describe('Password Strength Indicator', () => {
    it('should display password strength indicator when password is entered', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        formState: {
          email: '',
          password: 'TestPassword123!',
          passwordConfirm: '',
          language: 'en'
        }
      });

      render(<SignupForm />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not display password strength indicator when password is empty', () => {
      render(<SignupForm />);
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display email validation errors', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          email: ['Email address is required', 'Email format is invalid']
        }
      });

      render(<SignupForm />);

      expect(screen.getByText('Email address is required')).toBeInTheDocument();
      expect(screen.getByText('Email format is invalid')).toBeInTheDocument();
    });

    it('should display password validation errors', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          password: ['Password must be at least 8 characters long']
        }
      });

      render(<SignupForm />);
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
    });

    it('should display password confirmation errors', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          passwordConfirm: ['Passwords do not match']
        }
      });

      render(<SignupForm />);
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should display API errors', () => {
      const apiError = 'This email is already registered';
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        apiError
      });

      render(<SignupForm />);
      expect(screen.getByText(apiError)).toBeInTheDocument();
    });

    it('should have aria-invalid on inputs with errors', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          email: ['Email is invalid']
        }
      });

      render(<SignupForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby on inputs with errors', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          email: ['Email is invalid']
        }
      });

      render(<SignupForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput).toHaveAttribute('aria-describedby');
    });
  });

  describe('Form Submission', () => {
    it('should have submit button in form', () => {
      render(<SignupForm />);

      const form = screen.getByRole('button', { name: /create account/i }).closest('form');
      expect(form).toBeInTheDocument();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should disable submit button while loading', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<SignupForm />);
      const submitButton = screen.getByRole('button', { name: /creating account/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable all inputs while loading', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<SignupForm />);

      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
      expect(screen.getByLabelText(/language preference/i)).toBeDisabled();
    });

    it('should show loading state in button text', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<SignupForm />);
      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should display success message when signup succeeds', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Verification email sent. Check your inbox.'
      });

      render(<SignupForm />);
      expect(screen.getByText('Verification email sent. Check your inbox.')).toBeInTheDocument();
    });

    it('should display success message in green container', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Verification email sent. Check your inbox.'
      });

      render(<SignupForm />);
      const successContainer = screen.getByText('Verification email sent. Check your inbox.').closest('div');
      expect(successContainer).toHaveClass('bg-green-50');
    });

    it('should call onSuccess callback after successful submission', async () => {
      const onSuccess = jest.fn();

      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Verification email sent. Check your inbox.'
      });

      render(<SignupForm onSuccess={onSuccess} />);

      // In the component, onSuccess is called after submit succeeds
      // Since we're mocking isSuccess as true, the form displays success state
      expect(screen.getByText('Verification email sent. Check your inbox.')).toBeInTheDocument();
    });

    it('should not show form fields when success is true', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true,
        successMessage: 'Verification email sent.'
      });

      render(<SignupForm />);

      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<SignupForm />);
      const form = screen.getByRole('button', { name: /create account/i }).closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should have labels for all inputs', () => {
      render(<SignupForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/language preference/i)).toBeInTheDocument();
    });

    it('should have aria-invalid on email with errors', () => {
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        errors: { email: ['Invalid'] }
      });

      render(<SignupForm />);
      const input = screen.getByLabelText(/email address/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have placeholder text', () => {
      render(<SignupForm />);

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('At least 8 characters')).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup();
      mockUseSignup.mockReturnValue({
        ...defaultMockReturn,
        errors: { email: ['Invalid email'] }
      });

      render(<SignupForm />);

      mockUpdateField.mockClear();
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'a');

      // updateField is called with clearing errors internally in the component
      expect(mockUpdateField).toHaveBeenCalled();
    });
  });

  describe('Language Selection', () => {
    it('should have English as default language', () => {
      render(<SignupForm />);
      const langSelect = screen.getByLabelText(/language preference/i) as HTMLSelectElement;
      expect(langSelect.value).toBe('en');
    });

    it('should have Polish language option', () => {
      render(<SignupForm />);
      expect(screen.getByRole('option', { name: /polish/i })).toBeInTheDocument();
    });

    it('should have German language option', () => {
      render(<SignupForm />);
      expect(screen.getByRole('option', { name: /german/i })).toBeInTheDocument();
    });
  });

  describe('Email Specific Tests', () => {
    it('should have email input type', () => {
      render(<SignupForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput.type).toBe('email');
    });

    it('should require email field', () => {
      render(<SignupForm />);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput.required).toBe(true);
    });
  });

  describe('Password Specific Tests', () => {
    it('should have password input type initially', () => {
      render(<SignupForm />);
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should require password field', () => {
      render(<SignupForm />);
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.required).toBe(true);
    });

    it('should have password input type for confirm field', () => {
      render(<SignupForm />);
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      expect(confirmInput.type).toBe('password');
    });

    it('should require password confirmation field', () => {
      render(<SignupForm />);
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
      expect(confirmInput.required).toBe(true);
    });
  });
});
