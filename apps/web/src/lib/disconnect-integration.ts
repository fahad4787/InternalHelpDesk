import { asanaService } from '@/services/asana.service';
import { mondayService } from '@/services/monday.service';
import { clickupService } from '@/services/clickup.service';
import { calendlyService } from '@/services/calendly.service';
import { googleCalendarService } from '@/services/google-calendar.service';
import { jiraService } from '@/services/jira.service';
import { outlookService } from '@/services/outlook.service';
import { slackService } from '@/services/slack.service';
import { trelloService } from '@/services/trello.service';
import { workdayService } from '@/services/workday.service';
import { zoomService } from '@/services/zoom.service';
import { dropboxService } from '@/services/dropbox.service';
import { boxService } from '@/services/box.service';
import { hubspotService } from '@/services/hubspot.service';

export async function disconnectIntegrationProvider(provider: string) {
  switch (provider) {
    case 'JIRA':
      return jiraService.disconnect();
    case 'TRELLO':
      return trelloService.disconnect();
    case 'ASANA':
      return asanaService.disconnect();
    case 'MONDAY':
      return mondayService.disconnect();
    case 'CLICKUP':
      return clickupService.disconnect();
    case 'CALENDLY':
      return calendlyService.disconnect();
    case 'SLACK':
      return slackService.disconnect();
    case 'GOOGLE_CALENDAR':
      return googleCalendarService.disconnect();
    case 'ZOOM':
      return zoomService.disconnect();
    case 'OUTLOOK':
      return outlookService.disconnect();
    case 'DROPBOX':
      return dropboxService.disconnect();
    case 'BOX':
      return boxService.disconnect();
    case 'HUBSPOT':
      return hubspotService.disconnect();
    case 'WORKDAY':
      return workdayService.reset();
    default:
      throw new Error('Disconnect is not available for this integration yet.');
  }
}
