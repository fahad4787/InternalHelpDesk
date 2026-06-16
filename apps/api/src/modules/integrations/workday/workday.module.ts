import { Module } from '@nestjs/common';
import { KnowledgeBaseModule } from '../../knowledge-base/knowledge-base.module';
import { MockWorkdayProvider } from './providers/mock-workday.provider';
import { RealWorkdayProvider } from './providers/real-workday.provider';
import { WorkdayProviderResolver } from './workday.provider';
import { WorkdayService } from './workday.service';

@Module({
  imports: [KnowledgeBaseModule],
  providers: [
    WorkdayService,
    WorkdayProviderResolver,
    MockWorkdayProvider,
    RealWorkdayProvider,
  ],
  exports: [WorkdayService],
})
export class WorkdayModule {}
