# Tailwind CSS Best Practices Guide

This guide provides best practices for working with Tailwind CSS in the Toys-for-Toys project.

---

## Table of Contents

1. [Utility-First Thinking](#utility-first-thinking)
2. [Responsive Design](#responsive-design)
3. [Dark Mode](#dark-mode)
4. [Component Patterns](#component-patterns)
5. [Performance Tips](#performance-tips)
6. [Accessibility](#accessibility)
7. [Common Patterns](#common-patterns)
8. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Utility-First Thinking

### Core Principle

Apply utility classes directly to HTML elements rather than creating custom CSS for every component.

### Example: WRONG

```css
/* DON'T do this */
.card-header {
  padding: 1rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
}
```

```tsx
<div className="card-header">Card Title</div>
```

### Example: RIGHT

```tsx
<div className="p-4 text-lg font-semibold text-gray-900 border-b border-gray-200">Card Title</div>
```

### Rationale

- Fewer CSS files to maintain
- Utilities are single-purpose and reusable
- Easier to understand visual styling by reading HTML
- No naming conflicts or CSS specificity issues

---

## Responsive Design

### Mobile-First Approach

Always design for mobile first, then add complexity with larger breakpoints.

### Breakpoints

```
sm:  640px  - Small devices (tablets portrait)
md:  768px  - Medium devices (tablets landscape)
lg:  1024px - Large devices (desktops)
xl:  1280px - Extra large (wide monitors)
2xl: 1536px - Ultra-wide (high-res displays)
```

### Example: Responsive Typography

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">Welcome to Toys for Toys</h1>
```

### Example: Responsive Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid changes from 1 column (mobile) to 2 (tablet) to 3 (desktop) */}
</div>
```

### Example: Responsive Spacing

```tsx
<section className="px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">
  {/* Padding adjusts based on screen size */}
</section>
```

### Tips

- Test on actual mobile devices, not just browser dev tools
- Use responsive images with srcset attribute
- Consider touch targets: minimum 44x44px (11x11mm)
- Test landscape and portrait orientations

---

## Dark Mode

### Implementation

The project uses class-based dark mode. Add the `dark` class to toggle:

```tsx
// Enable dark mode
<html className="dark">

// Disable dark mode
<html>
```

### Using Dark Mode Classes

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
  Content that adapts to light and dark mode
</div>
```

### Example: Card with Dark Mode

```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm dark:shadow-none">
  <h3 className="text-gray-900 dark:text-white">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Card content</p>
</div>
```

### Color Pairing for Dark Mode

When using a light mode color, always add a dark mode variant:

```tsx
// Good
className = 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100';

// Bad - no dark mode
className = 'bg-blue-100 text-blue-900';
```

### System Preference Detection

For automatic detection, add this to a theme provider:

```tsx
// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Apply dark class to html element if true
if (prefersDark) {
  document.documentElement.classList.add('dark');
}
```

---

## Component Patterns

### Using @apply for Component Abstraction

When you have repeated utility combinations, use `@apply` in globals.css:

```css
/* In globals.css @layer components */
.btn-primary {
  @apply inline-flex items-center justify-center px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200;
}

.btn-secondary {
  @apply inline-flex items-center justify-center px-4 py-2 font-medium text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200;
}

.btn-danger {
  @apply inline-flex items-center justify-center px-4 py-2 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200;
}
```

Then use in components:

```tsx
<button className="btn-primary">Click me</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-danger">Delete</button>
```

### Creating Card Component

```tsx
// components/Card.tsx
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// Usage
<Card>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Content</p>
</Card>;
```

### Creating Layout Component

```tsx
// components/Container.tsx
export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`container-base ${className}`}>{children}</div>;
}

// Usage - container-base is defined in globals.css
<Container className="py-12">{/* Content with responsive padding and max-width */}</Container>;
```

---

## Performance Tips

### 1. Content Path Configuration

The `content` array in tailwind.config.ts must include all files with Tailwind classes:

```typescript
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
  './lib/**/*.{js,ts,jsx,tsx,mdx}',
],
```

If you add a new directory, update this array.

### 2. Avoid Dynamic Class Names

WRONG - Tailwind can't detect dynamic classes:

```tsx
<div className={`bg-${color}-500`}>
  {/* This won't work - Tailwind can't parse dynamic colors */}
</div>
```

RIGHT - Use a mapping or predefined classes:

```tsx
const colorClasses: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
};

<div className={colorClasses[color]}>{/* Tailwind can find and include these classes */}</div>;
```

### 3. Extract Repeated Patterns

Extract repeated utility combinations to reduce file size:

```css
/* In globals.css */
@layer components {
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium;
  }

  .badge-blue {
    @apply badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100;
  }

  .badge-red {
    @apply badge bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100;
  }
}
```

### 4. Monitor Bundle Size

Check CSS output size during development:

```bash
npm run build
# Check .next/static/css directory for file sizes
```

Aim for:

- Development: No limit (full Tailwind included)
- Production: 50-100KB depending on feature usage

### 5. Use CSS Variables for Theme Values

For customizable themes, use CSS variables:

```css
/* In globals.css */
@layer base {
  :root {
    --color-primary: #2563eb;
    --color-secondary: #64748b;
  }
}
```

Then reference in Tailwind config:

```typescript
// In tailwind.config.ts
colors: {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
}
```

---

## Accessibility

### 1. Color Contrast

Always ensure sufficient contrast between text and background:

```tsx
// Good - sufficient contrast
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

// Bad - low contrast
<div className="bg-gray-100 text-gray-300">
```

### 2. Focus States

All interactive elements must have visible focus states:

```tsx
<button className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
  Click me
</button>
```

This is included in globals.css for all elements.

### 3. Touch Target Size

Ensure buttons and links are at least 44x44px (11mm):

```tsx
// Good - sufficient touch target
<button className="px-4 py-2 min-h-11 min-w-11">
  Click me
</button>

// Bad - too small
<button className="px-1 py-0.5">
  Click me
</button>
```

### 4. Text Sizing

Use `text-base` or larger for body text:

```tsx
// Good
<p className="text-base leading-relaxed">
  Body text content
</p>

// Avoid
<p className="text-xs">
  Very small text content
</p>
```

### 5. Semantic HTML

Always use semantic elements with appropriate ARIA attributes:

```tsx
// Good
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Less good - divs without semantics
<div>
  <div>
    <div><a href="/">Home</a></div>
  </div>
</div>
```

---

## Common Patterns

### Centered Container

```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center">{/* Centered content */}</div>
</div>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Three columns on desktop, two on tablet, one on mobile */}
</div>
```

### Sticky Header

```tsx
<header className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
  {/* Header content */}
</header>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <div key={item.id} className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mt-2">{item.description}</p>
    </div>
  ))}
</div>
```

### Flex Between

```tsx
<div className="flex-between">
  <span>Label</span>
  <span className="font-semibold">Value</span>
</div>
```

### Gradient Background

```tsx
<div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">{/* Content */}</div>
```

### Hero Section

```tsx
<section className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900">
  <div className="container-base py-24">
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">Hero Title</h1>
      <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">Hero subtitle</p>
    </div>
  </div>
</section>
```

---

## Anti-Patterns to Avoid

### 1. Don't Use !important

```tsx
// BAD
className = 'p-4 !p-8';

// GOOD - Override with more specific utility
className = 'p-8';
```

### 2. Don't Mix Utility Styles with Custom CSS

```tsx
// BAD - mixing approaches
<div className="my-custom-class p-4">
  {/* custom-class has custom CSS, p-4 is Tailwind */}
</div>

// GOOD - use only Tailwind or @apply
<div className="p-4 bg-white rounded-lg">
  {/* All Tailwind utilities */}
</div>
```

### 3. Don't Extract Components Too Early

```tsx
// BAD - over-engineered for simple use
// components/Text.tsx
export const Text = ({ children }) => <p className="text-base">{children}</p>;

// GOOD - use Tailwind directly
<p className="text-base">{children}</p>;
```

### 4. Don't Nest Classes Excessively

```tsx
// BAD - hard to read
className =
  'relative inline-flex items-center justify-center font-semibold text-sm leading-none rounded-full whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-3 py-1 bg-blue-600 text-white hover:bg-blue-700';

// GOOD - extract to component or use @apply
className = 'btn-primary';
```

### 5. Don't Create Custom Color Names

```tsx
// BAD - custom naming
className = 'bg-primary text-secondary';

// GOOD - use Tailwind standard colors or extend config
className = 'bg-blue-600 text-gray-700';
```

### 6. Don't Ignore Responsive Design

```tsx
// BAD - only desktop view
className = 'w-1/3 absolute left-0 top-0';

// GOOD - responsive from mobile
className = 'w-full md:w-1/3 absolute left-0 top-0';
```

### 7. Don't Use Pixel Values When Tailwind Has Utilities

```tsx
// BAD - custom CSS value
style={{ width: '320px' }}

// GOOD - use Tailwind spacing scale
className="w-80"
```

---

## Tailwind Documentation Quick Links

- **Official Docs**: https://tailwindcss.com/docs
- **Color Palette**: https://tailwindcss.com/docs/customizing-colors
- **Responsive Design**: https://tailwindcss.com/docs/responsive-design
- **Dark Mode**: https://tailwindcss.com/docs/dark-mode
- **Utilities**: https://tailwindcss.com/docs/margin

---

## Next Steps

1. **Install shadcn/ui components** as needed for your features
2. **Create shared components** using the patterns above
3. **Extend the theme** in tailwind.config.ts with brand colors
4. **Build responsive pages** using mobile-first approach
5. **Test on mobile devices** to ensure responsive design works

---

**Last Updated**: 2025-11-13
**Project**: Toys-for-Toys
**Version**: 1.0.0
