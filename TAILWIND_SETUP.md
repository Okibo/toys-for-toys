# Tailwind CSS & shadcn/ui Setup Documentation

## Overview

This document details the complete Tailwind CSS and shadcn/ui configuration for the Toys-for-Toys project (Phase 3 - GREEN).

## Files Created

### 1. /tailwind.config.ts

**Purpose**: Main Tailwind CSS configuration file
**Key Features**:

- TypeScript configuration for type safety
- Content paths configured for: `app/**`, `components/**`, `lib/**`
- Dark mode enabled using `class` strategy (allows manual theme switching)
- Extensible theme configuration for custom brand colors
- Empty plugins array (ready for future Tailwind plugins)

**Configuration Details**:

```typescript
- content: Scans for Tailwind classes in app, components, and lib directories
- darkMode: 'class' - Uses class-based dark mode (user preference via data attribute)
- plugins: [] - Ready for future shadcn/ui or custom Tailwind plugins
- theme.extend: Allows custom colors, spacing, animations without overriding defaults
```

### 2. /postcss.config.js

**Purpose**: PostCSS configuration for CSS processing
**Key Features**:

- Tailwind CSS plugin integration
- Autoprefixer for vendor-specific prefixes
- Minimal, production-ready configuration

**Configuration Details**:

```javascript
- tailwindcss plugin: Processes @tailwind directives
- autoprefixer: Adds vendor prefixes for cross-browser compatibility
```

**Note**: `autoprefixer` needs to be added to `package.json` devDependencies during npm install phase.

### 3. /app/globals.css

**Purpose**: Global styles and Tailwind CSS directives
**Key Features**:

- Tailwind directives: @tailwind base, components, utilities
- Base layer styles with @apply directives
- Component layer with reusable CSS classes
- Utilities layer with custom helper classes
- Dark mode support via media queries and class-based approach
- Accessibility improvements (focus-visible states)
- Smooth transitions for theme changes

**Included Component Classes**:

- `.btn-primary` - Primary call-to-action button
- `.btn-secondary` - Secondary action button
- `.card` - Standard card component
- `.input-base` - Base input field styles

**Included Utility Classes**:

- `.container-base` - Responsive container with max-width and padding
- `.flex-center` - Flexbox centered layout
- `.flex-between` - Flexbox space-between layout

### 4. /components.json

**Purpose**: shadcn/ui configuration for component initialization and scaffolding
**Key Features**:

- RSC (React Server Components) enabled
- TypeScript enabled
- Alias prefix set to @ for import convenience
- Path aliases configured to match tsconfig.json

**Configuration Details**:

```json
- style: "default" - Uses shadcn/ui default styling
- rsc: true - Enables React Server Components support
- tsx: true - Uses TypeScript
- aliasPrefix: "@" - Uses @ for imports
- alias paths: Points to app, components, and lib directories
```

## Files Modified

### 1. /app/layout.tsx

**Changes Made**:

- Added import of `./globals.css` for global styles
- Added `suppressHydrationWarning` to `<html>` tag (required for dark mode)
- Updated `<body>` tag with Tailwind CSS classes:
  - Light mode: `bg-white text-gray-900 antialiased`
  - Dark mode: `dark:bg-gray-950 dark:text-gray-100`

### 2. /app/page.tsx

**Changes Made**:

- Replaced plain HTML with Tailwind CSS styled components
- Responsive design with mobile-first approach
- Demonstrates key Tailwind utilities:
  - Responsive text sizing: `text-4xl sm:text-5xl md:text-6xl`
  - Gradient backgrounds: `bg-gradient-to-b from-blue-50 to-white`
  - Dark mode support: `dark:bg-gray-950 dark:text-white`
  - Responsive spacing: `py-12 md:py-24`
  - Flexbox layouts: `flex items-center justify-center gap-4`
  - Component classes: `.btn-primary`, `.btn-secondary`, `.container-base`

## Configuration Summary

### Tailwind CSS Configuration

- **Version**: 3.3.5 (from package.json)
- **Content Paths**: `app/**`, `components/**`, `lib/**`
- **Dark Mode**: Class-based (manual control)
- **Default Theme**: Extended with Tailwind defaults
- **Responsive Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)

### CSS Processing Pipeline

```
Source Files (.tsx, .jsx)
        ↓
Tailwind CSS (@tailwind directives)
        ↓
PostCSS (tailwindcss, autoprefixer)
        ↓
Processed CSS (purged for production)
        ↓
Next.js Build Output
```

### shadcn/ui Setup

- **Component Directory**: `/components`
- **Library Alias**: `@/components`
- **Import Style**: ES modules with @ alias
- **React Version**: 18.2.0+ (Server Components compatible)
- **Next.js Version**: 14.0.0+ (App Router compatible)

## Responsive Design Strategy

The configuration supports mobile-first responsive design:

### Breakpoints

- **Default (mobile)**: No prefix - CSS applies to all screen sizes
- **sm**: 640px - `sm:class-name`
- **md**: 768px - `md:class-name`
- **lg**: 1024px - `lg:class-name`
- **xl**: 1280px - `xl:class-name`
- **2xl**: 1536px - `2xl:class-name`

### Dark Mode

- **Strategy**: Class-based (`dark:class-name`)
- **Implementation**: Add `dark` class to root `<html>` or `<body>` element
- **Preference Detection**: `prefers-color-scheme: dark` media query in globals.css

## Performance Considerations

### PurgeCSS (Content Configuration)

The `content` array in `tailwind.config.ts` ensures only used CSS classes are included in production:

- Scans `.tsx`, `.ts`, `.jsx`, `.js`, `.mdx` files
- Covers all major directories (app, components, lib)
- Automatically removes unused utilities in production build

### File Size Impact

- Development: Full Tailwind utilities available (~500KB)
- Production: Only used utilities included (~50-100KB depending on usage)
- Next.js automatically optimizes CSS during build

## Accessibility Features

### Implemented

- Focus-visible states with ring styles for keyboard navigation
- `antialiased` class for better text rendering
- Semantic HTML structure preserved
- Sufficient color contrast with dark mode support
- Smooth transitions between theme changes

### Best Practices

- All interactive elements have visible focus states
- Color is never the only means of conveying information
- Button components include proper padding and sizing for touch targets
- Text sizes maintain readability across devices

## Next Steps (Dependent Tasks)

### Phase 4 - npm install

- Run `npm install` to install tailwindcss and autoprefixer packages
- Verify configuration files are recognized by build process

### Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
# etc.
```

### Customizing Theme

Edit `tailwind.config.ts` theme.extend section:

```typescript
colors: {
  primary: '#your-brand-color',
  secondary: '#your-secondary-color',
}
```

### Adding Custom Components

Add to `globals.css` in `@layer components` section:

```css
@layer components {
  .my-custom-component {
    @apply /* tailwind classes */;
  }
}
```

## Verification Checklist

- [x] tailwind.config.ts created with proper content paths
- [x] postcss.config.js created with tailwindcss and autoprefixer
- [x] app/globals.css created with @tailwind directives
- [x] components.json created for shadcn/ui configuration
- [x] app/layout.tsx updated to import globals.css
- [x] app/layout.tsx updated with Tailwind CSS classes
- [x] app/page.tsx updated to demonstrate Tailwind utilities
- [x] Dark mode support configured
- [x] Path aliases configured to match tsconfig.json
- [x] All configuration files validated for syntax

## File Paths (Absolute)

- `/Users/pawelkalkun/Projects/private/toys-for-toys/tailwind.config.ts`
- `/Users/pawelkalkun/Projects/private/toys-for-toys/postcss.config.js`
- `/Users/pawelkalkun/Projects/private/toys-for-toys/app/globals.css`
- `/Users/pawelkalkun/Projects/private/toys-for-toys/components.json`
- `/Users/pawelkalkun/Projects/private/toys-for-toys/app/layout.tsx` (modified)
- `/Users/pawelkalkun/Projects/private/toys-for-toys/app/page.tsx` (modified)

## Notes for Development Team

1. **Content Path Updates**: If new directories are created (e.g., `/features/**`), update the content paths in `tailwind.config.ts`

2. **Component Library**: shadcn/ui is ready to use. Add components as needed for the project's design system

3. **Dark Mode**: The class-based approach allows user preference control. Implement theme switcher in the navigation component

4. **Custom Colors**: Add brand colors to `tailwind.config.ts` theme.extend.colors for consistency across the project

5. **CSS Layers**: Use the @layer structure in globals.css to maintain organization and specificity

6. **Performance**: Monitor CSS bundle size during development. Remove unused component classes to reduce final bundle size

## Troubleshooting

### Tailwind Classes Not Working

- Verify file path matches content configuration in tailwind.config.ts
- Restart dev server after adding new directories
- Check for typos in class names

### Dark Mode Not Toggling

- Ensure `dark` class is properly added to html/body element
- Verify `darkMode: 'class'` in tailwind.config.ts
- Check browser DevTools for class attribute changes

### PostCSS Errors

- Ensure tailwindcss and autoprefixer are installed
- Verify postcss.config.js syntax (JSON-like format)
- Restart dev server after configuration changes

### shadcn/ui Component Installation Issues

- Verify components.json exists in project root
- Check path aliases match tsconfig.json
- Ensure all dependencies are installed

---

**Setup Status**: Complete and ready for npm install phase
**Last Updated**: 2025-11-13
