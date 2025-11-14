# Task P1-W2-TOYS-001: Toy Listing Creation & Image Upload

## Task ID
P1-W2-TOYS-001

## Epic
Phase 1 Week 2-3: Toy Listing & Search

## Title
Toy Listing Creation & Image Upload

## Description
Implement complete toy listing creation workflow with multi-image upload, validation, image processing (resizing, thumbnails), and integration with ticket system. Listings cost 1 ticket and trigger behavioral analytics logging.

## Acceptance Criteria

### Frontend: Toy Listing Form Page
- [ ] URL: `/toys/create`
- [ ] Protected route: must be logged in and email verified
- [ ] Form fields:
  - Category (dropdown, required): Blocks, Vehicles, Dolls, Board Games, Educational, Sports, Art, Other
  - Description (textarea, required, max 500 chars): "Describe the toy..."
  - Tags (multi-select, required 1-3): Predefined list per category
  - Age Group (radio buttons, required): 0-2, 3-5, 6-8, 9-11, 12-14, 15+
  - Condition (radio buttons, required): Like New, Good, Fair, Well-Loved
  - Images (file upload, required 1-5): JPG/PNG, max 5MB each
- [ ] Image preview carousel (show thumbnails as uploaded)
- [ ] Drag-to-reorder images (image_order field)
- [ ] Real-time character counter for description
- [ ] Submit button: "List Toy" (shows ticket cost: -1)
- [ ] Cancel button: returns to dashboard
- [ ] All text i18n
- [ ] Error messages for:
  - No images uploaded
  - Image too large
  - Invalid image format
  - No tags selected
  - Description too long

### Backend: Create Toy Endpoint
- [ ] POST `/api/toys/create`
- [ ] Request: multipart/form-data with:
  - category (enum, required)
  - description (string, max 500, required)
  - tags (array of strings, 1-3, required)
  - age_group (enum, required)
  - condition (enum, required)
  - files: images (1-5 files)
- [ ] Validation:
  - User has 1+ available ticket
  - All required fields present
  - Description length <500
  - Tags count 1-3
  - 1-5 images provided
  - Each image: JPG/PNG, <5MB
- [ ] Create toy record in database:
  - id (uuid)
  - user_id (from JWT)
  - category, description, tags, age_group, condition
  - postal_code (from user profile)
  - is_active = true
  - frozen_listing_tickets = 1
  - created_at = now()
  - expires_at = now() + 90 days
- [ ] Upload images to Supabase Storage:
  - Path: `/toys/{user_id}/{toy_id}/{image_index}_{timestamp}.jpg`
  - Auto-resize to 800x800px (quality 85%)
  - Generate thumbnail 300x300px
- [ ] Create toy_images records (1 per image):
  - toy_id, storage_path, image_order, created_at
- [ ] Decrement user tickets:
  - UPDATE tickets SET frozen_listing_tickets = frozen_listing_tickets + 1 WHERE user_id = ?
- [ ] Log listing event for analytics:
  - INSERT INTO search_analytics (user_id, action_type, category, tags, timestamp) VALUES (...)
- [ ] Response:
  ```json
  {
    "success": true,
    "toy_id": "uuid",
    "message": "Toy listed successfully",
    "ticket_balance": 9
  }
  ```
- [ ] Error responses:
  - 400: Validation error
  - 402: Insufficient tickets
  - 413: Image too large
  - 500: Upload failed

### Image Processing
- [ ] Validation:
  - File type: JPG, PNG only (check MIME type AND file header)
  - File size: <5MB
  - Image dimensions: minimum 100x100px
- [ ] Processing:
  - Resize to 800x800px (maintain aspect ratio, fill with white)
  - Generate thumbnail 300x300px
  - JPEG quality: 85%
  - Strip EXIF data (privacy)
- [ ] Storage:
  - Primary image: `/toys/{user_id}/{toy_id}/0_{timestamp}.jpg`
  - Thumbnail: `/toys/{user_id}/{toy_id}/0_thumb_{timestamp}.jpg`
  - Use object versioning in Supabase Storage
- [ ] RLS Policy: only user_id can access their toy images

### Ticket Deduction & Freezing
- [ ] Deduct 1 ticket to frozen_listing_tickets
- [ ] Available balance = total_balance - frozen_listing_tickets - frozen_exchange_tickets
- [ ] Show updated balance in response
- [ ] Validate sufficient balance before creating toy

### Behavioral Analytics
- [ ] Log category selection: `search_analytics` table
- [ ] Log tags selected: `search_analytics` table
- [ ] Log listing event: `toy_listings_created` (aggregated metric)
- [ ] No PII in logs

### Listing Expiration
- [ ] Set expires_at = now() + 90 days
- [ ] Scheduled job (future task) will auto-archive expired toys

### Success Notifications
- [ ] Toast message: "Toy listed successfully! 1 ticket deducted."
- [ ] Show ticket balance update
- [ ] Optional: redirect to toy detail page or dashboard

## Estimated Hours
14-16 hours

## Dependencies
- Task P1-W1-AUTH-003 (User must be logged in)
- Task P1-W1-SETUP-002 (Database schema: toys, toy_images)
- Task P1-W1-SETUP-003 (RLS policies)

## Testing Requirements

### Unit Tests
- [ ] Image validation:
  - Valid JPG/PNG <5MB ✓
  - Invalid: BMP, GIF ✗
  - Invalid: >5MB ✗
  - Invalid: <100x100px ✗
- [ ] Toy data validation:
  - Valid category in enum ✓
  - Invalid category ✗
  - Description 500 chars ✓
  - Description >500 chars ✗
  - Tags 1-3 items ✓
  - Tags 0 or >3 items ✗

### Integration Tests
- [ ] POST /api/toys/create with valid data:
  - Creates toy record
  - Creates toy_images records (5 images)
  - Deducts 1 ticket
  - Uploads 5 images to storage
  - Returns toy_id and updated balance
- [ ] POST /api/toys/create with insufficient tickets → 402
- [ ] POST /api/toys/create with invalid image → 400
- [ ] Image processing: verify resized 800x800px in storage
- [ ] Toy expires_at is 90 days in future
- [ ] Analytics logged to search_analytics table

### E2E Tests (Playwright)
- [ ] Navigate to /toys/create
- [ ] Select category, description, tags, age group, condition
- [ ] Upload 3 images
- [ ] Preview images in carousel
- [ ] Reorder images (drag-drop)
- [ ] Click submit
- [ ] Verify success message
- [ ] Verify toy appears in dashboard
- [ ] Verify ticket balance decremented

### Manual Testing
- [ ] Upload JPG/PNG images → resized correctly (verify in Storage browser)
- [ ] Upload 5+ images → error "Max 5 images"
- [ ] Upload >5MB image → error "File too large"
- [ ] Submit without images → error "At least 1 image required"
- [ ] Check Mailhog for notification email (if enabled)
- [ ] Verify toy visible in search results within 30 seconds

## Database/Schema Changes
- `public.toys` table (from P1-W1-SETUP-002)
- `public.toy_images` table (from P1-W1-SETUP-002)
- `public.search_analytics` table for logging (new, see separate task)
- `public.tickets` updated to reflect frozen_listing_tickets

## Technology Stack
- Next.js
- React (file upload, image preview)
- Supabase Storage (image upload)
- Sharp library (image processing)
- TypeScript
- Jest (unit tests)
- Playwright (E2E tests)

## Implementation Notes

### Image Processing with Sharp
```typescript
import sharp from 'sharp';

const processImage = async (buffer: Buffer) => {
  // Resize to 800x800 with aspect ratio preservation
  const resized = await sharp(buffer)
    .resize(800, 800, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .toFormat('jpeg', { quality: 85 })
    .toBuffer();

  // Thumbnail 300x300
  const thumb = await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .toFormat('jpeg', { quality: 85 })
    .toBuffer();

  return { resized, thumb };
};
```

### Supabase Storage RLS
- Bucket: `toys`
- Path: `/toys/{user_id}/*`
- Read: public (for search results), but RLS enforces user_id
- Write: authenticated users only, for own user_id

### Tag Selection
- Load predefined tags from frontend constant or API
- Group by category
- Allow user to select 1-3

## Success Metrics
- Image upload <5 seconds per image
- Listings appear in search <30 seconds
- 100% image validation coverage
- 95%+ test coverage for listing module
- No image EXIF data exposed
- All images properly resized

## Related Stories (from PRD)
- Story 2: List a Toy

## Related Functional Requirements
- FR-TOY-001: Toy Data Model
- FR-TOY-002: Listing Creation
- FR-TOY-004: Image Processing
- FR-TICKET-002: Ticket Operations (deduction)
- FR-SEARCH-002: Behavioral Analytics

## Risk Factors
- Image upload timeout on slow networks (mitigate: chunked upload, progress bar)
- Disk space for images (mitigate: automatic cleanup, archive old images)
- Malicious image uploads (mitigate: file header validation, antivirus scan in production)
