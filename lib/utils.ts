/**
 * lib/utils.ts
 *
 * Utility functions for the application.
 * Includes className merging (clsx + tailwind-merge) and other helpers.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes intelligently.
 * Combines clsx for conditional classes with twMerge to handle conflicting Tailwind utilities.
 *
 * @param inputs - Class values (strings, objects, arrays)
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
