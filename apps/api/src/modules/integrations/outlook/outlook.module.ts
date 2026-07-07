import { Module } from '@nestjs/common';
import { OutlookController } from './outlook.controller';
import { OutlookService } from './outlook.service';

@Module({
  controllers: [OutlookController],
  providers: [OutlookService],
  exports: [OutlookService],
})
export class OutlookModule {}
