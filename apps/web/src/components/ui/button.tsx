import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'group relative overflow-hidden bg-primary text-primary-foreground shadow-glow hover:brightness-[1.04]',
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

/** Shine sweep used by the primary (orange) button — keep as direct child of `.group`. */
export function ButtonShine() {
  return <span className="btn-shine" aria-hidden />;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    const resolvedVariant = variant ?? 'default';
    const isPrimary = resolvedVariant === 'default';

    return (
      <button
        className={cn(buttonVariants({ variant: resolvedVariant, size, className }))}
        ref={ref}
        {...props}
      >
        {isPrimary ? (
          <>
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {children}
            </span>
            <ButtonShine />
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';
