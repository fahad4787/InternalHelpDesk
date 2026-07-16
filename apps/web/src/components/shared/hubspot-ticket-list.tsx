import { format } from 'date-fns';
import { CalendarClock, ExternalLink, Flag, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HubSpotTicket } from '@/services/hubspot.service';

interface HubSpotTicketListProps {
  tickets: HubSpotTicket[];
}

const PRIORITY_VARIANT: Record<string, 'danger' | 'warning' | 'secondary'> = {
  HIGH: 'danger',
  URGENT: 'danger',
  MEDIUM: 'warning',
  LOW: 'secondary',
};

function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function TicketCard({ ticket }: { ticket: HubSpotTicket }) {
  const priorityVariant = ticket.priority
    ? PRIORITY_VARIANT[ticket.priority.toUpperCase()] ?? 'secondary'
    : 'secondary';

  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">
              {ticket.subject}
            </h3>
            {ticket.priority && (
              <Badge variant={priorityVariant}>
                {formatLabel(ticket.priority)}
              </Badge>
            )}
          </div>

          {ticket.content && (
            <p className="mb-2 line-clamp-2 text-sm text-muted">
              {ticket.content}
            </p>
          )}

          <div className="space-y-1.5 text-sm text-muted">
            {ticket.stage && (
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 shrink-0 text-brand" />
                <span>{formatLabel(ticket.stage)}</span>
              </div>
            )}
            {ticket.pipeline && (
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 shrink-0 text-brand" />
                <span>{formatLabel(ticket.pipeline)}</span>
              </div>
            )}
            {ticket.createdAt && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0 text-brand" />
                <span>
                  Opened {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            <p className="text-xs text-muted">
              Updated {format(new Date(ticket.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {ticket.webUrl && (
          <a
            href={ticket.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-brand hover:text-brand-hover"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        )}
      </div>
    </article>
  );
}

export function HubSpotTicketList({ tickets }: HubSpotTicketListProps) {
  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
