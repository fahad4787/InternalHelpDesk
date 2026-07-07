import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        default: 'bg-brand-light text-brand border-brand-muted',
        secondary: 'bg-canvas text-muted border-border-warm',
        success: 'bg-positive-light text-positive border-positive-muted',
        warning: 'bg-amber-light text-amber-accent border-amber-muted',
        danger: 'bg-red-50 text-red-700 border-red-200',
        info: 'bg-positive-light text-positive border-positive-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
