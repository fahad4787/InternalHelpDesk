export interface WorkdayArticle {
  externalId: string;
  title: string;
  category: string;
  content: string;
  source: 'workday';
  sourceUrl: string;
  lastUpdated: string;
  tags: string[];
}

export interface WorkdayConnectionConfig {
  tenantUrl: string;
  clientId: string;
  clientSecret: string;
  environment: 'SANDBOX' | 'PRODUCTION';
}

export interface WorkdaySyncSummary {
  total: number;
  created: number;
  updated: number;
  failed: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

export interface WorkdayStatusResponse {
  connected: boolean;
  mockMode: boolean;
  status: string;
  tenantUrl: string | null;
  clientId: string | null;
  hasClientSecret: boolean;
  environment: string;
  lastTestedAt: string | null;
  lastSyncedAt: string | null;
  totalSyncedArticles: number;
}
