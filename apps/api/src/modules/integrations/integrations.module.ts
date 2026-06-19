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

@Module({
  imports: [WorkdayModule, GoogleCalendarModule, ZoomModule, JiraModule],
  controllers: [
    WorkdayController,
    GoogleCalendarController,
    ZoomController,
    JiraController,
    IntegrationsController,
  ],
  providers: [IntegrationsService],
  exports: [IntegrationsService, WorkdayModule, GoogleCalendarModule, ZoomModule, JiraModule],
})
export class IntegrationsModule {}
