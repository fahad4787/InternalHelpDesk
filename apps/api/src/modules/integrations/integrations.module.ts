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
import { TeamsModule } from './teams/teams.module';
import { TeamsController } from './teams/teams.controller';
import { TrelloModule } from './trello/trello.module';
import { TrelloController } from './trello/trello.controller';
import { AsanaModule } from './asana/asana.module';
import { AsanaController } from './asana/asana.controller';
import { MondayModule } from './monday/monday.module';
import { MondayController } from './monday/monday.controller';
import { ClickUpModule } from './clickup/clickup.module';
import { ClickUpController } from './clickup/clickup.controller';
import { CalendlyModule } from './calendly/calendly.module';
import { CalendlyController } from './calendly/calendly.controller';
import { DropboxModule } from './dropbox/dropbox.module';
import { DropboxController } from './dropbox/dropbox.controller';
import { BoxModule } from './box/box.module';
import { BoxController } from './box/box.controller';
import { HubSpotModule } from './hubspot/hubspot.module';
import { HubSpotController } from './hubspot/hubspot.controller';
import { DynamicsModule } from './dynamics/dynamics.module';
import { DynamicsController } from './dynamics/dynamics.controller';

@Module({
  imports: [
    WorkdayModule,
    GoogleCalendarModule,
    ZoomModule,
    JiraModule,
    TrelloModule,
    AsanaModule,
    MondayModule,
    ClickUpModule,
    CalendlyModule,
    SlackModule,
    OutlookModule,
    TeamsModule,
    DropboxModule,
    BoxModule,
    HubSpotModule,
    DynamicsModule,
  ],
  controllers: [
    WorkdayController,
    GoogleCalendarController,
    ZoomController,
    JiraController,
    TrelloController,
    AsanaController,
    MondayController,
    ClickUpController,
    CalendlyController,
    SlackController,
    OutlookController,
    TeamsController,
    DropboxController,
    BoxController,
    HubSpotController,
    DynamicsController,
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
    AsanaModule,
    MondayModule,
    ClickUpModule,
    CalendlyModule,
    SlackModule,
    OutlookModule,
    TeamsModule,
    DropboxModule,
    BoxModule,
    HubSpotModule,
    DynamicsModule,
  ],
})
export class IntegrationsModule {}
