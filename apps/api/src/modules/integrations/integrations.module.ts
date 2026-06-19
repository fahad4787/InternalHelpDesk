import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { GoogleCalendarController } from './google-calendar/google-calendar.controller';
import { WorkdayController } from './workday/workday.controller';
import { WorkdayModule } from './workday/workday.module';
import { ZoomModule } from './zoom/zoom.module';
import { ZoomController } from './zoom/zoom.controller';

@Module({
  imports: [WorkdayModule, GoogleCalendarModule, ZoomModule],
  controllers: [
    WorkdayController,
    GoogleCalendarController,
    ZoomController,
    IntegrationsController,
  ],
  providers: [IntegrationsService],
  exports: [IntegrationsService, WorkdayModule, GoogleCalendarModule, ZoomModule],
})
export class IntegrationsModule {}
