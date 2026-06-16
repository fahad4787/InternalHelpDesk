import { IntegrationProvider } from '@prisma/client';

export interface IntegrationConfig {
  [key: string]: unknown;
}

export interface IntegrationProviderService {
  readonly provider: IntegrationProvider;
  connect(companyId: string, config: IntegrationConfig): Promise<void>;
  disconnect(companyId: string): Promise<void>;
  getStatus(companyId: string): Promise<string>;
  sync?(companyId: string): Promise<void>;
}
