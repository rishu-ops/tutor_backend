import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'muted';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#f0fdfb] text-[#0F766E] border-[#0F766E]/30',
  success: 'bg-[#f0fdf4] text-[#16A34A] border-[#16A34A]/30',
  warning: 'bg-[#fffbeb] text-[#F59E0B] border-[#F59E0B]/30',
  error: 'bg-[#fef2f2] text-[#DC2626] border-[#DC2626]/30',
  muted: 'bg-[#f3f4f6] text-[#6B7280] border-[#E5E7EB]',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-[4px]',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
