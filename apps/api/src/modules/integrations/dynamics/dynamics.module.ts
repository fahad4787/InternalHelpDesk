import { Module } from '@nestjs/common';
import { DynamicsController } from './dynamics.controller';
import { DynamicsService } from './dynamics.service';

@Module({
  controllers: [DynamicsController],
  providers: [DynamicsService],
  exports: [DynamicsService],
})
export class DynamicsModule {}
