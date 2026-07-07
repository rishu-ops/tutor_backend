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
          <label htmlFor={inputId} className="block text-sm font-medium text-[#111827] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm text-[#111827] bg-white',
            'border border-[#E5E7EB] rounded-[4px]',
            'placeholder:text-[#6B7280]',
            'focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-[#0F766E]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
