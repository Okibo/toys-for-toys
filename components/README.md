# Components Directory

This directory contains all reusable React components for the Toy-for-Toy application.

## Directory Organization

- **`/layout`** - Layout wrapper components (Header, Footer, Container)
- **`/common`** - Common reusable components (Button, Card, Input, Label)
- **`/forms`** - Form-related components (Form, FormField)
- **`/ui`** - shadcn/ui components (to be populated)
- **`/features`** - Feature-specific components (to be created as needed)

## Quick Start

### Import Components

```typescript
// From layout directory
import { Header, Footer, Container } from '@/components/layout';

// From common directory
import { Button, Card, Input, Label } from '@/components/common';

// From forms directory
import { Form, FormField } from '@/components/forms';
```

## Component Examples

### Basic Page Layout

```typescript
import { Header, Footer, Container } from '@/components/layout';

export default function Home() {
  return (
    <>
      <Header>
        <div className="text-xl font-bold">Logo</div>
      </Header>

      <Container size="lg">
        <main className="py-8">
          <h1>Welcome</h1>
        </main>
      </Container>

      <Footer>
        <p>Copyright 2024</p>
      </Footer>
    </>
  );
}
```

### Form Example

```typescript
import { Form, FormField } from '@/components/forms';
import { Button } from '@/components/common';

export function SignUpForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <Form
      title="Create Account"
      description="Sign up for Toy-for-Toy"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" type="button">Cancel</Button>
          <Button variant="primary" type="submit">Sign Up</Button>
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
        helperText="Minimum 8 characters"
      />
    </Form>
  );
}
```

### Card with Content

```typescript
import { Card } from '@/components/common';
import { Button } from '@/components/common';

export function ToyCard({ toy }) {
  return (
    <Card
      title={toy.name}
      subtitle={toy.category}
    >
      <img src={toy.image} alt={toy.name} className="w-full rounded-lg mb-4" />
      <p className="text-gray-600">{toy.description}</p>

      <div className="flex gap-2 mt-4" slot="footer">
        <Button variant="secondary" size="sm">Details</Button>
        <Button variant="primary" size="sm">Request</Button>
      </div>
    </Card>
  );
}
```

### Button Variants

```typescript
import { Button } from '@/components/common';

export function ButtonShowcase() {
  return (
    <div className="space-y-4 p-8">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>

      <div className="space-y-2 mt-4">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>

      <Button isLoading>Loading...</Button>
    </div>
  );
}
```

## Component Specifications

### Button

**Variants**: `primary`, `secondary`, `outline`, `ghost`, `destructive`
**Sizes**: `sm`, `md`, `lg`
**Props**: `variant`, `size`, `isLoading`, `className`, + HTML button attributes

### Card

**Props**: `title`, `subtitle`, `children`, `footer`, `className`, `showDivider`

### Input

**Props**: `type`, `error`, `errorMessage`, `containerClassName`, `inputClassName`, + HTML input attributes

### Label

**Props**: `children`, `required`, `className`, + HTML label attributes

### Header

**Props**: `className`, `children`

### Footer

**Props**: `className`, `children`

### Container

**Props**: `className`, `children`, `size` (sm|md|lg|xl)

### Form

**Props**: `title`, `description`, `children`, `onSubmit`, `footer`, `showDivider`, `className`, + HTML form attributes

### FormField

**Props**: `label`, `name`, `required`, `error`, `helperText`, `type`, `containerClassName`, `inputClassName`, + HTML input attributes

## Styling

All components use **Tailwind CSS** for styling. They include:

- Dark mode support with `dark:` prefixes
- Responsive design with mobile-first approach
- Proper spacing and color consistency
- Focus states for accessibility

## Best Practices

1. **Composition**: Build larger components from smaller ones
2. **Props**: Use TypeScript interfaces for proper typing
3. **Reusability**: Keep components generic and flexible
4. **Dark Mode**: Test components in both light and dark modes
5. **Accessibility**: Ensure keyboard navigation and screen reader support

## Adding New Components

1. Create component file in appropriate directory
2. Add TypeScript interface for props
3. Implement with Tailwind CSS styling
4. Export from directory's `index.ts`
5. Add JSDoc comments for props
6. Test in different themes and screen sizes

## Testing Components

Components are ready for testing with:

- Jest for unit tests
- React Testing Library for component testing
- Playwright for E2E tests

## Dark Mode

All components support dark mode. Test by toggling dark mode in your application:

```typescript
// In app configuration
export const darkModeEnabled = true; // Toggle to test
```

## Related Files

- `/docs/COMPONENT_STRUCTURE.md` - Detailed component structure documentation
- `/tsconfig.json` - Path alias configuration (@/components)
- `tailwind.config.js` - Tailwind CSS configuration

## Contributing

When adding new components:

1. Follow the existing code style
2. Use TypeScript with strict mode
3. Include dark mode support
4. Add JSDoc comments
5. Test on mobile and desktop
6. Update this README if adding new patterns

## Troubleshooting

**Import errors**: Check path aliases in `tsconfig.json`
**Styling issues**: Verify Tailwind CSS is properly configured
**Dark mode not working**: Check dark mode configuration in your app
**TypeScript errors**: Run `npm run build` to see full compilation errors

## Next Steps

- Add feature-specific components in `/components/features/`
- Integrate shadcn/ui components in `/components/ui/`
- Create component tests in `/tests/components/`
- Set up Storybook for component documentation (optional)
