'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ZoomMeeting } from '@/types/api.types';

interface ZoomMonthCalendarProps {
  meetings: ZoomMeeting[];
  email?: string | null;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMeetingEndTime(meeting: ZoomMeeting): number {
  return (
    new Date(meeting.start).getTime() + meeting.duration * 60 * 1000
  );
}

function isPastMeeting(meeting: ZoomMeeting): boolean {
  return getMeetingEndTime(meeting) < Date.now();
}

export function ZoomMonthCalendar({ meetings, email }: ZoomMonthCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, ZoomMeeting[]>();

    for (const meeting of meetings) {
      const key = format(new Date(meeting.start), 'yyyy-MM-dd');
      const existing = map.get(key) ?? [];
      existing.push(meeting);
      map.set(key, existing);
    }

    for (const [key, dayMeetings] of map.entries()) {
      dayMeetings.sort(
        (a, b) =>
          new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
      map.set(key, dayMeetings);
    }

    return map;
  }, [meetings]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 widget-card-header pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Zoom Calendar</CardTitle>
          <CardDescription className="mt-1">
            Monthly view of your Zoom meetings
            {email ? ` for ${email}` : ''}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-border-warm bg-white">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth((month) => addMonths(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-36 px-2 text-center text-sm font-semibold text-ink">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <a href="https://zoom.us/meeting" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Zoom
            </Button>
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-semibold uppercase tracking-wide text-muted"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayMeetings = meetingsByDay.get(dayKey) ?? [];
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-28 rounded-xl border p-2 sm:min-h-32 ${
                  inCurrentMonth
                    ? isToday
                      ? 'border-brand-muted bg-brand-light/20'
                      : 'border-border-warm bg-white'
                    : 'border-border-warm bg-canvas/70'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      inCurrentMonth
                        ? isToday
                          ? 'text-brand'
                          : 'text-ink'
                        : 'text-muted'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {dayMeetings.slice(0, 3).map((meeting) => {
                    const past = isPastMeeting(meeting);

                    return (
                      <a
                        key={meeting.id}
                        href={meeting.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-md border px-2 py-1.5 text-left transition ${
                          past
                            ? 'border-red-200 bg-red-50 text-red-900 shadow-sm shadow-red-100 hover:border-red-300 hover:shadow-md hover:shadow-red-100'
                            : 'border-brand-muted bg-white text-ink shadow-sm hover:border-brand hover:shadow'
                        }`}
                      >
                        <p className="truncate text-[11px] font-semibold sm:text-xs">
                          {meeting.topic}
                        </p>
                        <p
                          className={`mt-0.5 text-[10px] sm:text-[11px] ${
                            past ? 'text-red-700' : 'text-muted'
                          }`}
                        >
                          {format(new Date(meeting.start), 'h:mm a')}
                        </p>
                      </a>
                    );
                  })}
                  {dayMeetings.length > 3 && (
                    <p className="text-center text-[10px] font-medium text-muted">
                      +{dayMeetings.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-brand-muted bg-white shadow-sm" />
            <span>Upcoming meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-red-200 bg-red-50 shadow-sm shadow-red-100" />
            <span>Past meetings</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
