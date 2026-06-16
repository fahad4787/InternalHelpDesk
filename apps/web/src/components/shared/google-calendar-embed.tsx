'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GoogleCalendarEmbedProps {
  email: string;
  title?: string;
  description?: string;
}

function buildEmbedUrl(email: string): string {
  const params = new URLSearchParams({
    src: email,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    mode: 'WEEK',
    showTitle: '0',
    showNav: '1',
    showDate: '1',
    showPrint: '0',
    showTabs: '1',
    showCalendars: '0',
    bgcolor: '#ffffff',
    color: '#006600',
  });

  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

export function GoogleCalendarEmbed({
  email,
  title = 'Google Calendar',
  description = 'Your weekly calendar view',
}: GoogleCalendarEmbedProps) {
  const embedUrl = buildEmbedUrl(email);
  const openUrl = 'https://calendar.google.com/calendar/u/0/r/week';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <a href={openUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Calendar
          </Button>
        </a>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full overflow-hidden bg-white">
          <iframe
            title="Google Calendar"
            src={embedUrl}
            className="h-[600px] w-full border-0"
            loading="lazy"
          />
        </div>
        <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
          Showing calendar for <span className="font-medium">{email}</span>. The embed
          may display a different calendar if another Google account is signed in to
          this browser. Meet meetings above always use the connected account.
        </p>
      </CardContent>
    </Card>
  );
}
