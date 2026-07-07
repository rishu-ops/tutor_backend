import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger';
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
    'bg-[#4cd681] text-[#00060c] border border-[#00060c] shadow-[3px_3px_0px_#00060c] transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#00060c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#00060c]',
  secondary:
    'bg-white text-[#00060c] border border-[#00060c] shadow-[3px_3px_0px_#00060c] transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#00060c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#00060c]',
  dark: 'bg-[#00060c] text-white border border-[#00060c] shadow-[3px_3px_0px_#00060c] transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#00060c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#00060c]',
  ghost: 'bg-transparent text-[#384148] hover:bg-[#f3f4f6] transition-colors',
  danger:
    'bg-[#DC2626] text-white border border-[#DC2626] hover:bg-[#b91c1c] hover:border-[#b91c1c] transition-colors',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-sm font-semibold h-[32px]',
  md: 'px-5 py-2 text-sm font-semibold h-[40px]',
  lg: 'px-6 py-2.5 text-base font-semibold h-[48px]',
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
          'inline-flex items-center justify-center gap-2 font-semibold',
          'transition-colors duration-150 cursor-pointer',
          'rounded-[var(--radius-btn)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004fcb] focus-visible:ring-offset-2',
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
