import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-[#384148] uppercase tracking-wider mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-3 text-sm text-[#00060c] bg-white transition-all appearance-none pr-10',
              'border border-[#dadee2] rounded-[12px]',
              'focus:outline-none focus:ring-2 focus:ring-[#00A453] focus:border-[#00A453]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#647380]">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-[#DC2626] font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
