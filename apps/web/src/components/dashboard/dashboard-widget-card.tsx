'use client';

import { ChevronDown, ExternalLink, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDashboardWidgetShell } from './dashboard-widget-shell-context';

interface DashboardWidgetCardProps {
  source: string;
  sourceLogo: ReactNode;
  title: string;
  deepLinkHref?: string | null;
  deepLinkLabel?: string;
  children: ReactNode;
  className?: string;
  /** When true, body content fills the card without an inner scroll region (e.g. embeds). */
  fillContent?: boolean;
  /** When false, the widget body starts collapsed. */
  defaultExpanded?: boolean;
}

export function DashboardWidgetCard({
  source,
  sourceLogo,
  title,
  deepLinkHref,
  deepLinkLabel = 'Open',
  children,
  className,
  fillContent = false,
  defaultExpanded = true,
}: DashboardWidgetCardProps) {
  const shell = useDashboardWidgetShell();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isExternal = deepLinkHref?.startsWith('http');

  return (
    <Card
      className={cn(
        'flex min-h-0 min-w-0 flex-col overflow-hidden',
        expanded ? 'h-full max-h-[28rem]' : 'h-auto',
        className,
      )}
    >
      <CardHeader className="widget-card-header shrink-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="shrink-0">{sourceLogo}</div>
            <button
              type="button"
              onClick={(event) => {
                setExpanded((current) => !current);
                event.currentTarget.blur();
              }}
              aria-expanded={expanded}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg text-left outline-none focus:outline-none focus-visible:outline-none"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {source}
                </p>
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted transition-transform duration-200',
                  expanded ? 'rotate-180' : 'rotate-0',
                )}
                aria-hidden
              />
            </button>
          </div>

          {shell && (
            <button
              type="button"
              draggable
              onDragStart={shell.onDragStart}
              onDragEnd={shell.onDragEnd}
              title="Drag to reorder"
              aria-label="Drag to reorder widget"
              className="flex shrink-0 cursor-grab flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <GripVertical className="h-4 w-4" aria-hidden />
              <span className="text-[9px] font-bold uppercase tracking-wider">Drag</span>
            </button>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
          <div
            className={cn(
              'min-h-0 flex-1',
              fillContent ? 'overflow-hidden' : 'overflow-y-auto pr-1',
            )}
          >
            {children}
          </div>
          {deepLinkHref && (
            <div className="mt-4 shrink-0 border-t border-border-warm pt-3">
              {isExternal ? (
                <a
                  href={deepLinkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {deepLinkLabel}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : (
                <Link
                  href={deepLinkHref}
                  className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {deepLinkLabel}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
