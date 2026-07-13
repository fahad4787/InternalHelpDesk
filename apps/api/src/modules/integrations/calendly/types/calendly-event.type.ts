export interface CalendlyEventType {
  uri: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  schedulingUrl: string | null;
  active: boolean;
}

export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  status: string;
  startAt: string;
  endAt: string;
  eventTypeUri: string | null;
  location: string | null;
  meetingUrl: string | null;
}
