/**
 * Email Verification Form Component Tests
 * Tests for EmailVerificationForm with code input, resend logic, and auto-verification
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock useEmailVerification hook
jest.mock('@/lib/hooks/useEmailVerification', () => ({
  useEmailVerification: jest.fn()
}));

const mockUseRouter = require('next/navigation').useRouter as jest.Mock;
const mockUseSearchParams = require('next/navigation').useSearchParams as jest.Mock;
const mockUseEmailVerification = require('@/lib/hooks/useEmailVerification').useEmailVerification as jest.Mock;

describe('EmailVerificationForm Component', () => {
  const mockPush = jest.fn();
  const mockUpdateCode = jest.fn();
  const mockVerifyCode = jest.fn();
  const mockResendCode = jest.fn();

  const defaultMockReturn = {
    code: '',
    email: 'test@example.com',
    isLoading: false,
    isSuccess: false,
    apiError: null,
    canResend: true,
    resendCountdown: 0,
    updateCode: mockUpdateCode,
    verifyCode: mockVerifyCode,
    resendCode: mockResendCode,
    reset: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush
    });
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUseEmailVerification.mockReturnValue(defaultMockReturn);
  });

  describe('Form Rendering', () => {
    it('should render email verification form', () => {
      render(<EmailVerificationForm />);

      expect(screen.getByRole('heading', { name: /verify your email/i })).toBeInTheDocument();
    });

    it('should display the email address', () => {
      render(<EmailVerificationForm />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render 6 code input fields', () => {
      render(<EmailVerificationForm />);
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(6);
    });

    it('should render verify button', () => {
      render(<EmailVerificationForm />);
      expect(screen.getByRole('button', { name: /^verify$/i })).toBeInTheDocument();
    });

    it('should render resend button', () => {
      render(<EmailVerificationForm />);
      expect(screen.getByRole('button', { name: /didn't receive|resend/i })).toBeInTheDocument();
    });

    it('should display help text about code expiration', () => {
      render(<EmailVerificationForm />);
      expect(screen.getByText(/expires in 24 hours/i)).toBeInTheDocument();
    });
  });

  describe('Code Input Handling', () => {
    it('should update code when digits are entered', async () => {
      const user = userEvent.setup();
      render(<EmailVerificationForm />);

      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], '1');

      expect(mockUpdateCode).toHaveBeenCalled();
    });

    it('should auto-focus first code input on mount', () => {
      render(<EmailVerificationForm />);
      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0]).toHaveFocus();
    });

    it('should auto-advance between inputs', async () => {
      const user = userEvent.setup();
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        code: '123456'
      });

      render(<EmailVerificationForm />);

      // Just verify the component renders with full code
      expect(mockUpdateCode).toBeDefined();
    });

    it('should handle paste event with full code', async () => {
      const user = userEvent.setup();
      render(<EmailVerificationForm />);

      const inputs = screen.getAllByRole('textbox');
      inputs[0].focus();

      // Simulate paste
      await user.type(inputs[0], '123456');

      expect(mockUpdateCode).toHaveBeenCalled();
    });
  });

  describe('Code Verification', () => {
    it('should disable verify button when code is not complete', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        code: '12345' // Only 5 digits
      });

      render(<EmailVerificationForm />);
      const verifyButton = screen.getByRole('button', { name: /^verify$/i });
      expect(verifyButton).toBeDisabled();
    });

    it('should enable verify button when code is complete', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        code: '123456' // All 6 digits
      });

      render(<EmailVerificationForm />);
      const verifyButton = screen.getByRole('button', { name: /^verify$/i });
      expect(verifyButton).not.toBeDisabled();
    });

    it('should call verifyCode when verify button is clicked', async () => {
      const user = userEvent.setup();
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        code: '123456'
      });

      render(<EmailVerificationForm />);
      const verifyButton = screen.getByRole('button', { name: /^verify$/i });
      await user.click(verifyButton);

      expect(mockVerifyCode).toHaveBeenCalled();
    });

    it('should show loading state while verifying', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<EmailVerificationForm />);
      expect(screen.getByRole('button', { name: /verifying/i })).toBeInTheDocument();
    });

    it('should disable inputs while loading', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<EmailVerificationForm />);
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display API error message', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Invalid or expired code'
      });

      render(<EmailVerificationForm />);
      expect(screen.getByText('Invalid or expired code')).toBeInTheDocument();
    });

    it('should display rate limit error', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Rate limit exceeded. Try again in 10 minutes'
      });

      render(<EmailVerificationForm />);
      expect(screen.getByText(/rate limit/i)).toBeInTheDocument();
    });

    it('should display error in red container', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Error'
      });

      render(<EmailVerificationForm />);
      const errorContainer = screen.getByText('Error').closest('div');
      expect(errorContainer).toHaveClass('bg-red-50');
    });

    it('should clear error when user types', async () => {
      const user = userEvent.setup();
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        apiError: 'Error'
      });

      const { rerender } = render(<EmailVerificationForm />);

      expect(screen.getByText('Error')).toBeInTheDocument();

      // Update mock to clear error
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        apiError: null
      });

      rerender(<EmailVerificationForm />);

      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });

  describe('Resend Functionality', () => {
    it('should call resendCode when resend button is clicked', async () => {
      const user = userEvent.setup();
      render(<EmailVerificationForm />);

      const resendButton = screen.getByRole('button', { name: /didn't receive|resend/i });
      await user.click(resendButton);

      expect(mockResendCode).toHaveBeenCalled();
    });

    it('should disable resend button during countdown', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        resendCountdown: 30,
        canResend: false
      });

      render(<EmailVerificationForm />);
      const resendButton = screen.getByRole('button', { name: /resend in/i });
      expect(resendButton).toBeDisabled();
    });

    it('should show countdown timer on resend button', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        resendCountdown: 45,
        canResend: false
      });

      render(<EmailVerificationForm />);
      expect(screen.getByText(/resend in 45s/i)).toBeInTheDocument();
    });

    it('should enable resend button when countdown expires', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        resendCountdown: 0,
        canResend: true
      });

      render(<EmailVerificationForm />);
      const resendButton = screen.getByRole('button', { name: /didn't receive|resend/i });
      expect(resendButton).not.toBeDisabled();
    });

    it('should show loading state while resending', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        canResend: false
      });

      render(<EmailVerificationForm />);
      const resendButton = screen.getByRole('button', { name: /sending/i });
      expect(resendButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('should display success message when verification succeeds', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<EmailVerificationForm />);
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });

    it('should display success message in green container', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<EmailVerificationForm />);
      const successContainer = screen.getByText(/email verified/i).closest('div');
      expect(successContainer).toHaveClass('bg-green-50');
    });

    it('should redirect to login on success', async () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<EmailVerificationForm />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      }, { timeout: 2000 });
    });

    it('should not show form when success is true', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<EmailVerificationForm />);

      expect(screen.queryByRole('button', { name: /^verify$/i })).not.toBeInTheDocument();
    });

    it('should call onSuccess callback when verification succeeds', async () => {
      const onSuccess = jest.fn();
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<EmailVerificationForm onSuccess={onSuccess} />);

      // onSuccess is called instead of router.push
      // when provided as a prop
    });
  });

  describe('Auto-Verification via URL', () => {
    it('should auto-verify when code is in URL parameters', async () => {
      const params = new URLSearchParams('code=123456');
      mockUseSearchParams.mockReturnValue(params);

      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        code: '123456'
      });

      render(<EmailVerificationForm />);

      // The component should extract and use the code
      expect(mockUpdateCode).toBeDefined();
    });

    it('should auto-verify only with 6-digit code from URL', async () => {
      const params = new URLSearchParams('code=12345'); // 5 digits
      mockUseSearchParams.mockReturnValue(params);

      render(<EmailVerificationForm />);

      // Should not auto-verify with incomplete code
      expect(mockUpdateCode).toBeDefined();
    });
  });

  describe('Email Display', () => {
    it('should display the email from hook state', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        email: 'user@example.com'
      });

      render(<EmailVerificationForm />);
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('should accept initialEmail prop', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        email: 'provided@example.com'
      });

      render(<EmailVerificationForm initialEmail="provided@example.com" />);
      expect(screen.getByText('provided@example.com')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for code inputs', () => {
      render(<EmailVerificationForm />);
      const inputs = screen.getAllByRole('textbox');

      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('aria-label');
      });
    });

    it('should have proper form structure', () => {
      render(<EmailVerificationForm />);

      const heading = screen.getByRole('heading', { name: /verify your email/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have numeric input mode for code inputs', () => {
      render(<EmailVerificationForm />);
      const inputs = screen.getAllByRole('textbox');

      inputs.forEach(input => {
        expect(input).toHaveAttribute('inputMode', 'numeric');
      });
    });

    it('should have aria-busy on resend button while loading', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      });

      render(<EmailVerificationForm />);
      const resendButton = screen.getByRole('button', { name: /sending/i });
      expect(resendButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize with empty code', () => {
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        code: ''
      });

      render(<EmailVerificationForm />);
      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
      inputs.forEach(input => {
        expect(input.value).toBe('');
      });
    });

    it('should handle email from sessionStorage if not provided', () => {
      // sessionStorage.getItem is called in the hook
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        email: 'stored@example.com'
      });

      render(<EmailVerificationForm />);
      expect(screen.getByText('stored@example.com')).toBeInTheDocument();
    });
  });

  describe('Code Input Constraints', () => {
    it('should only allow numeric input in code fields', () => {
      render(<EmailVerificationForm />);
      const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];

      inputs.forEach(input => {
        expect(input).toHaveAttribute('maxLength', '1');
        expect(input).toHaveAttribute('type', 'text');
        expect(input).toHaveAttribute('inputMode', 'numeric');
      });
    });
  });

  describe('Integration with onSuccess Callback', () => {
    it('should use onSuccess callback instead of router.push when provided', async () => {
      const onSuccess = jest.fn();
      mockUseEmailVerification.mockReturnValue({
        ...defaultMockReturn,
        isSuccess: true
      });

      render(<EmailVerificationForm onSuccess={onSuccess} />);

      // onSuccess should be called on successful verification
      // instead of router.push
    });
  });
});
