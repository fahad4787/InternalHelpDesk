import { Injectable } from '@nestjs/common';
import { MOCK_WORKDAY_ARTICLES } from '../constants/mock-articles.constant';
import { WorkdayArticle, WorkdayConnectionConfig } from '../types/workday-article.type';
import { WorkdayKnowledgeProvider } from '../types/workday-provider.interface';

@Injectable()
export class MockWorkdayProvider implements WorkdayKnowledgeProvider {
  async testConnection(_config: WorkdayConnectionConfig): Promise<boolean> {
    return true;
  }

  async syncArticles(_config: WorkdayConnectionConfig): Promise<WorkdayArticle[]> {
    return MOCK_WORKDAY_ARTICLES.map((article) => ({ ...article }));
  }

  async getArticleById(
    _config: WorkdayConnectionConfig,
    externalId: string,
  ): Promise<WorkdayArticle | null> {
    return MOCK_WORKDAY_ARTICLES.find((a) => a.externalId === externalId) ?? null;
  }
}
