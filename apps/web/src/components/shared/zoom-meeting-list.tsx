import {
  differenceInHours,
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
} from 'date-fns';
import {
  Clock,
  ExternalLink,
  Hash,
  KeyRound,
  Link2,
  User,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomMeeting } from '@/types/api.types';

interface ZoomMeetingListProps {
  meetings: ZoomMeeting[];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatMeetingNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return value;
}

function formatSchedule(meeting: ZoomMeeting): string {
  const start = new Date(meeting.start);
  const end = new Date(start.getTime() + meeting.duration * 60 * 1000);
  return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')} (${formatDuration(meeting.duration)})`;
}

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getMeetingTimeBadge(start: Date): { value: string; label: string } {
  const distance = formatDistanceToNow(start, { addSuffix: true });
  const past = start.getTime() < Date.now();

  if (past) {
    const match = distance.match(/^(?:about\s+)?(\d+)\s+(.+)$/i);
    if (match) {
      return {
        value: match[1],
        label: capitalizeFirst(match[2]),
      };
    }
    return { value: '•', label: capitalizeFirst(distance) };
  }

  const inMatch = distance.match(/^in\s+(?:about\s+)?(\d+)\s+(.+)$/i);
  if (inMatch) {
    return {
      value: inMatch[1],
      label: capitalizeFirst(inMatch[2]),
    };
  }

  return { value: '•', label: capitalizeFirst(distance) };
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

function getDateGroupLabel(start: Date): string {
  if (isToday(start)) return 'Today';
  if (isTomorrow(start)) return 'Tomorrow';
  return format(start, 'EEE, MMM d');
}

function groupMeetingsByDate(meetings: ZoomMeeting[]) {
  const groups = new Map<string, ZoomMeeting[]>();

  for (const meeting of meetings) {
    const start = new Date(meeting.start);
    const label = getDateGroupLabel(start);
    const existing = groups.get(label) ?? [];
    existing.push(meeting);
    groups.set(label, existing);
  }

  return [...groups.entries()];
}

function ZoomMeetingCard({ meeting }: { meeting: ZoomMeeting }) {
  const start = new Date(meeting.start);
  const timeBadge = getMeetingTimeBadge(start);
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
            className={`flex w-full flex-col items-center justify-center rounded-xl border px-2.5 py-2.5 ${startsInStyles}`}
          >
            <span className="text-2xl font-bold leading-none sm:text-3xl">
              {timeBadge.value}
            </span>
            <span className="mt-1 text-center text-xs font-semibold leading-snug sm:text-sm">
              {timeBadge.label}
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="info">Zoom</Badge>
            {meeting.meetingNumber && (
              <Badge variant="secondary" className="font-mono text-xs">
                ID: {formatMeetingNumber(meeting.meetingNumber)}
              </Badge>
            )}
            {meeting.password && (
              <Badge variant="secondary" className="font-mono text-xs">
                Passcode: {meeting.password}
              </Badge>
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
            {meeting.topic}
          </h3>

          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{formatSchedule(meeting)}</span>
            </div>

            {meeting.hostEmail && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="h-4 w-4 shrink-0 text-brand" />
                <span>{meeting.hostEmail}</span>
              </div>
            )}

            {meeting.meetingNumber && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Hash className="h-4 w-4 shrink-0 text-brand" />
                <span className="font-mono">
                  {formatMeetingNumber(meeting.meetingNumber)}
                </span>
              </div>
            )}

            {meeting.joinUrl && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <a
                  href={meeting.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand hover:text-brand-hover hover:underline"
                >
                  {meeting.joinUrl}
                </a>
              </div>
            )}

            {meeting.password && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <KeyRound className="h-4 w-4 shrink-0 text-brand" />
                <span>
                  Meeting passcode:{' '}
                  <span className="font-mono font-medium text-slate-800">
                    {meeting.password}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            {meeting.joinUrl && (
              <a
                href={meeting.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm">
                  <Video className="mr-2 h-4 w-4" />
                  Join Zoom
                </Button>
              </a>
            )}
            {meeting.joinUrl && (
              <a
                href={meeting.joinUrl}
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

export function ZoomMeetingList({ meetings }: ZoomMeetingListProps) {
  const groups = groupMeetingsByDate(meetings);

  return (
    <div className="space-y-6">
      {groups.map(([label, groupMeetings]) => (
        <section key={label} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </h3>
          <div className="space-y-4">
            {groupMeetings.map((meeting) => (
              <ZoomMeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
