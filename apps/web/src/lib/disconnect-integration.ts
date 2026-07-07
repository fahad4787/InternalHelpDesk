import { googleCalendarService } from '@/services/google-calendar.service';
import { jiraService } from '@/services/jira.service';
import { outlookService } from '@/services/outlook.service';
import { slackService } from '@/services/slack.service';
import { workdayService } from '@/services/workday.service';
import { zoomService } from '@/services/zoom.service';

export async function disconnectIntegrationProvider(provider: string) {
  switch (provider) {
    case 'JIRA':
      return jiraService.disconnect();
    case 'SLACK':
      return slackService.disconnect();
    case 'GOOGLE_CALENDAR':
      return googleCalendarService.disconnect();
    case 'ZOOM':
      return zoomService.disconnect();
    case 'OUTLOOK':
      return outlookService.disconnect();
    case 'WORKDAY':
      return workdayService.reset();
    default:
      throw new Error('Disconnect is not available for this integration yet.');
  }
}
