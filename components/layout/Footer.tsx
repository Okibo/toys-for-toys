import React from 'react';

/**
 * Footer component - Application footer with links and information
 * Includes copyright, navigation links, and social links
 */
interface FooterProps {
  className?: string;
  children?: React.ReactNode;
}

export const Footer: React.FC<FooterProps> = ({
  className = '',
  children,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`
        w-full
        bg-white
        dark:bg-slate-900
        border-t
        border-gray-200
        dark:border-slate-700
        mt-12
        py-8
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-8">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            &copy; {currentYear} Toy-for-Toy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
