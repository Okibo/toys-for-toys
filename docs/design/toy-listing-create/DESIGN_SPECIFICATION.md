# Toy Listing Creation Page Design Specification

## Overview
Mobile-first design for the toy listing creation page (`/toys/create`). Users can create a new toy listing with images, category, description, condition, age group, and tags. The system costs 1 ticket to list a toy.

## Design Philosophy
- **Mobile-First**: Optimized for 320px-480px viewport first, progressively enhanced for tablet (768px) and desktop (1025px+)
- **Accessibility**: WCAG 2.1 AA compliant with proper touch targets (48px minimum), semantic HTML, ARIA labels
- **Progressive Disclosure**: Show relevant information based on user selections
- **Drag & Drop**: Natural image reordering with visual feedback
- **Real-time Validation**: Instant feedback on form inputs and image uploads

## Component Hierarchy

```
Page (/toys/create)
├── Header (Back button, Title)
├── Form Container
│   ├── ToyListingForm
│   │   ├── Category Dropdown
│   │   ├── Description Textarea (with character counter)
│   │   ├── Age Group Radio Group
│   │   ├── Condition Radio Group
│   │   └── TagSelector (multi-select)
│   ├── ImageUploadSection
│   │   ├── ImageUploadZone (drag-drop)
│   │   └── ImagePreviewCarousel (with reordering)
│   └── Actions
│       ├── List Toy Button (primary, shows -1 ticket)
│       └── Cancel Button (secondary)
└── Toast Notifications (success/error messages)
```

## Layout Specifications

### Mobile (320px - 480px)
**Viewport**: 320px width, full-screen layout with safe area padding
**Spacing**: 16px padding on sides, 16px gap between sections
**Touch targets**: All buttons/inputs minimum 48px height
**Column layout**: Single column, full-width inputs
**Image grid**: 2 columns for previews (150px × 150px each)

### Tablet (768px - 1024px)
**Viewport**: 768px width, centered container (max-width: 600px)
**Spacing**: 24px padding, 20px gaps
**Image grid**: 3 columns for previews (180px × 180px each)
**Form layout**: Same single-column, wider inputs

### Desktop (1025px+)
**Viewport**: Full width, centered container (max-width: 800px)
**Spacing**: 32px padding, 24px gaps
**Image grid**: 4 columns for previews (200px × 200px each)
**Form layout**: Optional 2-column layout for form/images if space allows

## Section Specifications

### 1. Header Section
- Back button (icon + "Back" text on mobile, icon-only on tablet+)
- Page title: "List a Toy" or "Create Listing"
- Subtitle: "Cost: 1 ticket" (in secondary color)
- Height: 60px mobile, 70px tablet+

### 2. Form Section (ToyListingForm)

#### 2.1 Category Dropdown
**Label**: "Category" (required)
**Type**: Single-select dropdown
**Options**:
1. Blocks
2. Vehicles
3. Dolls
4. Board Games
5. Educational
6. Sports
7. Art
8. Other

**Behavior**:
- Opens to show all options
- Selected value highlighted
- Clear visual feedback on selection
- Updates tag suggestions dynamically

#### 2.2 Description Textarea
**Label**: "Description" (required)
**Type**: Textarea with character counter
**Constraints**:
- Min length: 10 characters
- Max length: 500 characters
- Real-time character counter: "45 / 500"
- Visual warning at 80% capacity (change text color to warning)

**Behavior**:
- Placeholder: "Describe the toy's condition, features, and any special notes..."
- Grows with content (min 100px, max 200px height)
- Shows character count below input
- Validation error if < 10 or > 500 characters

#### 2.3 Age Group Radio Buttons
**Label**: "Recommended Age" (required)
**Type**: Radio group with 6 options
**Options**:
- 0-2 years
- 3-5 years
- 6-8 years
- 9-11 years
- 12-14 years
- 15+ years

**Behavior**:
- Single selection only
- Visual focus state for each option
- Touch-friendly spacing (min 48px height per option)

#### 2.4 Condition Radio Buttons
**Label**: "Condition" (required)
**Type**: Radio group with 4 options
**Options**:
- Like New (no signs of wear)
- Good (minor signs of wear)
- Fair (visible signs of use)
- Well-Loved (heavy use, fully functional)

**Behavior**:
- Single selection only
- Include brief description in each option on tablet+
- Visual icons optional (star/condition indicator)

#### 2.5 Tag Selector Component
**Label**: "Tags" (optional, max 3)
**Type**: Multi-select checkboxes
**Category-specific tags** (shown based on category selection):

- **Blocks**: LEGO, Duplo, Building, Construction
- **Vehicles**: Car, Truck, Train, Airplane, Model
- **Dolls**: Action Figure, Fashion Doll, Baby Doll, Plush
- **Board Games**: Strategy, Family-Friendly, Cooperative, Card Game
- **Educational**: STEM, Puzzle, Learning, Interactive
- **Sports**: Ball, Outdoor, Action Sports, Racket
- **Art**: Craft, Coloring, Building, DIY
- **Other**: (allow max 3 free-form tags)

**Behavior**:
- Allows 1-3 selections
- Visual indication: "2 of 3 selected"
- "Clear All" button appears after first selection
- Chips/badges for selected items with delete (X) button
- Validation: require at least 1 tag

#### 2.6 Form Validation & Errors
- Real-time validation feedback
- Error messages appear below each field
- Red border around invalid fields
- Disabled submit button if validation errors exist
- Success state on valid input (green checkmark on desktop+)

### 3. Image Upload Section

#### 3.1 ImageUploadZone (Drag-Drop)
**Specifications**:
- Border: 2px dashed (primary color)
- Padding: 32px mobile, 48px tablet/desktop
- Border radius: 12px
- Drag-over state: solid border, light background highlight
- Icon size: 48px
- Text: "Drag images here or" (above button)
- Button: "Choose Images" (secondary style)
- Helper text: "Max 5 images, up to 10MB each, JPG/PNG/WebP"
- Supported formats: JPEG, PNG, WebP
- Max file size: 10MB per image
- Max total images: 5
- Min images: 1 (required)

**Behavior**:
- On drag over: apply background color, show "Drop to upload"
- On drag leave: revert to default state
- File input accepts multiple files at once
- Validate on drop/selection immediately
- Show inline errors for invalid files

#### 3.2 ImagePreviewCarousel
**Specifications**:
- Grid layout: 2 columns mobile, 3 columns tablet, 4 columns desktop
- Image dimensions: 150px × 150px (mobile), 180px × 180px (tablet), 200px × 200px (desktop)
- Border radius: 8px
- Image counter: "3 of 5" positioned top-right of carousel
- Reorder handle: drag icon (⋮⋮) bottom-left of thumbnail
- Delete button: X icon bottom-right of thumbnail

**Carousel Navigation** (visible if > 1 image):
- Previous/Next buttons positioned left/right of carousel
- Disabled state when at start/end
- Touch-swipe support on mobile
- Snap scrolling to full images

**Behavior**:
- Images displayed in upload order
- Drag-to-reorder: visual feedback (opacity, elevation)
- Delete removes image and updates carousel
- Hover/focus states show reorder and delete buttons
- Accessibility: keyboard navigation (arrow keys, Enter to select drag handle)

### 4. Actions Section

#### 4.1 List Toy Button
**Label**: "List Toy" (with ticket cost)
**Style**: Primary button (solid, brand color)
**Disabled state**: When form has validation errors
**Loading state**: Shows spinner, disabled, text → "Listing..."
**Hint text**: "-1 ticket" displayed below button in secondary color

**Behavior**:
- Submit form on click
- Show loading spinner during submission
- Disable user interaction during submission
- On success: redirect to listing page or show success toast + redirect
- On error: show error toast, remain on page

#### 4.2 Cancel Button
**Label**: "Cancel"
**Style**: Secondary button (outline)
**Behavior**:
- Navigate back to previous page (or /toys if no referrer)
- Show confirmation dialog if form has unsaved changes

## Typography

**Font Family**: System font stack (for platform consistency)

**Font Sizes**:
- Page title: 28px mobile, 32px tablet, 36px desktop (bold)
- Section labels: 16px (bold)
- Input labels: 14px (bold)
- Input placeholder: 14px (regular, secondary color)
- Helper text: 12px (secondary color)
- Error messages: 12px (error color, bold)
- Character counter: 12px (secondary color)
- Tag labels: 12px (regular)

**Line Heights**:
- Titles: 1.2
- Body text: 1.5
- Inputs: 1.5

## Color Palette

**Primary Color**: #007AFF (blue, for buttons and active states)
**Secondary Color**: #6C757D (gray, for helper text)
**Error Color**: #DC3545 (red)
**Warning Color**: #FFC107 (orange)
**Success Color**: #28A745 (green)
**Border Color**: #E9ECEF (light gray)
**Background**: #FFFFFF (white)
**Text Color**: #212529 (dark gray)

## Spacing Scale (8px base)

- 4px: micro spacing (gaps between related items)
- 8px: xs
- 12px: sm
- 16px: md
- 20px: lg
- 24px: xl
- 32px: 2xl
- 48px: 3xl

## Component States

### Button States
- **Default**: Opaque, clickable
- **Hover**: Slightly darker shade (desktop only)
- **Active**: Darker shade with slight depression effect
- **Disabled**: 50% opacity, cursor: not-allowed
- **Loading**: Spinner visible, disabled

### Input States
- **Default**: Empty, placeholder visible
- **Focus**: Blue border (2px), shadow (0 0 0 4px rgba(0, 122, 255, 0.1))
- **Filled**: Value visible, label floats above
- **Error**: Red border (2px), error message below
- **Disabled**: 50% opacity, cursor: not-allowed

### Image Thumbnail States
- **Default**: Normal size
- **Hover**: Shadow effect (elevation 4), delete/reorder handles visible
- **Dragging**: Opacity 0.6, elevation 8
- **Placeholder** (loading): Skeleton loader or progress bar

## Accessibility Requirements

1. **Keyboard Navigation**:
   - All interactive elements must be focusable with Tab
   - Form submission with Enter key
   - Escape key to close dialogs/modals
   - Arrow keys for radio groups and carousel navigation

2. **Screen Reader Support**:
   - All labels associated with inputs (`<label htmlFor="...">`)
   - ARIA labels for icon buttons
   - Form error announcements
   - Image upload progress announcements
   - Carousel state announcements ("Image 3 of 5")

3. **Visual**:
   - Minimum contrast ratio: 4.5:1 for text, 3:1 for graphics
   - Focus indicators: 2px blue outline
   - Error messages visible to colorblind users (icon + text)
   - Text resize: works up to 200% without loss of functionality

4. **Touch**:
   - Minimum touch target size: 48px × 48px
   - Adequate spacing between touch targets: minimum 8px
   - No hover-only content

## Loading & Error States

### Loading State
- Progress indicator on "List Toy" button
- Form inputs disabled
- Message: "Submitting your listing..."

### Error States
- Individual field errors: Red border + error message below field
- Form submission error: Toast notification + error details
- Image upload error: Inline message + retry button
- Network error: Toast with retry option
- Validation error: Focus on first invalid field, announce to screen readers

### Success State
- Success toast: "Listing created successfully!"
- Auto-dismiss after 3 seconds
- Redirect to listing page or dashboard after 2 seconds

## Responsive Breakpoints

```
Mobile:  320px - 767px   (single column, full-width)
Tablet:  768px - 1024px  (single column, max-width 600px centered)
Desktop: 1025px+         (single column, max-width 800px centered)
```

## Performance Considerations

1. **Image Optimization**:
   - Lazy load image previews in carousel
   - Show thumbnail while full image loads
   - Compress images before upload (if possible client-side)

2. **Form State**:
   - Debounce character counter updates (50ms)
   - Cache category tags data after first load

3. **Drag & Drop**:
   - Use hardware acceleration for smooth reordering
   - Throttle drag events to 60fps

## Implementation Notes for Developers

1. **Component Files**:
   - `/components/toys/ToyListingForm.tsx` - Main form with category, description, age group, condition, tags
   - `/components/toys/ImageUploadSection.tsx` - Container for image upload
   - `/components/toys/ImageUploadZone.tsx` - Drag-drop zone component
   - `/components/toys/ImagePreviewCarousel.tsx` - Image preview grid with reordering
   - `/components/toys/TagSelector.tsx` - Multi-select tag component
   - `/app/toys/create/page.tsx` - Main page with routing and form submission

2. **State Management**:
   - Use React hooks for form state (useState, useCallback)
   - Custom hook: `useToyListing()` to manage form data
   - Custom hook: `useImageUpload()` to manage image uploads and reordering

3. **Validation**:
   - Client-side validation for all fields
   - Server-side validation on submission (will be implemented in API routes)
   - Real-time feedback for character counter and description length

4. **Accessibility**:
   - Use semantic HTML (`<form>`, `<fieldset>`, `<legend>`)
   - Use shadcn/ui components with proper ARIA attributes
   - Test with keyboard navigation and screen readers

5. **i18n Considerations**:
   - All text must be wrapped with translation function (t())
   - Support RTL layout if needed
   - Date/time formatting using locale-aware utilities

## Design Decisions & Rationale

1. **Drag-to-Reorder Images**: More intuitive for users than dropdown selectors or manual numbering
2. **Real-time Character Counter**: Provides immediate feedback, prevents form rejection
3. **Mobile-First Responsive**: Ensures optimal experience on primary device (mobile)
4. **Separate Image Upload Component**: Cleaner separation of concerns, reusable for other forms
5. **Required Validation Indicator**: Helps users understand form requirements upfront
6. **Toast Notifications**: Non-intrusive feedback for async operations
7. **Disabled Submit Button on Errors**: Prevents invalid submissions, provides clear feedback

## Template Sources & References

- Component patterns follow shadcn/ui design system
- Form validation patterns from React Hook Form
- Accessibility guidelines: WCAG 2.1 AA
- Responsive design: Mobile-First CSS approach with Tailwind CSS breakpoints
