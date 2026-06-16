import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { WORKDAY_ERRORS } from '../constants/workday.constants';
import { WorkdayArticle, WorkdayConnectionConfig } from '../types/workday-article.type';
import { WorkdayKnowledgeProvider } from '../types/workday-provider.interface';

@Injectable()
export class RealWorkdayProvider implements WorkdayKnowledgeProvider {
  async testConnection(_config: WorkdayConnectionConfig): Promise<boolean> {
    throw new ServiceUnavailableException(WORKDAY_ERRORS.NOT_CONFIGURED);
  }

  async syncArticles(_config: WorkdayConnectionConfig): Promise<WorkdayArticle[]> {
    throw new ServiceUnavailableException(WORKDAY_ERRORS.NOT_CONFIGURED);
  }

  async getArticleById(
    _config: WorkdayConnectionConfig,
    _externalId: string,
  ): Promise<WorkdayArticle | null> {
    throw new ServiceUnavailableException(WORKDAY_ERRORS.NOT_CONFIGURED);
  }
}
