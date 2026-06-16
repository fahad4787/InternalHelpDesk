import { differenceInHours, differenceInMinutes, format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  User,
  Users,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/api.types';

interface MeetEventListProps {
  events: CalendarEvent[];
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDuration(start: Date, end: Date): string {
  const minutes = differenceInMinutes(end, start);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatSchedule(event: CalendarEvent): string {
  const start = new Date(event.start);
  const end = new Date(event.end);

  if (event.allDay) {
    return format(start, 'EEEE, MMMM d, yyyy');
  }

  return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')} (${formatDuration(start, end)})`;
}

function formatStartsIn(start: Date): string {
  const label = formatDistanceToNow(start, { addSuffix: true });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getStartsInStyles(start: Date): string {
  const hoursUntil = differenceInHours(start, new Date());
  if (hoursUntil < 24) {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }
  if (hoursUntil < 24 * 7) {
    return 'border-brand-muted bg-brand-light text-brand';
  }
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function MeetEventCard({ event }: { event: CalendarEvent }) {
  const start = new Date(event.start);
  const description = event.description ? stripHtml(event.description) : null;
  const startsIn = formatStartsIn(start);
  const startsInStyles = getStartsInStyles(start);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex">
        <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-3 border-r border-brand-muted/60 bg-gradient-to-b from-brand-light to-white px-3 py-5 text-center sm:w-32">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              {format(start, 'MMM')}
            </span>
            <span className="mt-0.5 block text-3xl font-bold leading-none text-slate-900">
              {format(start, 'd')}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              {format(start, 'EEE')}
            </span>
          </div>
          <span
            className={`w-full rounded-xl border px-2.5 py-2.5 text-sm font-bold leading-snug sm:text-base ${startsInStyles}`}
          >
            {startsIn}
          </span>
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="info">Google Meet</Badge>
                {event.meetCode && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {event.meetCode}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                {event.title}
              </h3>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4 shrink-0 text-brand" />
              <span>{formatSchedule(event)}</span>
            </div>

            {(event.organizerName || event.organizerEmail) && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="h-4 w-4 shrink-0 text-brand" />
                <span>
                  {event.organizerName ?? event.organizerEmail}
                  {event.organizerName && event.organizerEmail && (
                    <span className="text-slate-400"> · {event.organizerEmail}</span>
                  )}
                </span>
              </div>
            )}

            {event.attendeeCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 shrink-0 text-brand" />
                <span>
                  {event.attendeeCount} attendee{event.attendeeCount === 1 ? '' : 's'}
                </span>
              </div>
            )}

            {event.location && !event.location.includes('meet.google.com') && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            {description && (
              <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            {event.meetLink && (
              <a
                href={event.meetLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm">
                  <Video className="mr-2 h-4 w-4" />
                  Join Meet
                </Button>
              </a>
            )}
            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Open in Calendar
                </Button>
              </a>
            )}
            {event.meetLink && (
              <a
                href={event.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto hidden text-brand hover:text-brand-hover sm:inline-flex"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function MeetEventList({ events }: MeetEventListProps) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <MeetEventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
