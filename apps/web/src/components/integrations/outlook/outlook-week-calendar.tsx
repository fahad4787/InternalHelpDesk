'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/types/api.types';
import { cn } from '@/lib/utils';

const HOUR_HEIGHT = 36;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface OutlookWeekCalendarProps {
  events: CalendarEvent[];
  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;
  selectedDay: Date;
  onSelectedDayChange: (day: Date) => void;
}

function getTimezoneLabel(): string {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return minutes === '00' ? `GMT${sign}${Number(hours)}` : `GMT${sign}${hours}:${minutes}`;
}

function eventStartMs(event: CalendarEvent): number {
  return new Date(event.start).getTime();
}

function eventEndMs(event: CalendarEvent): number {
  return new Date(event.end).getTime();
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  return `${format(new Date(event.start), 'h:mm a')} – ${format(new Date(event.end), 'h:mm a')}`;
}

export function OutlookWeekCalendar({
  events,
  weekStart,
  onWeekChange,
  selectedDay,
  onSelectedDayChange,
}: OutlookWeekCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [didScrollToNow, setDidScrollToNow] = useState(false);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 0 }),
      }),
    [weekStart],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    for (const day of days) {
      map.set(format(day, 'yyyy-MM-dd'), []);
    }

    for (const event of events) {
      const start = new Date(event.start);
      const end = new Date(event.end);
      for (const day of days) {
        const dayStart = startOfDay(day).getTime();
        const dayEnd = endOfDay(day).getTime();
        if (start.getTime() <= dayEnd && end.getTime() >= dayStart) {
          const key = format(day, 'yyyy-MM-dd');
          const list = map.get(key) ?? [];
          list.push(event);
          map.set(key, list);
        }
      }
    }

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => eventStartMs(a) - eventStartMs(b));
      map.set(key, list);
    }

    return map;
  }, [days, events]);

  useEffect(() => {
    if (didScrollToNow || !scrollRef.current) return;
    const hour = new Date().getHours();
    scrollRef.current.scrollTop = Math.max(0, (hour - 1) * HOUR_HEIGHT);
    setDidScrollToNow(true);
  }, [didScrollToNow]);

  const goToday = () => {
    const today = new Date();
    onWeekChange(startOfWeek(today, { weekStartsOn: 0 }));
    onSelectedDayChange(today);
    setDidScrollToNow(false);
  };

  const monthLabel = isSameMonth(days[0], days[6])
    ? format(days[0], 'MMMM yyyy')
    : `${format(days[0], 'MMM')} – ${format(days[6], 'MMM yyyy')}`;

  return (
    <div className="flex h-full min-h-[240px] flex-col overflow-hidden rounded-xl border border-border-warm bg-white">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border-warm px-2 py-1.5">
        <button
          type="button"
          onClick={goToday}
          className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-border-warm"
        >
          Today
        </button>
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => onWeekChange(addWeeks(weekStart, -1))}
            className="rounded-md p-1 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => onWeekChange(addWeeks(weekStart, 1))}
            className="rounded-md p-1 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs font-semibold text-ink">{monthLabel}</p>
      </div>

      <div className="grid shrink-0 grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] border-b border-border-warm">
        <div className="border-r border-border-warm" />
        {days.map((day) => {
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectedDayChange(day)}
              className="flex flex-col items-center gap-0.5 py-1.5 transition-colors hover:bg-canvas/60"
            >
              <span
                className={cn(
                  'text-[9px] font-semibold uppercase tracking-wide',
                  selected || today ? 'text-sky-600' : 'text-muted',
                )}
              >
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  selected
                    ? 'bg-sky-600 text-white'
                    : today
                      ? 'bg-sky-100 text-sky-700'
                      : 'text-ink',
                )}
              >
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))]">
          <div className="relative border-r border-border-warm">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border-warm/70"
                style={{ height: HOUR_HEIGHT }}
              >
                {hour > 0 && (
                  <span className="absolute -top-2 right-0.5 text-[9px] font-medium text-muted">
                    {formatHourLabel(hour)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay.get(key) ?? [];
            const dayStart = startOfDay(day).getTime();
            const dayEnd = endOfDay(day).getTime();
            const selected = isSameDay(day, selectedDay);

            return (
              <div
                key={key}
                className={cn(
                  'relative border-r border-border-warm last:border-r-0',
                  selected && 'bg-sky-50/40',
                )}
                style={{ height: HOUR_HEIGHT * 24 }}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border-warm/70"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {dayEvents.map((event) => {
                  if (event.allDay) {
                    return (
                      <a
                        key={`${event.id}-allday`}
                        href={event.htmlLink ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${event.title}\n${formatEventTime(event)}${event.location ? `\n${event.location}` : ''}${event.description ? `\n${event.description}` : ''}`}
                        className="absolute left-0.5 right-0.5 top-0.5 z-10 overflow-hidden rounded border border-sky-200 bg-sky-100 px-1 py-0.5 text-left hover:bg-sky-200"
                        style={{ maxHeight: HOUR_HEIGHT - 4 }}
                      >
                        <p className="truncate text-[10px] font-semibold text-sky-900">
                          {event.title}
                        </p>
                      </a>
                    );
                  }

                  const start = Math.max(eventStartMs(event), dayStart);
                  const end = Math.min(eventEndMs(event), dayEnd);
                  const top =
                    ((start - dayStart) / (24 * 60 * 60 * 1000)) *
                    HOUR_HEIGHT *
                    24;
                  const height = Math.max(
                    18,
                    ((end - start) / (24 * 60 * 60 * 1000)) * HOUR_HEIGHT * 24,
                  );

                  return (
                    <a
                      key={`${event.id}-${key}`}
                      href={event.htmlLink ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${event.title}\n${formatEventTime(event)}${event.location ? `\n${event.location}` : ''}${event.description ? `\n${event.description}` : ''}`}
                      className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border border-sky-300 bg-sky-500 px-1 py-0.5 text-left text-white hover:bg-sky-600"
                      style={{ top, height }}
                    >
                      <p className="truncate text-[10px] font-semibold leading-tight">
                        {event.title}
                      </p>
                      {height > 28 && (
                        <p className="truncate text-[9px] leading-tight text-sky-50">
                          {format(new Date(event.start), 'h:mm a')}
                          {event.location ? ` · ${event.location}` : ''}
                        </p>
                      )}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border-warm px-2 py-1.5 text-[10px] text-muted">
        <span>{getTimezoneLabel()}</span>
        {events.length === 0 && <span>No events this week</span>}
      </div>
    </div>
  );
}

export function getOutlookWeekRange(weekStart: Date): { start: string; end: string } {
  const start = startOfWeek(weekStart, { weekStartsOn: 0 });
  const end = endOfWeek(weekStart, { weekStartsOn: 0 });
  return {
    start: startOfDay(start).toISOString(),
    end: endOfDay(end).toISOString(),
  };
}
