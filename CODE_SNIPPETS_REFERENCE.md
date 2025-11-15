# Code Snippets Reference - P1-W1-AUTH-002

## Quick Reference Guide for Implementation

### Using ConsentForm Component

```typescript
// In a page or parent component
import ConsentForm from '@/components/auth/ConsentForm';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const router = useRouter();

  return (
    <ConsentForm
      onSuccess={() => router.push('/dashboard')}
      onDecline={() => router.push('/auth/login')}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Using PrivacySettings Component

```typescript
// In account settings page
import PrivacySettings from '@/components/account/PrivacySettings';

export default function PrivacySettingsPage() {
  return (
    <div className="container">
      <PrivacySettings
        userId={currentUserId}
        onWithdraw={() => {
          // Perform additional actions after withdrawal
          console.log('Analytics consent withdrawn');
        }}
      />
    </div>
  );
}
```

### Using useConsent Hook

```typescript
import { useConsent } from '@/lib/hooks/useConsent';

function MyComponent() {
  const {
    formState,
    errors,
    isLoading,
    isSuccess,
    apiError,
    updateField,
    submit
  } = useConsent();

  const handleCheckboxChange = (field) => {
    updateField(field, !formState[field]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <input
          type="checkbox"
          checked={formState.privacy_policy}
          onChange={() => handleCheckboxChange('privacy_policy')}
        />
        Accept Privacy Policy
      </label>
      {errors.privacy_policy && <p>{errors.privacy_policy}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>

      {apiError && <p className="error">{apiError}</p>}
      {isSuccess && <p className="success">Consent recorded!</p>}
    </form>
  );
}
```

### Using useConsentStatus Hook

```typescript
import { useConsentStatus } from '@/lib/hooks/useConsentStatus';

function ConsentDisplay() {
  const { consentStatus, isLoading, error, refetch } = useConsentStatus();

  if (isLoading) return <div>Loading consent status...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!consentStatus) return <div>No consent found</div>;

  return (
    <div>
      <p>Privacy Policy: {consentStatus.privacy_policy ? 'Accepted' : 'Not Accepted'}</p>
      <p>Terms: {consentStatus.terms_of_service ? 'Accepted' : 'Not Accepted'}</p>
      <p>Analytics: {consentStatus.behavioral_analytics ? 'Accepted' : 'Not Accepted'}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Using useConsentWithdrawal Hook

```typescript
import { useConsentWithdrawal } from '@/lib/hooks/useConsentWithdrawal';

function WithdrawalButton() {
  const { isLoading, isSuccess, error, withdraw } = useConsentWithdrawal();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleWithdraw = async () => {
    await withdraw('behavioral_analytics');
    setShowConfirm(false);
  };

  return (
    <div>
      {isSuccess && <p className="success">Consent withdrawn successfully</p>}
      {error && <p className="error">{error}</p>}

      {!isSuccess && (
        <>
          <button onClick={() => setShowConfirm(true)} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Withdraw Analytics Consent'}
          </button>

          {showConfirm && (
            <div className="modal">
              <p>Are you sure you want to withdraw analytics consent?</p>
              <button onClick={handleWithdraw}>Confirm</button>
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Loading Legal Documents

```typescript
import { loadDocument, preloadDocuments } from '@/lib/legal/document-loader';

// Load single document
const termsContent = await loadDocument('terms', 'en', '1.0');

// Load all documents for language
const allDocs = await loadDocument('privacy', 'pl', '1.0');

// Preload for performance
await preloadDocuments('de');

// Get cache stats
const stats = getCacheStats();
console.log(`Cache size: ${stats.size} documents`);
```

### Rendering Markdown Documents

```typescript
import { parseMarkdown, extractTableOfContents } from '@/lib/legal/markdown-renderer';

// Parse markdown to HTML
const result = parseMarkdown(markdownContent);
// result.html - HTML string
// result.headings - Array of headings with IDs
// result.links - Array of links

// Get table of contents
const toc = extractTableOfContents(markdownContent);

// Convert to plain text
const plainText = markdownToPlainText(markdownContent);

// Get summary
const summary = extractSummary(markdownContent, 200);
```

### Type Definitions Usage

```typescript
import type {
  ConsentFormState,
  ConsentRecord,
  UseConsentReturn,
  ConsentRequest,
  ConsentResponse
} from '@/lib/auth/consent-types';

// Use in component props
interface MyComponentProps {
  initialState?: ConsentFormState;
  onConsent?: (record: ConsentRecord) => void;
}

// Use in API calls
const submitConsent = async (data: ConsentRequest): Promise<ConsentResponse> => {
  const response = await fetch('/api/auth/consent', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### Testing Examples

```typescript
// Testing ConsentForm
import { render, screen, fireEvent } from '@testing-library/react';
import ConsentForm from '@/components/auth/ConsentForm';

test('submit button disabled until required fields checked', () => {
  render(<ConsentForm />);
  const submitBtn = screen.getByRole('button', { name: /accept/i });
  expect(submitBtn).toBeDisabled();

  const privacyCheckbox = screen.getByLabelText(/privacy policy/i);
  fireEvent.click(privacyCheckbox);

  const termsCheckbox = screen.getByLabelText(/terms of service/i);
  fireEvent.click(termsCheckbox);

  expect(submitBtn).not.toBeDisabled();
});

// Testing useConsent hook
import { renderHook, act } from '@testing-library/react';
import { useConsent } from '@/lib/hooks/useConsent';

test('updateField clears errors', () => {
  const { result } = renderHook(() => useConsent());

  act(() => {
    result.current.validateForm();
  });

  expect(result.current.errors.privacy_policy).toBeDefined();

  act(() => {
    result.current.updateField('privacy_policy', true);
  });

  expect(result.current.errors.privacy_policy).toBeUndefined();
});
```

### Integration Example

```typescript
// Complete signup flow example
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SignupForm from '@/components/auth/SignupForm';
import EmailVerificationForm from '@/components/auth/EmailVerificationForm';
import ConsentForm from '@/components/auth/ConsentForm';

type SignupStep = 'signup' | 'verify' | 'consent' | 'complete';

export default function SignupFlow() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('signup');

  return (
    <div>
      {step === 'signup' && (
        <SignupForm onSuccess={() => setStep('verify')} />
      )}

      {step === 'verify' && (
        <EmailVerificationForm onSuccess={() => setStep('consent')} />
      )}

      {step === 'consent' && (
        <ConsentForm
          onSuccess={() => {
            setStep('complete');
            router.push('/dashboard');
          }}
          onDecline={() => setStep('signup')}
        />
      )}

      {step === 'complete' && (
        <div>Setup complete! Redirecting...</div>
      )}
    </div>
  );
}
```

### Styling Examples

```typescript
// Using Tailwind CSS with ConsentForm
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
  <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
    <ConsentForm />
  </div>
</div>

// Custom styling for components
<div className="consent-container dark:bg-gray-900">
  <PrivacySettings className="privacy-settings-custom" />
</div>
```

### Error Handling Examples

```typescript
// Global error boundary for consent flows
class ConsentErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Consent error:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong with consent</h1>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// API error handling
const handleConsentError = (error) => {
  if (error.response?.status === 400) {
    console.error('Validation error:', error.response.data);
  } else if (error.response?.status === 401) {
    console.error('Unauthorized - redirect to login');
  } else if (error.response?.status === 500) {
    console.error('Server error - try again later');
  } else {
    console.error('Network error:', error.message);
  }
};
```

### Performance Optimization Examples

```typescript
// Memoize ConsentForm to prevent unnecessary re-renders
import { memo } from 'react';

const ConsentForm = memo(function ConsentForm(props) {
  // Component code
});

// Lazy load PrivacySettings
import { lazy, Suspense } from 'react';

const PrivacySettings = lazy(() => import('@/components/account/PrivacySettings'));

function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrivacySettings />
    </Suspense>
  );
}

// Preload documents for performance
import { preloadDocuments } from '@/lib/legal/document-loader';

useEffect(() => {
  preloadDocuments('en'); // Preload when user navigates to consent page
}, []);
```

### i18n Integration Examples

```typescript
// Using next-intl or i18next
import { useTranslations } from 'next-intl';

function ConsentForm() {
  const t = useTranslations('consent');

  return (
    <form>
      <h1>{t('title')}</h1>
      <label>
        <input type="checkbox" />
        {t('privacy_policy')}
      </label>
      <button>{t('submit')}</button>
    </form>
  );
}

// Date formatting for i18n
const formatDate = (date, locale) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

console.log(formatDate(new Date(), 'en-US')); // "January 15, 2024"
console.log(formatDate(new Date(), 'pl-PL')); // "15 stycznia 2024"
console.log(formatDate(new Date(), 'de-DE')); // "15. Januar 2024"
```

---

## File Paths for Copy-Paste

```
Component Imports:
import ConsentForm from '@/components/auth/ConsentForm';
import PrivacySettings from '@/components/account/PrivacySettings';

Hook Imports:
import { useConsent } from '@/lib/hooks/useConsent';
import { useConsentStatus } from '@/lib/hooks/useConsentStatus';
import { useConsentWithdrawal } from '@/lib/hooks/useConsentWithdrawal';

Type Imports:
import type { ConsentFormState, ConsentRecord } from '@/lib/auth/consent-types';

Utility Imports:
import { loadDocument } from '@/lib/legal/document-loader';
import { parseMarkdown } from '@/lib/legal/markdown-renderer';
```

---

## API Request Examples

### POST /api/auth/consent
```bash
curl -X POST http://localhost:3000/api/auth/consent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "privacy_policy": true,
    "terms_of_service": true,
    "behavioral_analytics": true
  }'
```

### GET /api/auth/consent/status
```bash
curl -X GET http://localhost:3000/api/auth/consent/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/auth/consent/withdraw
```bash
curl -X POST http://localhost:3000/api/auth/consent/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "consent_type": "behavioral_analytics"
  }'
```

---

**For more details, see:**
- IMPLEMENTATION_SUMMARY_P1_W1_AUTH_002.md
- FRONTEND_IMPLEMENTATION_COMPLETE.md
- CONSENT_IMPLEMENTATION_CHECKLIST.md
