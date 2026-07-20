'use client';

export function SectionKicker({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      data-reveal
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${light ? 'text-primary' : 'text-primary'}`}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-glow" />
      {children}
    </div>
  );
}
