import { Module } from '@nestjs/common';
import { HubSpotController } from './hubspot.controller';
import { HubSpotService } from './hubspot.service';

@Module({
  controllers: [HubSpotController],
  providers: [HubSpotService],
  exports: [HubSpotService],
})
export class HubSpotModule {}
