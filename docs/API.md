# Toy-for-Toy API Documentation

## Overview

The Toy-for-Toy API is built on **Next.js API Routes** (`/pages/api`), providing a RESTful interface for the web and mobile frontends. All requests require HTTPS and use JSON for request/response payloads.

**Key Principles:**
- Stateless authentication via Supabase JWT tokens
- Row-Level Security (RLS) enforced at the database layer
- Request validation on the server before database operations
- Consistent error response format across all endpoints
- Rate limiting applied to prevent abuse

---

## Authentication

### JWT Token-Based Authentication

All authenticated endpoints require a valid Supabase JWT token passed in the `Authorization` header:

```
Authorization: Bearer <supabase_jwt_token>
```

**Token Acquisition:**
- Obtained during user login via Supabase Auth
- Token includes `sub` (user_id) and `email` claims
- Tokens expire after 1 hour; refresh tokens used for renewal
- Frontend automatically appends token to all API requests via middleware

**Verification:**
- Server-side verification using `supabase.auth.getUser()` or JWT decoding
- Token claims validated before processing requests
- Expired tokens return 401 Unauthorized

---

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context (optional)"
    },
    "timestamp": "2025-11-13T10:30:00Z"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input, validation failure |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | User lacks permissions (RLS policy denied) |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists or state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |

---

## Phase 1 API Endpoints

### Authentication Endpoints

#### 1. User Login

**POST** `/api/auth/login`

| Field | Value |
|-------|-------|
| **Authentication Required** | No |
| **Rate Limit** | 5 requests/minute per IP |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2025-11-01T10:00:00Z"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "ref_123...",
    "expires_in": 3600
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

**Error Codes:**
- `INVALID_EMAIL_FORMAT` (400): Email format is invalid
- `INVALID_CREDENTIALS` (401): Email/password mismatch
- `USER_NOT_FOUND` (404): User account does not exist
- `ACCOUNT_DISABLED` (403): User account is suspended
- `RATE_LIMIT_EXCEEDED` (429): Too many login attempts

---

#### 2. User Registration

**POST** `/api/auth/register`

| Field | Value |
|-------|-------|
| **Authentication Required** | No |
| **Rate Limit** | 3 requests/minute per IP |

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Jane Doe",
  "age_group": "parent", // "child" or "parent"
  "terms_accepted": true,
  "privacy_accepted": true
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "age_group": "parent",
    "tickets": 5,
    "created_at": "2025-11-13T10:30:00Z"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "ref_456...",
    "expires_in": 3600
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

**Error Codes:**
- `INVALID_EMAIL_FORMAT` (400): Email format is invalid
- `WEAK_PASSWORD` (400): Password does not meet security requirements
- `EMAIL_ALREADY_EXISTS` (409): Email is already registered
- `INVALID_AGE_GROUP` (400): age_group must be 'child' or 'parent'
- `TERMS_NOT_ACCEPTED` (400): User must accept terms and privacy policy

---

#### 3. User Logout

**POST** `/api/auth/logout`

| Field | Value |
|-------|-------|
| **Authentication Required** | Yes |
| **Rate Limit** | No limit |

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error Codes:**
- `INVALID_TOKEN` (401): JWT token is invalid or expired

---

### Toys Endpoints

#### 1. List All Toys (with Filters)

**GET** `/api/toys?category=action&limit=20&offset=0`

| Field | Value |
|-------|-------|
| **Authentication Required** | No (public listing) |
| **Rate Limit** | 30 requests/minute per IP |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by toy category (e.g., 'action', 'board_game') |
| `condition` | string | No | Filter by condition (e.g., 'excellent', 'good', 'fair') |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `offset` | number | No | Pagination offset (default: 0) |
| `sort_by` | string | No | Sort field: 'created_at', 'distance' (default: 'created_at') |

**Response (200 OK):**
```json
{
  "toys": [
    {
      "id": "toy_550e8400-e29b-41d4-a716",
      "title": "LEGO City Set",
      "description": "Complete LEGO City set, rarely used",
      "category": "building_blocks",
      "condition": "excellent",
      "owner_id": "user_550e8400-e29b-41d4-a716",
      "owner_name": "John Doe",
      "image_urls": [
        "https://storage.supabase.co/toys/toy_550e8400/image1.jpg"
      ],
      "tags": ["lego", "educational"],
      "created_at": "2025-11-10T14:00:00Z",
      "available": true
    }
  ],
  "total_count": 156,
  "limit": 20,
  "offset": 0
}
```

**Error Codes:**
- `INVALID_CATEGORY` (400): Category does not exist
- `INVALID_CONDITION` (400): Condition value is invalid
- `INVALID_PAGINATION` (400): limit or offset is invalid

---

#### 2. Get Single Toy

**GET** `/api/toys/:toy_id`

| Field | Value |
|-------|-------|
| **Authentication Required** | No |
| **Rate Limit** | 30 requests/minute per IP |

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `toy_id` | string | Unique toy identifier |

**Response (200 OK):**
```json
{
  "toy": {
    "id": "toy_550e8400-e29b-41d4-a716",
    "title": "LEGO City Set",
    "description": "Complete LEGO City set, rarely used",
    "category": "building_blocks",
    "condition": "excellent",
    "owner_id": "user_550e8400-e29b-41d4-a716",
    "owner": {
      "id": "user_550e8400-e29b-41d4-a716",
      "name": "John Doe",
      "rating": 4.8,
      "response_time_hours": 2
    },
    "image_urls": [
      "https://storage.supabase.co/toys/toy_550e8400/image1.jpg"
    ],
    "tags": ["lego", "educational"],
    "created_at": "2025-11-10T14:00:00Z",
    "available": true,
    "exchange_count": 5
  }
}
```

**Error Codes:**
- `TOY_NOT_FOUND` (404): Toy does not exist or has been deleted

---

#### 3. Create New Toy Listing

**POST** `/api/toys`

| Field | Value |
|-------|-------|
| **Authentication Required** | Yes |
| **Rate Limit** | 10 requests/minute per user |

**Request Body:**
```json
{
  "title": "LEGO City Set",
  "description": "Complete LEGO City set, rarely used. Includes all original pieces.",
  "category": "building_blocks",
  "condition": "excellent",
  "tags": ["lego", "educational", "building"],
  "image_urls": [
    "https://storage.supabase.co/toys/uploads/image_abc123.jpg"
  ]
}
```

**Response (201 Created):**
```json
{
  "toy": {
    "id": "toy_550e8400-e29b-41d4-a716",
    "title": "LEGO City Set",
    "description": "Complete LEGO City set, rarely used. Includes all original pieces.",
    "category": "building_blocks",
    "condition": "excellent",
    "owner_id": "user_550e8400-e29b-41d4-a716",
    "image_urls": [
      "https://storage.supabase.co/toys/uploads/image_abc123.jpg"
    ],
    "tags": ["lego", "educational", "building"],
    "created_at": "2025-11-13T10:30:00Z",
    "available": true
  }
}
```

**Error Codes:**
- `INVALID_TOKEN` (401): JWT token is missing or invalid
- `INVALID_TITLE` (400): Title is empty or exceeds 255 characters
- `INVALID_CATEGORY` (400): Category does not exist
- `INVALID_CONDITION` (400): Condition value is invalid
- `INVALID_IMAGES` (400): Image URLs are invalid or exceed limit
- `INSUFFICIENT_TICKETS` (403): User has no available tickets to list
- `USER_NOT_FOUND` (404): User account not found

---

### Exchange Endpoints

#### 1. Request Toy Exchange

**POST** `/api/exchanges`

| Field | Value |
|-------|-------|
| **Authentication Required** | Yes |
| **Rate Limit** | 20 requests/minute per user |

**Request Body:**
```json
{
  "toy_id": "toy_550e8400-e29b-41d4-a716",
  "message": "Hi! I'm interested in this toy. Can we arrange an exchange?"
}
```

**Response (201 Created):**
```json
{
  "exchange": {
    "id": "exchange_550e8400-e29b-41d4-a716",
    "toy_id": "toy_550e8400-e29b-41d4-a716",
    "requester_id": "user_550e8400-e29b-41d4-a717",
    "lister_id": "user_550e8400-e29b-41d4-a716",
    "status": "pending",
    "message": "Hi! I'm interested in this toy. Can we arrange an exchange?",
    "created_at": "2025-11-13T10:30:00Z",
    "expires_at": "2025-11-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `INVALID_TOKEN` (401): JWT token is missing or invalid
- `TOY_NOT_FOUND` (404): Toy does not exist
- `TOY_NOT_AVAILABLE` (409): Toy is already in an active exchange or delisted
- `CANNOT_EXCHANGE_OWN_TOY` (409): User cannot request their own toy
- `INSUFFICIENT_TICKETS` (403): User has no tickets to request exchange
- `DUPLICATE_REQUEST` (409): User already has a pending request for this toy

---

#### 2. Get Exchange Status

**GET** `/api/exchanges/:exchange_id`

| Field | Value |
|-------|-------|
| **Authentication Required** | Yes |
| **Rate Limit** | 30 requests/minute per user |

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `exchange_id` | string | Unique exchange identifier |

**Response (200 OK):**
```json
{
  "exchange": {
    "id": "exchange_550e8400-e29b-41d4-a716",
    "toy_id": "toy_550e8400-e29b-41d4-a716",
    "toy_title": "LEGO City Set",
    "requester_id": "user_550e8400-e29b-41d4-a717",
    "requester_name": "Jane Doe",
    "lister_id": "user_550e8400-e29b-41d4-a716",
    "lister_name": "John Doe",
    "status": "confirmed",
    "status_history": [
      {
        "status": "pending",
        "updated_at": "2025-11-13T10:30:00Z"
      },
      {
        "status": "confirmed",
        "updated_at": "2025-11-13T11:15:00Z"
      }
    ],
    "created_at": "2025-11-13T10:30:00Z",
    "confirmed_at": "2025-11-13T11:15:00Z",
    "completed_at": null,
    "expires_at": "2025-11-15T10:30:00Z"
  }
}
```

**Error Codes:**
- `INVALID_TOKEN` (401): JWT token is missing or invalid
- `EXCHANGE_NOT_FOUND` (404): Exchange does not exist
- `ACCESS_DENIED` (403): User is not a participant in this exchange

---

#### 3. Confirm/Accept Exchange

**PATCH** `/api/exchanges/:exchange_id`

| Field | Value |
|-------|-------|
| **Authentication Required** | Yes |
| **Rate Limit** | 10 requests/minute per user |

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `exchange_id` | string | Unique exchange identifier |

**Request Body:**
```json
{
  "action": "confirm",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "country": "US"
  }
}
```

**Response (200 OK):**
```json
{
  "exchange": {
    "id": "exchange_550e8400-e29b-41d4-a716",
    "status": "confirmed",
    "confirmed_at": "2025-11-13T11:15:00Z",
    "expires_at": "2025-11-15T10:30:00Z",
    "message": "Exchange confirmed. Please arrange shipment within 48 hours."
  }
}
```

**Error Codes:**
- `INVALID_TOKEN` (401): JWT token is missing or invalid
- `EXCHANGE_NOT_FOUND` (404): Exchange does not exist
- `INVALID_ACTION` (400): Action must be 'confirm' or 'reject'
- `EXCHANGE_EXPIRED` (409): Exchange has expired
- `EXCHANGE_ALREADY_CONFIRMED` (409): Exchange is already confirmed
- `UNAUTHORIZED_ACTION` (403): Only exchange participants can confirm/reject

---

## Implementation Notes

### Request Validation

All endpoints perform the following validations:
1. **Schema validation**: Request body matches expected structure
2. **Type validation**: Fields have correct data types
3. **Business logic validation**: User has permissions and resources available
4. **Database consistency**: RLS policies prevent unauthorized access

### Rate Limiting

Rate limits are enforced per IP (anonymous) or per user (authenticated):
- Limits reset on a rolling 60-second window
- Responses include `X-RateLimit-*` headers for client awareness
- Exceeding limits returns 429 with retry-after header

### Response Headers

All responses include:
```
Content-Type: application/json
Cache-Control: no-cache, no-store, must-revalidate
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

Authenticated responses include:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1699864260
```

### Pagination

List endpoints support cursor-based or offset-based pagination:
- **limit**: Number of results per page (default: 20, max: 100)
- **offset**: Number of results to skip (default: 0)
- **total_count**: Total number of available results

---

## Testing

### Local Testing

Test endpoints using `curl` or Postman:

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "name": "Test User",
    "age_group": "parent",
    "terms_accepted": true,
    "privacy_accepted": true
  }'

# List toys
curl http://localhost:3000/api/toys?limit=10

# Get single toy
curl http://localhost:3000/api/toys/toy_550e8400-e29b-41d4-a716
```

### Integration Tests

See `/tests` directory for Jest test suites:
- `tests/api/auth.test.ts`: Authentication endpoint tests
- `tests/api/toys.test.ts`: Toy listing and creation tests
- `tests/api/exchanges.test.ts`: Exchange workflow tests

---

## Future Phases

### Phase 2 Endpoints (TBD)
- User profile management (`/api/users/:user_id`)
- Messaging/chat (`/api/messages`)
- Notification preferences (`/api/notifications`)
- Toy image upload (`/api/upload`)

### Phase 3 Endpoints (TBD)
- Reviews and ratings (`/api/reviews`)
- User blocking/reporting (`/api/reports`)
- Analytics and statistics (`/api/analytics`)
- Admin management endpoints (`/api/admin/*`)
