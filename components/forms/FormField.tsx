import React from 'react';
import { Label } from '../common/Label';
import { Input } from '../common/Input';

/**
 * FormField component - Form field wrapper with label and input
 * Provides consistent field structure and validation display
 * Ready for integration with react-hook-form
 */
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label text */
  label?: string;
  /** Field name/id */
  name: string;
  /** Whether field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text below field */
  helperText?: string;
  /** Input type */
  type?: string;
  /** Custom className for container */
  containerClassName?: string;
  /** Custom className for input */
  inputClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  required = false,
  error,
  helperText,
  type = 'text',
  containerClassName = '',
  inputClassName = '',
  ...props
}) => {
  const hasError = Boolean(error);

  return (
    <div className={containerClassName}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        error={hasError}
        errorMessage={error}
        inputClassName={inputClassName}
        {...props}
      />
      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default FormField;
