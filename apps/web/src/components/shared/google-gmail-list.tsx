import { format } from 'date-fns';
import { ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoogleGmailMessage } from '@/services/google-calendar.service';

export const GMAIL_INBOX_URL = 'https://mail.google.com/mail/u/0/#inbox';
const MAX_MESSAGES = 10;

export function GoToGmailButton() {
  return (
    <a href={GMAIL_INBOX_URL} target="_blank" rel="noopener noreferrer">
      <Button size="sm">
        <Mail className="mr-2 h-4 w-4" />
        Go to Gmail
      </Button>
    </a>
  );
}

interface GoogleGmailListProps {
  messages: GoogleGmailMessage[];
}

export function GoogleGmailList({ messages }: GoogleGmailListProps) {
  const visibleMessages = messages.slice(0, MAX_MESSAGES);

  return (
    <div className="space-y-3">
      {visibleMessages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md ${
            message.isUnread
              ? 'border-brand-muted/80 bg-brand-light/20'
              : 'border-slate-200'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`truncate text-sm ${
                  message.isUnread
                    ? 'font-semibold text-slate-900'
                    : 'font-medium text-slate-800'
                }`}
              >
                {message.from}
              </p>
              {message.isUnread && <Badge variant="info">Unread</Badge>}
            </div>
            <p
              className={`mt-1 truncate text-sm ${
                message.isUnread ? 'font-semibold text-slate-900' : 'text-slate-800'
              }`}
            >
              {message.subject}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {message.snippet}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {format(new Date(message.receivedAt), 'MMM d, yyyy · h:mm a')}
            </p>
          </div>
          <a
            href={message.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 pt-1 text-brand hover:text-brand-hover"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      ))}
    </div>
  );
}
