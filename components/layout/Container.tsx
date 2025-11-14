import React from 'react';

/**
 * Container component - Responsive content container
 * Provides consistent max-width and padding across the application
 */
interface ContainerProps {
  className?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Container: React.FC<ContainerProps> = ({ className = '', children, size = 'lg' }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-7xl',
  };

  return (
    <div
      className={`
        mx-auto
        px-4
        sm:px-6
        lg:px-8
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Container;
