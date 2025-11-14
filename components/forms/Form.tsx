import React from 'react';

/**
 * Form component - Base form wrapper component
 * Provides consistent form structure and handling
 */
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Form content/children */
  children: React.ReactNode;
  /** Callback when form is submitted */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Optional footer content (submit buttons, etc.) */
  footer?: React.ReactNode;
  /** Whether to show divider before footer */
  showDivider?: boolean;
  /** Custom className */
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  title,
  description,
  children,
  onSubmit,
  footer,
  showDivider = true,
  className = '',
  ...props
}) => {
  return (
    <form onSubmit={onSubmit} className={`w-full ${className}`} {...props}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          )}
          {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
      )}

      <div className="space-y-6 mb-6">{children}</div>

      {footer && (
        <>
          {showDivider && <hr className="my-6 border-gray-200 dark:border-slate-700" />}
          <div className="flex gap-3 justify-end">{footer}</div>
        </>
      )}
    </form>
  );
};

export default Form;
