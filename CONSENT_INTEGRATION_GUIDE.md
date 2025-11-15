# Consent API Integration Guide

## Quick Start

The consent API provides three endpoints for GDPR-compliant user consent management:

- **POST** `/api/auth/consent` - Record user consent decisions
- **GET** `/api/auth/consent-status` - Retrieve consent history
- **POST** `/api/auth/consent-withdraw` - Withdraw analytics consent

All endpoints require JWT authentication via the `Authorization` header.

## Authentication

All requests must include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

The token should be obtained from Supabase authentication and must be the user's valid session token.

## 1. Recording Consent (POST /api/auth/consent)

### Purpose
Records a user's consent decisions for privacy policy, terms of service, and optionally behavioral analytics.

### Request

```typescript
POST /api/auth/consent
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "privacy_policy": true,
  "terms_of_service": true,
  "behavioral_analytics": true  // optional, defaults to false
}
```

### Response (Success - 200)

```typescript
{
  "success": true,
  "message": "Consent recorded successfully. 3 consent records created."
}
```

### Response (Error Examples)

**Invalid Payload (400)**:
```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Consent payload validation failed",
    "details": ["privacy_policy must be true to proceed"]
  }
}
```

**Unauthorized (401)**:
```typescript
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User is not authenticated. Please login first.",
    "details": ["Valid JWT token required in Authorization header"]
  }
}
```

**Already Recorded (409)**:
```typescript
{
  "success": false,
  "error": {
    "code": "ALREADY_RECORDED",
    "message": "User has already recorded consent",
    "details": ["Consent can only be recorded once. To change preferences, use the withdrawal endpoint."]
  }
}
```

**Rate Limited (429)**:
```typescript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many consent submissions. Please try again later.",
    "details": ["Reset in 847 seconds"]
  }
}
```

### Frontend Example

```typescript
async function recordConsent(token: string) {
  const response = await fetch('/api/auth/consent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      privacy_policy: true,
      terms_of_service: true,
      behavioral_analytics: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Consent recording failed:', error);
    return false;
  }

  const data = await response.json();
  console.log('Consent recorded:', data.message);
  return true;
}
```

### Validation Rules

- `privacy_policy`: Required, must be `true`
- `terms_of_service`: Required, must be `true`
- `behavioral_analytics`: Optional boolean (defaults to `false`)

Users must agree to both privacy policy and terms of service to proceed. Behavioral analytics is optional.

## 2. Retrieving Consent History (GET /api/auth/consent-status)

### Purpose
Retrieves the complete consent history for the authenticated user, including all active and withdrawn consents.

### Request

```typescript
GET /api/auth/consent-status
Authorization: Bearer <jwt-token>
```

### Response (Success - 200)

```typescript
{
  "success": true,
  "consent_records": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user-id-123",
      "consent_type": "privacy_policy",
      "consent_given": true,
      "timestamp": "2024-11-15T12:00:00.000Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "withdrawn_at": null  // null for active consents
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "user-id-123",
      "consent_type": "behavioral_analytics",
      "consent_given": false,
      "timestamp": "2024-11-15T12:00:00.000Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "withdrawn_at": "2024-11-15T13:00:00.000Z"  // withdrawal timestamp
    }
  ]
}
```

### Response (Error Examples)

**Unauthorized (401)**:
```typescript
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User is not authenticated. Please login first.",
    "details": ["Valid JWT token required in Authorization header"]
  }
}
```

**Server Error (500)**:
```typescript
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An error occurred while retrieving consent records. Please try again later."
  }
}
```

### Frontend Example

```typescript
async function getConsentHistory(token: string) {
  const response = await fetch('/api/auth/consent-status', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to retrieve consent:', error);
    return null;
  }

  const data = await response.json();

  // Check current consent status
  const analytics = data.consent_records.find(
    r => r.consent_type === 'behavioral_analytics' && !r.withdrawn_at
  );
  console.log('Analytics enabled:', analytics?.consent_given ?? false);

  return data.consent_records;
}
```

### Data Fields

- `id`: UUID of consent record
- `user_id`: ID of user who gave consent
- `consent_type`: One of `privacy_policy`, `terms_of_service`, `behavioral_analytics`
- `consent_given`: Boolean indicating if consent was given (true) or declined (false)
- `timestamp`: ISO 8601 timestamp when consent decision was made
- `ip_address`: IP address for audit trail (null if anonymized)
- `user_agent`: Browser/device information for audit trail
- `withdrawn_at`: ISO 8601 timestamp if consent was withdrawn (null if active)

## 3. Withdrawing Consent (POST /api/auth/consent-withdraw)

### Purpose
Allows users to withdraw consent for behavioral analytics. Privacy policy and terms of service consents cannot be withdrawn as they are mandatory.

### Request

```typescript
POST /api/auth/consent-withdraw
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "consent_type": "behavioral_analytics"
}
```

### Response (Success - 200)

```typescript
{
  "success": true,
  "message": "Consent withdrawn successfully for behavioral_analytics",
  "new_record": {
    "consent_type": "behavioral_analytics",
    "consent_given": false,
    "withdrawn_at": "2024-11-15T13:00:00.000Z"
  }
}
```

### Response (Error Examples)

**Invalid Type (400)**:
```typescript
{
  "success": false,
  "error": {
    "code": "INVALID_TYPE",
    "message": "Request validation failed",
    "details": ["consent_type must be one of: privacy_policy, terms_of_service, behavioral_analytics"]
  }
}
```

**Cannot Withdraw (409)**:
```typescript
{
  "success": false,
  "error": {
    "code": "CANNOT_WITHDRAW",
    "message": "This consent type cannot be withdrawn",
    "details": ["Only behavioral_analytics consent can be withdrawn. Privacy policy and terms of service are required."]
  }
}
```

**Not Found (404)**:
```typescript
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No active consent record found for this type",
    "details": ["User must have given consent before it can be withdrawn."]
  }
}
```

**Unauthorized (401)**:
```typescript
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User is not authenticated. Please login first."
  }
}
```

**Rate Limited (429)**:
```typescript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many withdrawal attempts. Please try again later.",
    "details": ["Reset in 3600 seconds"]
  }
}
```

### Frontend Example

```typescript
async function withdrawAnalyticsConsent(token: string) {
  const response = await fetch('/api/auth/consent-withdraw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      consent_type: 'behavioral_analytics',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Withdrawal failed:', error.error.message);
    return false;
  }

  const data = await response.json();
  console.log('Consent withdrawn at:', data.new_record.withdrawn_at);
  return true;
}
```

### Valid Consent Types

- `behavioral_analytics` - Withdrawable (optional consent)
- `privacy_policy` - NOT withdrawable (mandatory consent)
- `terms_of_service` - NOT withdrawable (mandatory consent)

## Complete Example: Consent Flow

```typescript
async function handleConsentFlow(token: string) {
  try {
    // 1. Record initial consent
    console.log('Recording consent...');
    const recordResponse = await fetch('/api/auth/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        privacy_policy: true,
        terms_of_service: true,
        behavioral_analytics: true,
      }),
    });

    if (!recordResponse.ok) {
      const error = await recordResponse.json();
      throw new Error(`Recording failed: ${error.error.message}`);
    }
    console.log('✓ Consent recorded');

    // 2. Retrieve consent history
    console.log('Retrieving consent history...');
    const statusResponse = await fetch('/api/auth/consent-status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!statusResponse.ok) {
      const error = await statusResponse.json();
      throw new Error(`Status check failed: ${error.error.message}`);
    }

    const { consent_records } = await statusResponse.json();
    console.log(`✓ Retrieved ${consent_records.length} consent records`);

    // Show current preferences
    consent_records.forEach(record => {
      if (!record.withdrawn_at) {
        console.log(`  - ${record.consent_type}: ${record.consent_given ? 'given' : 'declined'}`);
      }
    });

    // 3. Later, user decides to withdraw analytics consent
    console.log('Withdrawing analytics consent...');
    const withdrawResponse = await fetch('/api/auth/consent-withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        consent_type: 'behavioral_analytics',
      }),
    });

    if (!withdrawResponse.ok) {
      const error = await withdrawResponse.json();
      throw new Error(`Withdrawal failed: ${error.error.message}`);
    }

    const { new_record } = await withdrawResponse.json();
    console.log(`✓ Analytics consent withdrawn at ${new_record.withdrawn_at}`);

    return true;
  } catch (error) {
    console.error('Consent flow error:', error);
    return false;
  }
}
```

## HTTP Status Codes

| Endpoint | Success | Errors |
|----------|---------|--------|
| POST /consent | 200 | 400, 401, 409, 429, 500 |
| GET /consent-status | 200 | 401, 500 |
| POST /consent-withdraw | 200 | 400, 401, 404, 409, 429, 500 |

## Rate Limiting

Requests are rate-limited to prevent abuse:

- **POST /consent**: 5 attempts per 15 minutes per user
- **POST /consent-withdraw**: 10 attempts per 1 hour per user
- **GET /consent-status**: No rate limit (read-only)

Rate limit headers are included in 429 responses:
- `X-RateLimit-Limit`: Maximum attempts allowed
- `X-RateLimit-Remaining`: Attempts remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying

## GDPR Compliance

The consent system ensures GDPR compliance:

1. **Explicit Consent**: Users must explicitly agree to privacy policy and terms
2. **Audit Trail**: All decisions logged with timestamp, IP, and user agent
3. **Withdrawal Rights**: Users can withdraw analytics consent at any time
4. **User Control**: Consent history visible to user
5. **Immutable Records**: Consent decisions cannot be modified, only withdrawn
6. **Data Minimization**: Only collect necessary data
7. **User Isolation**: RLS policies prevent cross-user data access

## Error Handling Best Practices

```typescript
async function apiCall(endpoint: string, options: any) {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const error = await response.json();

      // Handle specific errors
      switch (error.error.code) {
        case 'UNAUTHORIZED':
          // Redirect to login
          window.location.href = '/auth/login';
          break;
        case 'RATE_LIMIT':
          // Show user retry-after value
          const retryAfter = response.headers.get('Retry-After');
          alert(`Please wait ${retryAfter} seconds before trying again`);
          break;
        case 'ALREADY_RECORDED':
          // Consent already exists, fetch history instead
          return getConsentHistory();
        default:
          // Generic error handling
          console.error(error.error.message);
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

## Testing

All endpoints have comprehensive test coverage:

```bash
# Run consent tests
npm test -- tests/api/auth-consent

# Run specific endpoint tests
npm test -- tests/api/auth-consent.test.ts
npm test -- tests/api/auth-consent-status.test.ts
npm test -- tests/api/auth-consent-withdraw.test.ts

# Run with coverage
npm test -- tests/api/auth-consent --coverage
```

Test results: 117 tests, 100% passing

## Troubleshooting

### "User is not authenticated"
- Ensure JWT token is valid and not expired
- Token should be in `Authorization: Bearer <token>` format
- Check token is from correct user account

### "Consent already recorded"
- User has already submitted initial consent
- Use GET endpoint to retrieve existing consent
- Use withdrawal endpoint to change analytics preference

### "Rate limit exceeded"
- Too many requests sent too quickly
- Wait for Retry-After seconds before retrying
- Space out requests appropriately

### "Cannot withdraw consent"
- Trying to withdraw privacy_policy or terms_of_service
- Only behavioral_analytics can be withdrawn
- Other consents are mandatory

### "No active consent found"
- Trying to withdraw consent that was never given
- Check consent history first with GET endpoint
- Must record consent before withdrawing

## Support

For issues or questions:
1. Check endpoint documentation above
2. Review test files for usage examples
3. Check error details in error responses
4. Review CONSENT_API_IMPLEMENTATION.md for architecture details
