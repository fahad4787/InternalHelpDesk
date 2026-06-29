import { ZoomMeeting } from '../types/zoom-meeting.type';

const baseMockMeetings: ZoomMeeting[] = [
  {
    id: 'mock-zoom-1',
    topic: 'Weekly Team Sync',
    start: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    timezone: 'UTC',
    joinUrl: 'https://zoom.us/j/12345678901',
    password: 'abc123',
    hostEmail: 'user@company.com',
    meetingNumber: '12345678901',
  },
  {
    id: 'mock-zoom-2',
    topic: 'Product Demo',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    timezone: 'UTC',
    joinUrl: 'https://zoom.us/j/98765432109',
    password: 'demo99',
    hostEmail: 'user@company.com',
    meetingNumber: '98765432109',
  },
  {
    id: 'mock-zoom-3',
    topic: 'Client Onboarding',
    start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    timezone: 'UTC',
    joinUrl: 'https://zoom.us/j/55555555555',
    password: 'zoom42',
    hostEmail: 'user@company.com',
    meetingNumber: '55555555555',
  },
];

let mockMeetingsStore: ZoomMeeting[] = [...baseMockMeetings];

export function getMockZoomMeetings(): ZoomMeeting[] {
  return [...mockMeetingsStore].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

export function addMockZoomMeeting(meeting: ZoomMeeting): ZoomMeeting {
  mockMeetingsStore = [meeting, ...mockMeetingsStore];
  return meeting;
}

export function resetMockZoomMeetings(): void {
  mockMeetingsStore = [...baseMockMeetings];
}
