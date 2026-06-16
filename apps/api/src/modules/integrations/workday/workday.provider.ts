import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WORKDAY_MODE } from './constants/workday.constants';
import { MockWorkdayProvider } from './providers/mock-workday.provider';
import { RealWorkdayProvider } from './providers/real-workday.provider';
import { WorkdayKnowledgeProvider } from './types/workday-provider.interface';

@Injectable()
export class WorkdayProviderResolver {
  constructor(
    private configService: ConfigService,
    private mockProvider: MockWorkdayProvider,
    private realProvider: RealWorkdayProvider,
  ) {}

  resolve(): WorkdayKnowledgeProvider {
    const mode = this.configService.get<string>('WORKDAY_MODE', WORKDAY_MODE.MOCK);
    return mode === WORKDAY_MODE.LIVE ? this.realProvider : this.mockProvider;
  }

  isMockMode(): boolean {
    return this.configService.get<string>('WORKDAY_MODE', WORKDAY_MODE.MOCK) !== WORKDAY_MODE.LIVE;
  }
}
