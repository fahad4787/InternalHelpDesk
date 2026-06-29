export interface ZoomMeeting {
  id: string;
  topic: string;
  start: string;
  duration: number;
  timezone: string;
  joinUrl: string;
  password: string | null;
  hostEmail: string | null;
  meetingNumber: string;
}
