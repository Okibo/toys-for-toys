import React from 'react';

/**
 * Label component - Form label element
 * Provides consistent styling for form labels
 */
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Label text content */
  children: React.ReactNode;
  /** Whether field is required */
  required?: boolean;
  /** Custom className */
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  children,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`
        block
        text-sm
        font-medium
        text-gray-700
        dark:text-gray-200
        mb-2
        ${className}
      `}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-label="required">
          *
        </span>
      )}
    </label>
  );
};

export default Label;
