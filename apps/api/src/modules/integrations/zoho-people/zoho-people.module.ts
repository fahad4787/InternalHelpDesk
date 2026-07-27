import { Module } from '@nestjs/common';
import { ZohoPeopleController } from './zoho-people.controller';
import { ZohoPeopleService } from './zoho-people.service';

@Module({
  controllers: [ZohoPeopleController],
  providers: [ZohoPeopleService],
  exports: [ZohoPeopleService],
})
export class ZohoPeopleModule {}
