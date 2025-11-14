/**
 * UI Components Barrel Export
 * Re-exports shadcn/ui components and primitive UI components
 *
 * To add shadcn/ui components, run:
 * npx shadcn-ui@latest add [component-name]
 *
 * Then add the export here:
 * export { Component } from './component';
 */

// Import shadcn/ui components
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

export { Input } from './input';
export type { InputProps } from './input';

export { Label } from './label';
