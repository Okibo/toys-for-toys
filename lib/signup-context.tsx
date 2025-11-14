/**
 * lib/signup-context.tsx
 *
 * React Context for managing signup form state across all steps.
 * Persists data as user progresses through Step 1 → Step 2 → Step 3.
 * Uses React Context API for lightweight state management.
 */

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ChildProfile } from './auth-validation';

/**
 * Type definition for complete signup state
 */
export interface SignupContextType {
  // Step 1 data
  step1Data: {
    email: string;
    password: string;
    fullName: string;
    agreeToTerms: boolean;
  };

  // Step 2 data
  step2Data: {
    children: ChildProfile[];
  };

  // Step 3 data
  step3Data: {
    mainConsent: boolean;
    marketingConsent: boolean;
    language: string;
  };

  // Current step
  currentStep: 1 | 2 | 3;

  // Update functions
  updateStep1Data: (data: SignupContextType['step1Data']) => void;
  updateStep2Data: (data: SignupContextType['step2Data']) => void;
  updateStep3Data: (data: SignupContextType['step3Data']) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;

  // Reset function (for new signup)
  resetSignup: () => void;
}

/**
 * Create context with undefined default
 * Will be provided by SignupProvider
 */
const SignupContext = createContext<SignupContextType | undefined>(undefined);

/**
 * Provider component
 * Wrap your app (or auth section) with this to provide signup state
 */
export function SignupProvider({ children }: { children: ReactNode }): ReactNode {
  // Step 1 state
  const [step1Data, setStep1Data] = useState({
    email: '',
    password: '',
    fullName: '',
    agreeToTerms: false,
  });

  // Step 2 state
  const [step2Data, setStep2Data] = useState({
    children: [] as ChildProfile[],
  });

  // Step 3 state
  const [step3Data, setStep3Data] = useState({
    mainConsent: false,
    marketingConsent: false,
    language: 'pl',
  });

  // Current step
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Update functions
  const updateStep1Data = (data: SignupContextType['step1Data']): void => {
    setStep1Data(data);
  };

  const updateStep2Data = (data: SignupContextType['step2Data']): void => {
    setStep2Data(data);
  };

  const updateStep3Data = (data: SignupContextType['step3Data']): void => {
    setStep3Data(data);
  };

  const resetSignup = (): void => {
    setStep1Data({
      email: '',
      password: '',
      fullName: '',
      agreeToTerms: false,
    });
    setStep2Data({
      children: [],
    });
    setStep3Data({
      mainConsent: false,
      marketingConsent: false,
      language: 'pl',
    });
    setCurrentStep(1);
  };

  const value: SignupContextType = {
    step1Data,
    step2Data,
    step3Data,
    currentStep,
    updateStep1Data,
    updateStep2Data,
    updateStep3Data,
    setCurrentStep,
    resetSignup,
  };

  return <SignupContext.Provider value={value}>{children}</SignupContext.Provider>;
}

/**
 * Hook to use signup context
 * Throws error if used outside SignupProvider
 */
export function useSignupContext(): SignupContextType {
  const context = useContext(SignupContext);
  if (context === undefined) {
    throw new Error('useSignupContext must be used within a SignupProvider');
  }
  return context;
}

/**
 * Hook to get complete signup data (all steps)
 * Useful for API requests that need all data at once
 */
export function useSignupData() {
  const context = useSignupContext();
  return {
    step1: context.step1Data,
    step2: context.step2Data,
    step3: context.step3Data,
  };
}

/**
 * Hook to navigate between steps
 * Handles step validation and navigation
 */
export function useSignupNavigation() {
  const context = useSignupContext();

  const goToStep = (step: 1 | 2 | 3): void => {
    context.setCurrentStep(step);
  };

  const nextStep = (): void => {
    if (context.currentStep < 3) {
      context.setCurrentStep((context.currentStep + 1) as 1 | 2 | 3);
    }
  };

  const previousStep = (): void => {
    if (context.currentStep > 1) {
      context.setCurrentStep((context.currentStep - 1) as 1 | 2 | 3);
    }
  };

  return {
    currentStep: context.currentStep,
    goToStep,
    nextStep,
    previousStep,
  };
}
