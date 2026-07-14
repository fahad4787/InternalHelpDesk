import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { GoogleCalendarController } from './google-calendar/google-calendar.controller';
import { WorkdayController } from './workday/workday.controller';
import { WorkdayModule } from './workday/workday.module';
import { ZoomModule } from './zoom/zoom.module';
import { ZoomController } from './zoom/zoom.controller';
import { JiraModule } from './jira/jira.module';
import { JiraController } from './jira/jira.controller';
import { SlackModule } from './slack/slack.module';
import { SlackController } from './slack/slack.controller';
import { OutlookModule } from './outlook/outlook.module';
import { OutlookController } from './outlook/outlook.controller';
import { TrelloModule } from './trello/trello.module';
import { TrelloController } from './trello/trello.controller';
import { CalendlyModule } from './calendly/calendly.module';
import { CalendlyController } from './calendly/calendly.controller';
import { DropboxModule } from './dropbox/dropbox.module';
import { DropboxController } from './dropbox/dropbox.controller';

@Module({
  imports: [
    WorkdayModule,
    GoogleCalendarModule,
    ZoomModule,
    JiraModule,
    TrelloModule,
    CalendlyModule,
    SlackModule,
    OutlookModule,
    DropboxModule,
  ],
  controllers: [
    WorkdayController,
    GoogleCalendarController,
    ZoomController,
    JiraController,
    TrelloController,
    CalendlyController,
    SlackController,
    OutlookController,
    DropboxController,
    IntegrationsController,
  ],
  providers: [IntegrationsService],
  exports: [
    IntegrationsService,
    WorkdayModule,
    GoogleCalendarModule,
    ZoomModule,
    JiraModule,
    TrelloModule,
    CalendlyModule,
    SlackModule,
    OutlookModule,
    DropboxModule,
  ],
})
export class IntegrationsModule {}
