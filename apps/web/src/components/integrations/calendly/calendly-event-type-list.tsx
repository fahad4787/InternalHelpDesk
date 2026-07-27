import { ExternalLink, Clock3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendlyEventType } from '@/services/calendly.service';

interface CalendlyEventTypeListProps {
  eventTypes: CalendlyEventType[];
}

export function CalendlyEventTypeList({ eventTypes }: CalendlyEventTypeListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {eventTypes.map((eventType) => (
        <article
          key={eventType.uri}
          className="flex items-start justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
        >
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="info">Event type</Badge>
              {eventType.durationMinutes != null && (
                <Badge variant="secondary">
                  <Clock3 className="mr-1 h-3 w-3" />
                  {eventType.durationMinutes} min
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-ink">{eventType.name}</h3>
            {eventType.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {eventType.description}
              </p>
            )}
          </div>

          {eventType.schedulingUrl && (
            <a
              href={eventType.schedulingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
