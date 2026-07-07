import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-brand text-white shadow-md shadow-brand/25 hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30',
        secondary:
          'bg-canvas text-ink border border-border-warm hover:bg-white hover:border-border-warm',
        outline:
          'border border-border-warm bg-white text-ink shadow-sm hover:border-brand hover:bg-brand-light hover:text-brand',
        ghost: 'text-muted hover:bg-canvas hover:text-ink',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        link: 'text-brand underline-offset-4 hover:text-brand-hover hover:underline p-0 h-auto shadow-none',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3.5 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
