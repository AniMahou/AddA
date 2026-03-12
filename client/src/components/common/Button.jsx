import React from 'react';
import { FiLoader } from 'react-icons/fi';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,  // Can be either a component or JSX
  onClick,
  className = '',
  ...props
}) => {
  console.log('Button rendering');
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 focus:ring-primary-500 disabled:from-gray-400 disabled:to-gray-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 disabled:border-gray-400 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'cursor-not-allowed opacity-60' : '',
    className,
  ].join(' ');

  // Render icon based on what was passed
  const renderIcon = () => {
    if (loading) return <FiLoader className="animate-spin mr-2" />;
    if (!icon) return null;
    
    // If icon is a React element (JSX), render it directly
    if (React.isValidElement(icon)) {
      return <span className="mr-2">{icon}</span>;
    }
    
    // If icon is a component, create it
    const IconComponent = icon;
    return <IconComponent className="mr-2" />;
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderIcon()}
      {children}
    </button>
  );
};

export default Button;