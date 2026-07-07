import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  asChild?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0F766E] text-white border border-[#0F766E] hover:bg-[#0d6460] hover:border-[#0d6460]',
  secondary: 'bg-white text-[#0F766E] border border-[#0F766E] hover:bg-[#f0fdfb]',
  ghost: 'bg-transparent text-[#111827] border border-[#E5E7EB] hover:bg-[#f3f4f6]',
  danger:
    'bg-[#DC2626] text-white border border-[#DC2626] hover:bg-[#b91c1c] hover:border-[#b91c1c]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-colors duration-150 cursor-pointer',
          'rounded-[4px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
