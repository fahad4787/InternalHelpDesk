import { Module } from '@nestjs/common';
import { SalesforceController } from './salesforce.controller';
import { SalesforceService } from './salesforce.service';

@Module({
  controllers: [SalesforceController],
  providers: [SalesforceService],
  exports: [SalesforceService],
})
export class SalesforceModule {}
