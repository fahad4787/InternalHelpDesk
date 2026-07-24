import { Module } from '@nestjs/common';
import { SharePointController } from './sharepoint.controller';
import { SharePointService } from './sharepoint.service';

@Module({
  controllers: [SharePointController],
  providers: [SharePointService],
  exports: [SharePointService],
})
export class SharePointModule {}
