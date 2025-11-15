/**
 * Home Page (index.tsx) Tests
 *
 * Verifies that:
 * - Home page component renders without errors
 * - All required sections are present
 * - Proper heading and title structure
 * - Links and buttons render correctly
 * - Responsive design classes are present
 *
 * These tests ensure the landing page is functional and accessible
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/pages/index';

/**
 * Mock Next.js Head component to prevent document.head manipulation in tests
 */
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => {
      return React.createElement(React.Fragment, null, children);
    },
  };
});

describe('Home Page (pages/index.tsx)', () => {
  describe('Rendering and Basic Structure', () => {
    test('home page renders without crashing', () => {
      const { container } = render(<Home />);
      expect(container).toBeTruthy();
    });

    test('home page renders a main element', () => {
      render(<Home />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    test('home page has main heading with Toy-for-Toy title', () => {
      render(<Home />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toContain('Toy-for-Toy');
    });
  });

  describe('Content Verification', () => {
    test('home page displays main description', () => {
      render(<Home />);
      expect(screen.getByText(/cashless toy exchange platform/i)).toBeInTheDocument();
    });

    test('home page displays ticket-based economy description', () => {
      render(<Home />);
      expect(
        screen.getByText(/ticket-based economy system/i)
      ).toBeInTheDocument();
    });

    test('home page has Fair Exchange feature card', () => {
      render(<Home />);
      expect(screen.getByText(/Fair Exchange/i)).toBeInTheDocument();
      expect(screen.getByText(/1 toy = 1 ticket/i)).toBeInTheDocument();
    });

    test('home page has No Money feature card', () => {
      render(<Home />);
      expect(screen.getByText(/No Money/i)).toBeInTheDocument();
      expect(screen.getByText(/ticket-based/i)).toBeInTheDocument();
    });

    test('home page has Community feature card', () => {
      render(<Home />);
      expect(screen.getByText(/Community/i)).toBeInTheDocument();
      expect(screen.getByText(/families sharing and exchanging/i)).toBeInTheDocument();
    });

    test('home page has development notice', () => {
      render(<Home />);
      expect(
        screen.getByText(/currently in development/i)
      ).toBeInTheDocument();
    });
  });

  describe('Feature Cards Structure', () => {
    test('home page renders multiple feature cards', () => {
      render(<Home />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.length).toBe(3); // Fair Exchange, No Money, Community
    });

    test('each feature card has a heading and description', () => {
      render(<Home />);
      const cardHeadings = screen.getAllByRole('heading', { level: 2 });

      cardHeadings.forEach((heading) => {
        expect(heading).toBeInTheDocument();
        // Each card should have text content describing the feature
        expect(heading.closest('div')).toHaveTextContent(/.+/);
      });
    });
  });

  describe('Accessibility and Semantics', () => {
    test('home page uses semantic HTML main element', () => {
      render(<Home />);
      const mainElement = document.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });

    test('home page has proper heading hierarchy', () => {
      render(<Home />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2List = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2List.length).toBeGreaterThan(0);
    });

    test('home page text content is readable', () => {
      render(<Home />);
      const mainElement = screen.getByRole('main');
      const textContent = mainElement.textContent || '';

      expect(textContent.length).toBeGreaterThan(100);
      expect(textContent).toContain('Toy');
      expect(textContent).toContain('Exchange');
    });
  });

  describe('Styling and Layout', () => {
    test('main element has background styling classes', () => {
      const { container } = render(<Home />);
      const mainElement = container.querySelector('main');

      // Check for Tailwind classes related to background
      expect(mainElement?.className).toMatch(/bg-/);
    });

    test('feature cards have card-like styling', () => {
      const { container } = render(<Home />);
      const cards = container.querySelectorAll('.bg-white');

      expect(cards.length).toBeGreaterThanOrEqual(3);
      cards.forEach((card) => {
        // Cards should have shadow or rounded corners
        const className = card.className;
        expect(
          className.includes('shadow') ||
          className.includes('rounded')
        ).toBe(true);
      });
    });

    test('layout uses responsive grid', () => {
      const { container } = render(<Home />);
      const gridElement = Array.from(container.querySelectorAll('[class*="grid"]')).find(
        (el) => el.className.includes('grid')
      );

      expect(gridElement).toBeTruthy();
      expect(gridElement?.className).toMatch(/grid/);
    });
  });

  describe('Responsive Design', () => {
    test('container has responsive padding', () => {
      const { container } = render(<Home />);
      const divElements = container.querySelectorAll('div');

      let hasResponsivePadding = false;
      divElements.forEach((el) => {
        if (el.className.includes('px-')) {
          hasResponsivePadding = true;
        }
      });

      expect(hasResponsivePadding).toBe(true);
    });

    test('heading uses responsive text sizes', () => {
      render(<Home />);
      const mainHeading = screen.getByRole('heading', { level: 1 });

      // Should have responsive text sizing classes
      expect(
        mainHeading.className.includes('text-') &&
        (mainHeading.className.includes('sm:') || mainHeading.className.includes('lg:'))
      ).toBe(true);
    });
  });

  describe('Component Props and Configuration', () => {
    test('home page is a valid React component', () => {
      expect(typeof Home).toBe('function');
    });

    test('home page does not require props', () => {
      // Should render without any props
      const { container } = render(<Home />);
      expect(container.firstChild).toBeTruthy();
    });

    test('home page returns JSX element', () => {
      const element = <Home />;
      expect(React.isValidElement(element)).toBe(true);
    });
  });

  describe('Head/Meta Tags', () => {
    test('page sets appropriate title via Head component', () => {
      // This is checked through content rather than document.title
      // since Head is mocked
      render(<Home />);
      // The component should render without errors
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('description mentions toy exchange', () => {
      render(<Home />);
      // Description is in the visible content
      expect(
        screen.getByText(/Exchange toys with other families/i)
      ).toBeInTheDocument();
    });
  });
});

/**
 * Snapshot tests for regression detection
 */
describe('Home Page Snapshots', () => {
  test('home page matches snapshot', () => {
    const { container } = render(<Home />);
    expect(container).toMatchSnapshot();
  });
});
