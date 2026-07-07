import { cn } from '@/lib/utils';

interface WorkhubLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'sidebar' | 'default';
}

const sizeMap = {
  sm: { box: 'h-8 w-8 text-sm rounded-lg', title: 'text-sm', subtitle: 'text-[9px]' },
  md: { box: 'h-9 w-9 text-sm rounded-xl', title: 'text-sm', subtitle: 'text-[10px]' },
  lg: { box: 'h-11 w-11 text-base rounded-xl', title: 'text-xl', subtitle: 'text-xs' },
};

export function WorkhubLogo({
  size = 'md',
  showText = true,
  className,
  variant = 'default',
}: WorkhubLogoProps) {
  const s = sizeMap[size];
  const isSidebar = variant === 'sidebar';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center bg-gradient-to-br from-brand via-[#ff8a6a] to-[#e85a38] font-bold text-white shadow-md shadow-brand/30',
          s.box,
        )}
        aria-hidden
      >
        W
      </div>
      {showText && (
        <div>
          <span
            className={cn(
              'font-bold font-heading',
              s.title,
              isSidebar ? 'text-white' : 'text-ink',
            )}
          >
            Workhub
          </span>
          <p
            className={cn(
              'uppercase tracking-wider',
              s.subtitle,
              isSidebar ? 'text-sidebar-muted' : 'text-muted',
            )}
          >
            Employee Experience
          </p>
        </div>
      )}
    </div>
  );
}
