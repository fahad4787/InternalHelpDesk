import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function IntegrationWidgetGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 items-stretch gap-4 md:grid-cols-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface IntegrationWidgetGridItemProps {
  children: ReactNode;
  /** Span full row on md+ (e.g. Slack messenger). */
  fullWidth?: boolean;
  className?: string;
}

export function IntegrationWidgetGridItem({
  children,
  fullWidth = false,
  className,
}: IntegrationWidgetGridItemProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-col',
        fullWidth ? 'md:col-span-6' : 'md:col-span-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
