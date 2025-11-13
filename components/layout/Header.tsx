import React from 'react';

/**
 * Header component - Top navigation header for the application
 * Provides navigation and branding
 */
interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  className = '',
  children,
}) => {
  return (
    <header
      className={`
        w-full
        bg-white
        dark:bg-slate-900
        border-b
        border-gray-200
        dark:border-slate-700
        shadow-sm
        ${className}
      `}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {children}
        </div>
      </nav>
    </header>
  );
};

export default Header;
