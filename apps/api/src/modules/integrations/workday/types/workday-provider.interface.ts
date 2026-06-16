import { WorkdayArticle, WorkdayConnectionConfig } from './workday-article.type';

export interface WorkdayKnowledgeProvider {
  testConnection(config: WorkdayConnectionConfig): Promise<boolean>;
  syncArticles(config: WorkdayConnectionConfig): Promise<WorkdayArticle[]>;
  getArticleById(
    config: WorkdayConnectionConfig,
    externalId: string,
  ): Promise<WorkdayArticle | null>;
}
