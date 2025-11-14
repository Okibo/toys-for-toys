import React from 'react';

/**
 * Card component - Container for grouped content
 * Provides consistent styling for content cards
 */
interface CardProps {
  /** Optional title for the card */
  title?: React.ReactNode;
  /** Optional subtitle or description */
  subtitle?: React.ReactNode;
  /** Main card content */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Whether to show a divider between sections */
  showDivider?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  showDivider = true,
}) => {
  return (
    <div
      className={`
        bg-white
        dark:bg-slate-800
        rounded-lg
        border
        border-gray-200
        dark:border-slate-700
        shadow-sm
        overflow-hidden
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          )}
          {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}

      {(title || subtitle) && showDivider && (
        <hr className="border-gray-200 dark:border-slate-700" />
      )}

      <div className="px-6 py-4">{children}</div>

      {footer && (
        <>
          {showDivider && <hr className="border-gray-200 dark:border-slate-700" />}
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700">{footer}</div>
        </>
      )}
    </div>
  );
};

export default Card;
