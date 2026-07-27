import { Module } from '@nestjs/common';
import { ZohoCrmController } from './zoho-crm.controller';
import { ZohoCrmService } from './zoho-crm.service';

@Module({
  controllers: [ZohoCrmController],
  providers: [ZohoCrmService],
  exports: [ZohoCrmService],
})
export class ZohoCrmModule {}
