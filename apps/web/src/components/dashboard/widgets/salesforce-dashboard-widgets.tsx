'use client';

import { Building2, Handshake, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { SalesforceAccountList } from '@/components/shared/salesforce-account-list';
import { SalesforceContactList } from '@/components/shared/salesforce-contact-list';
import { SalesforceOpportunityList } from '@/components/shared/salesforce-opportunity-list';
import { salesforceService } from '@/services/salesforce.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const SALESFORCE_HOME_URL = 'https://login.salesforce.com';

export function SalesforceContactsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['salesforce-contacts'],
    queryFn: () => salesforceService.getContacts(),
  });

  const contacts = data?.data?.contacts ?? [];

  return (
    <DashboardWidgetCard
      source="Salesforce"
      sourceLogo={<IntegrationIcon provider="SALESFORCE" />}
      title="Salesforce contacts"
      deepLinkHref={SALESFORCE_HOME_URL}
      deepLinkLabel="Open Salesforce"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Contacts from your Salesforce CRM will appear here"
        />
      ) : (
        <SalesforceContactList contacts={contacts} />
      )}
    </DashboardWidgetCard>
  );
}

export function SalesforceAccountsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['salesforce-accounts'],
    queryFn: () => salesforceService.getAccounts(),
  });

  const accounts = data?.data?.accounts ?? [];

  return (
    <DashboardWidgetCard
      source="Salesforce"
      sourceLogo={<IntegrationIcon provider="SALESFORCE" />}
      title="Salesforce accounts"
      deepLinkHref={SALESFORCE_HOME_URL}
      deepLinkLabel="Open Salesforce"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No accounts found"
          description="Accounts from your Salesforce CRM will appear here"
        />
      ) : (
        <SalesforceAccountList accounts={accounts} />
      )}
    </DashboardWidgetCard>
  );
}

export function SalesforceOpportunitiesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['salesforce-opportunities'],
    queryFn: () => salesforceService.getOpportunities(),
  });

  const opportunities = data?.data?.opportunities ?? [];

  return (
    <DashboardWidgetCard
      source="Salesforce"
      sourceLogo={<IntegrationIcon provider="SALESFORCE" />}
      title="Salesforce opportunities"
      deepLinkHref={SALESFORCE_HOME_URL}
      deepLinkLabel="Open Salesforce"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No opportunities found"
          description="Opportunities from Salesforce will appear here"
        />
      ) : (
        <SalesforceOpportunityList opportunities={opportunities} />
      )}
    </DashboardWidgetCard>
  );
}
