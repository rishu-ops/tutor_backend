import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-[#384148] uppercase tracking-wider mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 text-sm text-[#00060c] bg-white transition-all',
            'border border-[#dadee2] ',
            'placeholder:text-[#647380]',
            'focus:outline-none focus:ring-2 focus:ring-[#00A453] focus:border-[#00A453]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[#DC2626] font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
