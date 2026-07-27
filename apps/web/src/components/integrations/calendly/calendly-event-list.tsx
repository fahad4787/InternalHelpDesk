import { format, formatDistanceToNow } from 'date-fns';
import { CalendarClock, MapPin, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendlyScheduledEvent } from '@/services/calendly.service';

interface CalendlyEventListProps {
  events: CalendlyScheduledEvent[];
}

export function CalendlyEventList({ events }: CalendlyEventListProps) {
  return (
    <div className="space-y-3">
      {events.map((event) => {
        const start = new Date(event.startAt);
        const end = new Date(event.endAt);

        return (
          <article
            key={event.uri}
            className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="info">{event.status}</Badge>
                </div>
                <h3 className="text-base font-semibold text-ink">{event.name}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 shrink-0 text-brand" />
                    <span>
                      {format(start, 'MMM d, yyyy · h:mm a')} –{' '}
                      {format(end, 'h:mm a')}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-brand" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted">
                    Starts {formatDistanceToNow(start, { addSuffix: true })}
                  </p>
                </div>
              </div>

              {event.meetingUrl && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm">
                    <Video className="mr-2 h-4 w-4" />
                    Join
                  </Button>
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
