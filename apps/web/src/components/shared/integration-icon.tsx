import { cn } from '@/lib/utils';

export type IntegrationIconProvider =
  | 'GOOGLE_CALENDAR'
  | 'GOOGLE_MEET'
  | 'GOOGLE_DRIVE'
  | 'GMAIL'
  | 'JIRA'
  | 'TRELLO'
  | 'CALENDLY'
  | 'SLACK'
  | 'ZOOM'
  | 'OUTLOOK'
  | 'WORKDAY'
  | 'MICROSOFT_TEAMS'
  | 'SERVICENOW';

const SIZE_CLASSES = {
  sm: { box: 'h-9 w-9', icon: 'h-5 w-5', radius: 'rounded-xl' },
  md: { box: 'h-11 w-11', icon: 'h-6 w-6', radius: 'rounded-xl' },
  lg: { box: 'h-12 w-12', icon: 'h-7 w-7', radius: 'rounded-2xl' },
} as const;

interface IntegrationIconProps {
  provider: IntegrationIconProvider;
  size?: keyof typeof SIZE_CLASSES;
  /** Renders a bordered tile behind the icon (connection cards, marketplace). */
  tile?: boolean;
  /** Softens the icon when an integration is not connected. */
  dimmed?: boolean;
  className?: string;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GoogleMeetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#00832D" d="M6 5h8v14H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path fill="#00AC47" d="M14 8.5 20 5.8v12.4l-6-2.7z" />
      <path fill="#FFBA00" d="M14 8.5v7L20 18.2V5.8z" />
      <path fill="#EA4335" d="M14 8.5 20 5.8 14 5z" />
      <path fill="#2684FC" d="M14 15.5 20 18.2v-3.7z" />
    </svg>
  );
}

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#0066DA" d="M8.04 3h7.92L22 17.25H2z" />
      <path fill="#00AC47" d="M1.5 18.75 8.04 7.5h7.92L22 18.75z" />
      <path fill="#FFBA00" d="M8.04 3 1.5 14.25 8.04 18.75 14.58 7.5z" />
    </svg>
  );
}

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M4 5h16v14H4z" />
      <path fill="#FFF" d="m4 5 8 7 8-7v2.2L12 14 4 7.2z" />
      <path fill="#F2F2F2" d="M20 5v2.2L12 14 4 7.2V5z" />
    </svg>
  );
}

function JiraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#2684FF"
        d="M11.53 2C6.4 7.8 3.5 11.35 3.5 13.9c0 2.55 2.07 4.62 4.62 4.62 1.55 0 2.98-.77 3.84-2.05l1.04-1.47 1.04 1.47a4.62 4.62 0 0 0 3.84 2.05c2.55 0 4.62-2.07 4.62-4.62 0-2.55-2.9-6.1-8.03-11.9L11.53 2z"
      />
      <path
        fill="#0052CC"
        d="M11.53 6.2 7.7 11.5c-.7.95-1.1 2.08-1.1 3.25 0 1.17.95 2.12 2.12 2.12.7 0 1.35-.35 1.74-.92l1.07-1.52 1.07 1.52c.39.57 1.04.92 1.74.92 1.17 0 2.12-.95 2.12-2.12 0-1.17-.4-2.3-1.1-3.25L11.53 6.2z"
      />
    </svg>
  );
}

function TrelloIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect fill="#0079BF" width="24" height="24" rx="4" />
      <rect fill="#fff" x="4.5" y="4.5" width="6" height="12" rx="1.2" />
      <rect fill="#fff" x="13.5" y="4.5" width="6" height="8" rx="1.2" />
    </svg>
  );
}

function CalendlyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect fill="#006BFF" width="24" height="24" rx="5" />
      <path
        fill="#fff"
        d="M7 6.5h10a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 17 18.5H7A1.5 1.5 0 0 1 5.5 17V8A1.5 1.5 0 0 1 7 6.5zm1.2 3.2v1.1h7.6V9.7H8.2zm0 3v1.1h5.2v-1.1H8.2z"
      />
    </svg>
  );
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#E01E5A"
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 6.313 24a2.528 2.528 0 0 1-2.52-2.522v-6.313z"
      />
      <path
        fill="#36C5F0"
        d="M8.835 5.042a2.528 2.528 0 0 1 2.523-2.52 2.528 2.528 0 0 1 2.523 2.52v2.52H8.835zm0 1.271a2.528 2.528 0 0 1 2.523 2.521 2.528 2.528 0 0 1-2.523 2.521H2.522A2.528 2.528 0 0 1 0 8.835a2.528 2.528 0 0 1 2.522-2.522h6.313z"
      />
      <path
        fill="#2EB67D"
        d="M18.958 8.835a2.528 2.528 0 0 1 2.522-2.523 2.528 2.528 0 0 1 2.523 2.523 2.527 2.527 0 0 1-2.523 2.521h-2.522V8.835zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.528 2.528 0 0 1-2.523-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313z"
      />
      <path
        fill="#ECB22E"
        d="M15.165 18.958a2.528 2.528 0 0 1-2.523 2.522 2.528 2.528 0 0 1-2.523-2.522v-2.522h5.046zm0-1.27a2.528 2.528 0 0 1-2.523-2.523 2.528 2.528 0 0 1 2.523-2.523h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
      />
    </svg>
  );
}

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect fill="#2D8CFF" width="24" height="24" rx="5" />
      <path
        fill="#fff"
        d="M6.5 8.5h6.2c1.5 0 2.7 1.2 2.7 2.7v1.6c0 1.5-1.2 2.7-2.7 2.7H9.4l-2.9 2.2v-2.2H6.5c-1.5 0-2.7-1.2-2.7-2.7v-1.6c0-1.5 1.2-2.7 2.7-2.7zm10.3 1.4 4.7-2.8v9.8l-4.7-2.8V9.9z"
      />
    </svg>
  );
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#0078D4" d="M3 5h9v14H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path fill="#28A8EA" d="M12 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9z" />
      <path fill="#fff" d="M7.5 8.5a4 4 0 1 0 0 7 4 4 0 0 0 0-7z" />
      <path fill="#0078D4" d="M7.5 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" />
    </svg>
  );
}

function WorkdayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect fill="#F68B1F" width="24" height="24" rx="5" />
      <circle fill="#fff" cx="12" cy="12" r="6.2" />
      <circle fill="#F68B1F" cx="12" cy="12" r="3.4" />
    </svg>
  );
}

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect fill="#5059C9" width="24" height="24" rx="5" />
      <path
        fill="#fff"
        d="M15.2 7.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zM11.8 9.8v7.2H7.6V8.6c0-.9.7-1.6 1.6-1.6h2.6zm5.8 1.4c.8 0 1.4.6 1.4 1.4v4.4h-2.8v-5.8h1.4z"
      />
      <circle fill="#7B83EB" cx="8.4" cy="7.8" r="2.4" />
    </svg>
  );
}

function ServiceNowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect fill="#62D84E" width="24" height="24" rx="5" />
      <path
        fill="#1D1D1B"
        d="M7.5 12c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5S7.5 14.5 7.5 12zm4.5-2.4a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z"
      />
    </svg>
  );
}

function BrandGlyph({
  provider,
  className,
}: {
  provider: IntegrationIconProvider;
  className?: string;
}) {
  switch (provider) {
    case 'GOOGLE_CALENDAR':
      return <GoogleIcon className={className} />;
    case 'GOOGLE_MEET':
      return <GoogleMeetIcon className={className} />;
    case 'GOOGLE_DRIVE':
      return <GoogleDriveIcon className={className} />;
    case 'GMAIL':
      return <GmailIcon className={className} />;
    case 'JIRA':
      return <JiraIcon className={className} />;
    case 'TRELLO':
      return <TrelloIcon className={className} />;
    case 'CALENDLY':
      return <CalendlyIcon className={className} />;
    case 'SLACK':
      return <SlackIcon className={className} />;
    case 'ZOOM':
      return <ZoomIcon className={className} />;
    case 'OUTLOOK':
      return <OutlookIcon className={className} />;
    case 'WORKDAY':
      return <WorkdayIcon className={className} />;
    case 'MICROSOFT_TEAMS':
      return <TeamsIcon className={className} />;
    case 'SERVICENOW':
      return <ServiceNowIcon className={className} />;
    default:
      return <GoogleIcon className={className} />;
  }
}

export function isIntegrationIconProvider(
  value: string,
): value is IntegrationIconProvider {
  return [
    'GOOGLE_CALENDAR',
    'GOOGLE_MEET',
    'GOOGLE_DRIVE',
    'GMAIL',
    'JIRA',
    'TRELLO',
    'CALENDLY',
    'SLACK',
    'ZOOM',
    'OUTLOOK',
    'WORKDAY',
    'MICROSOFT_TEAMS',
    'SERVICENOW',
  ].includes(value);
}

export function IntegrationIcon({
  provider,
  size = 'sm',
  tile = false,
  dimmed = false,
  className,
}: IntegrationIconProps) {
  const sizeClass = SIZE_CLASSES[size];
  const icon = (
    <BrandGlyph
      provider={provider}
      className={cn(sizeClass.icon, dimmed && 'opacity-60 saturate-50')}
    />
  );

  if (!tile) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center border border-border-warm bg-white shadow-sm',
          sizeClass.box,
          sizeClass.radius,
          dimmed && 'bg-canvas opacity-80',
          className,
        )}
        aria-hidden
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center border bg-white shadow-sm',
        sizeClass.box,
        sizeClass.radius,
        dimmed ? 'border-border-warm bg-canvas' : 'border-positive-muted',
        className,
      )}
      aria-hidden
    >
      {icon}
    </span>
  );
}
