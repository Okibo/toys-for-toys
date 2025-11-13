# Component Directory Structure - Phase 3 (GREEN)

This document outlines the component structure created for the Toy-for-Toy project.

## Directory Structure

```
/components/
├── /layout/                  # Layout components
│   ├── Header.tsx           # Top navigation header
│   ├── Footer.tsx           # Application footer
│   ├── Container.tsx        # Responsive container wrapper
│   └── index.ts             # Barrel export
├── /common/                 # Common reusable components
│   ├── Button.tsx           # Primary button component
│   ├── Card.tsx             # Card container for content
│   ├── Input.tsx            # Form input field
│   ├── Label.tsx            # Form label
│   └── index.ts             # Barrel export
├── /forms/                  # Form components
│   ├── Form.tsx             # Base form wrapper
│   ├── FormField.tsx        # Form field with label and input
│   └── index.ts             # Barrel export
└── /ui/                     # shadcn/ui components
    ├── index.ts             # Re-export shadcn/ui components
    └── .gitkeep             # Directory placeholder
```

## Component Details

### Layout Components (`/components/layout/`)

#### Header.tsx
- **Purpose**: Top navigation header for the application
- **Props**:
  - `className?: string` - Custom CSS classes
  - `children?: React.ReactNode` - Navigation content
- **Features**:
  - Responsive navigation wrapper
  - Dark mode support
  - Shadow and border styling
  - Flexible children support for custom navigation

#### Footer.tsx
- **Purpose**: Application footer with copyright and links
- **Props**:
  - `className?: string` - Custom CSS classes
  - `children?: React.ReactNode` - Footer content
- **Features**:
  - Automatic current year copyright
  - Dark mode support
  - Clean divider styling
  - Responsive padding

#### Container.tsx
- **Purpose**: Responsive content container with consistent max-width
- **Props**:
  - `className?: string` - Custom CSS classes
  - `children: React.ReactNode` - Container content
  - `size?: 'sm' | 'md' | 'lg' | 'xl'` - Container size variant
- **Features**:
  - Multiple size options for different layouts
  - Responsive padding (mobile-first)
  - Consistent max-width across the app

### Common Components (`/components/common/`)

#### Button.tsx
- **Purpose**: Primary button component with multiple variants
- **Props**:
  - `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'`
  - `size?: 'sm' | 'md' | 'lg'`
  - `isLoading?: boolean` - Shows loading spinner when true
  - `className?: string` - Additional CSS classes
  - All standard HTML button attributes
- **Features**:
  - 5 visual variants with dark mode support
  - 3 size options
  - Loading state with spinner animation
  - Focus ring styling for accessibility
  - Disabled state handling

#### Card.tsx
- **Purpose**: Container component for grouped content
- **Props**:
  - `title?: React.ReactNode` - Card title
  - `subtitle?: React.ReactNode` - Card subtitle
  - `children: React.ReactNode` - Main content
  - `footer?: React.ReactNode` - Optional footer section
  - `className?: string` - Additional CSS classes
  - `showDivider?: boolean` - Show dividers between sections
- **Features**:
  - Clean card styling with borders and shadow
  - Dark mode support
  - Optional title, subtitle, and footer sections
  - Automatic divider lines between sections

#### Input.tsx
- **Purpose**: Form input field with validation support
- **Props**:
  - `type?: string` - Input type (text, email, password, etc.)
  - `error?: boolean` - Error state flag
  - `errorMessage?: string` - Error message to display
  - `containerClassName?: string` - Wrapper class
  - `inputClassName?: string` - Input element class
  - All standard HTML input attributes
- **Features**:
  - Error state styling (red border)
  - Error message display
  - Dark mode support
  - Disabled state styling
  - Focus ring styling

#### Label.tsx
- **Purpose**: Form label with optional required indicator
- **Props**:
  - `children: React.ReactNode` - Label text
  - `required?: boolean` - Show required asterisk
  - `className?: string` - Additional CSS classes
  - All standard HTML label attributes
- **Features**:
  - Required field indicator (red asterisk)
  - Consistent typography
  - Dark mode support
  - Accessibility support

### Form Components (`/components/forms/`)

#### Form.tsx
- **Purpose**: Base form wrapper with consistent structure
- **Props**:
  - `title?: string` - Form title
  - `description?: string` - Form description
  - `children: React.ReactNode` - Form fields
  - `onSubmit: (e: React.FormEvent) => void` - Submit handler
  - `footer?: React.ReactNode` - Footer content (buttons)
  - `showDivider?: boolean` - Show divider before footer
  - `className?: string` - Additional CSS classes
  - All standard HTML form attributes
- **Features**:
  - Consistent form structure and spacing
  - Optional title and description
  - Footer section for submit buttons
  - Automatic spacing between elements
  - Dark mode support

#### FormField.tsx
- **Purpose**: Complete form field with label, input, and validation
- **Props**:
  - `label?: string` - Field label text
  - `name: string` - Field name and id
  - `required?: boolean` - Mark as required
  - `error?: string` - Error message
  - `helperText?: string` - Helper text below input
  - `type?: string` - Input type
  - `containerClassName?: string` - Wrapper class
  - `inputClassName?: string` - Input class
  - All standard HTML input attributes
- **Features**:
  - Integrated Label component
  - Integrated Input component with validation
  - Helper text support
  - Error display
  - Ready for react-hook-form integration

### UI Components (`/components/ui/`)

Reserved for shadcn/ui components. Currently contains:
- `index.ts` - Barrel export file with instructions
- `.gitkeep` - Directory placeholder

To add shadcn/ui components:
```bash
npx shadcn-ui@latest add [component-name]
```

Then add the export to `index.ts`:
```typescript
export { Button } from './button';
export { Input } from './input';
```

## Usage Examples

### Using Layout Components

```typescript
import { Header, Footer, Container } from '@/components/layout';
import { Button } from '@/components/common';

export default function Page() {
  return (
    <>
      <Header>
        <div>Logo</div>
        <nav>Navigation</nav>
      </Header>

      <Container size="lg">
        <h1>Welcome</h1>
      </Container>

      <Footer>
        <p>Links and info</p>
      </Footer>
    </>
  );
}
```

### Using Common Components

```typescript
import { Button, Card, Input, Label } from '@/components/common';

export function MyComponent() {
  return (
    <Card title="Settings" subtitle="Manage your preferences">
      <Label htmlFor="username" required>
        Username
      </Label>
      <Input
        id="username"
        placeholder="Enter username"
      />

      <Button variant="primary" size="md">
        Save
      </Button>
    </Card>
  );
}
```

### Using Form Components

```typescript
import { Form, FormField } from '@/components/forms';
import { Button } from '@/components/common';

export function LoginForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission
  };

  return (
    <Form
      title="Login"
      description="Sign in to your account"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary" type="submit">Login</Button>
        </>
      }
    >
      <FormField
        label="Email"
        name="email"
        type="email"
        required
        placeholder="your@email.com"
      />

      <FormField
        label="Password"
        name="password"
        type="password"
        required
        placeholder="••••••••"
      />
    </Form>
  );
}
```

## Styling Approach

All components use **Tailwind CSS** utility classes for styling:
- **Mobile-first approach**: Base styles for mobile, then responsive breakpoints
- **Dark mode support**: `dark:` prefixes for dark mode variants
- **Consistent spacing**: Uses Tailwind spacing scale (px-4, py-2, etc.)
- **Color palette**: Uses standard Tailwind colors (gray, blue, red, etc.)

## TypeScript Support

All components have:
- Full TypeScript support with strict mode enabled
- Proper prop interfaces using JSDoc comments
- Exported prop types for external use
- No `any` types

## Barrel Exports

Each subdirectory has an `index.ts` file that re-exports all components:

```typescript
// Import from directory
import { Button, Card, Input, Label } from '@/components/common';

// Or import directly
import { Button } from '@/components/common/Button';
```

## Accessibility

Components include:
- Semantic HTML elements (`<header>`, `<footer>`, `<label>`, `<button>`)
- ARIA attributes where needed
- Focus ring styling for keyboard navigation
- Proper color contrast ratios
- Required field indicators

## Dark Mode

All components support dark mode with Tailwind CSS `dark:` prefixes:
- Background colors adapt
- Text colors adapt
- Border colors adapt
- Focus states adapt

## Next Steps

1. **Install shadcn/ui** components as needed
2. **Create feature components** in `/components/features/` for domain-specific UI
3. **Extend components** with additional variants or props as needed
4. **Add tests** for components in `/tests/components/`
5. **Integrate with react-hook-form** for advanced form handling

## File Count Summary

- **Layout components**: 3 (Header, Footer, Container) + 1 index file
- **Common components**: 4 (Button, Card, Input, Label) + 1 index file
- **Form components**: 2 (Form, FormField) + 1 index file
- **UI directory**: 1 index file + .gitkeep
- **Total**: 14 files created

## Success Criteria Met

- [x] All component directories created
- [x] All base components created with proper TypeScript
- [x] Barrel exports set up for easy importing
- [x] Components use Tailwind CSS for styling
- [x] Dark mode support implemented
- [x] No TypeScript errors (strict mode enabled)
- [x] Components ready to be extended
- [x] Path aliases (@/components) configured in tsconfig.json
- [x] JSDoc comments for all component props
- [x] Responsive design with mobile-first approach
