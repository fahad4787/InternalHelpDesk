interface ConferenceEntryPoint {
  entryPointType?: string;
  uri?: string;
  label?: string;
}

interface MeetEventSource {
  hangoutLink?: string;
  location?: string;
  description?: string;
  conferenceData?: {
    entryPoints?: ConferenceEntryPoint[];
    conferenceSolution?: {
      key?: { type?: string };
      name?: string;
    };
    createRequest?: {
      conferenceSolutionKey?: { type?: string };
    };
  };
}

const MEET_URL_PATTERN = /https?:\/\/meet\.google\.com\/[a-z0-9-]+/gi;

function normalizeMeetUrl(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function findMeetUrlInText(text: string): string | null {
  const matches = text.match(MEET_URL_PATTERN);
  return matches?.[0] ? normalizeMeetUrl(matches[0]) : null;
}

export function extractMeetLink(event: MeetEventSource): string | null {
  if (event.hangoutLink) {
    return normalizeMeetUrl(event.hangoutLink);
  }

  for (const entry of event.conferenceData?.entryPoints ?? []) {
    if (entry.uri?.includes('meet.google.com')) {
      return normalizeMeetUrl(entry.uri);
    }
    if (entry.label && entry.label.includes('meet.google.com')) {
      const fromLabel = findMeetUrlInText(entry.label);
      if (fromLabel) return fromLabel;
    }
  }

  for (const field of [event.location, event.description]) {
    if (!field) continue;
    const match = findMeetUrlInText(field);
    if (match) return match;
  }

  return null;
}

export function isLikelyGoogleMeetEvent(event: MeetEventSource): boolean {
  if (extractMeetLink(event)) return true;

  const solutionType = event.conferenceData?.conferenceSolution?.key?.type;
  if (solutionType === 'hangoutsMeet' || solutionType === 'eventHangout') {
    return true;
  }

  const requestType =
    event.conferenceData?.createRequest?.conferenceSolutionKey?.type;
  if (requestType === 'hangoutsMeet' || requestType === 'eventHangout') {
    return true;
  }

  const location = event.location?.toLowerCase() ?? '';
  if (location.includes('google meet') || location.includes('meet.google.com')) {
    return true;
  }

  if (event.description && findMeetUrlInText(event.description)) {
    return true;
  }

  return false;
}

export function isGoogleMeetEvent(event: MeetEventSource): boolean {
  return extractMeetLink(event) !== null;
}

export function extractMeetCode(meetLink: string): string | null {
  const match = meetLink.match(/meet\.google\.com\/([a-z0-9-]+)/i);
  return match?.[1] ?? null;
}
