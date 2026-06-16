import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { GoogleCalendarController } from './google-calendar/google-calendar.controller';
import { WorkdayController } from './workday/workday.controller';
import { WorkdayModule } from './workday/workday.module';

@Module({
  imports: [WorkdayModule, GoogleCalendarModule],
  controllers: [WorkdayController, GoogleCalendarController, IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService, WorkdayModule, GoogleCalendarModule],
})
export class IntegrationsModule {}
