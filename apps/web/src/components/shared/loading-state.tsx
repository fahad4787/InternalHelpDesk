import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton, SkeletonText } from '@/components/shared/skeleton';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-8 w-8 animate-spin rounded-full border-[3px] border-brand border-t-transparent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}
      role="status"
      aria-live="polite"
    >
      <Spinner />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <Spinner className="h-9 w-9 border-4" />
    </div>
  );
}

export function ConnectionCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56 max-w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 shrink-0 rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function ProfileCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-5 w-32" />
        <SkeletonText lines={3} />
      </CardContent>
    </Card>
  );
}

export function WidgetPanelSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonText lines={4} />
      </CardContent>
    </Card>
  );
}

export function FocusBannerSkeleton() {
  return (
    <div className="dashboard-focus-banner mb-6 rounded-2xl p-5 sm:p-6" aria-hidden>
      <Skeleton className="h-3 w-52 bg-white/15" />
      <Skeleton className="mt-3 h-8 w-full max-w-2xl bg-white/15" />
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-8 w-36 rounded-full bg-white/15" />
        <Skeleton className="h-8 w-40 rounded-full bg-white/15" />
        <Skeleton className="h-8 w-32 rounded-full bg-white/15" />
      </div>
    </div>
  );
}

export function DashboardWidgetsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-0 md:col-span-3">
          <Skeleton className="h-[28rem] w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-2xl border border-border-warm bg-white p-4"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-warm bg-white shadow-sm">
      <div className="border-b border-border-warm bg-canvas px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border-warm/70">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn('h-4', colIndex === 0 ? 'w-32' : 'w-24')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function IntegrationMarketplaceSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function WidgetContentSkeleton({ lines = 4 }: { lines?: number }) {
  return <SkeletonText lines={lines} className="py-1" />;
}

export function FormCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </CardContent>
    </Card>
  );
}
