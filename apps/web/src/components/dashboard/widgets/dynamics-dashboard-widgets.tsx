'use client';

import { Building2, Handshake, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DynamicsAccountList } from '@/components/shared/dynamics-account-list';
import { DynamicsContactList } from '@/components/shared/dynamics-contact-list';
import { DynamicsOpportunityList } from '@/components/shared/dynamics-opportunity-list';
import { dynamicsService } from '@/services/dynamics.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const DYNAMICS_HOME_URL = 'https://dynamics.microsoft.com';

export function DynamicsContactsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dynamics-contacts'],
    queryFn: () => dynamicsService.getContacts(),
  });

  const contacts = data?.data?.contacts ?? [];

  return (
    <DashboardWidgetCard
      source="Dynamics 365"
      sourceLogo={<IntegrationIcon provider="DYNAMICS_365" />}
      title="Dynamics contacts"
      deepLinkHref={DYNAMICS_HOME_URL}
      deepLinkLabel="Open Dynamics"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Contacts from your Dynamics 365 CRM will appear here"
        />
      ) : (
        <DynamicsContactList contacts={contacts} />
      )}
    </DashboardWidgetCard>
  );
}

export function DynamicsAccountsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dynamics-accounts'],
    queryFn: () => dynamicsService.getAccounts(),
  });

  const accounts = data?.data?.accounts ?? [];

  return (
    <DashboardWidgetCard
      source="Dynamics 365"
      sourceLogo={<IntegrationIcon provider="DYNAMICS_365" />}
      title="Dynamics accounts"
      deepLinkHref={DYNAMICS_HOME_URL}
      deepLinkLabel="Open Dynamics"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No accounts found"
          description="Accounts from your Dynamics 365 CRM will appear here"
        />
      ) : (
        <DynamicsAccountList accounts={accounts} />
      )}
    </DashboardWidgetCard>
  );
}

export function DynamicsOpportunitiesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dynamics-opportunities'],
    queryFn: () => dynamicsService.getOpportunities(),
  });

  const opportunities = data?.data?.opportunities ?? [];

  return (
    <DashboardWidgetCard
      source="Dynamics 365"
      sourceLogo={<IntegrationIcon provider="DYNAMICS_365" />}
      title="Dynamics opportunities"
      deepLinkHref={DYNAMICS_HOME_URL}
      deepLinkLabel="Open Dynamics"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No opportunities found"
          description="Opportunities from Dynamics 365 Sales will appear here"
        />
      ) : (
        <DynamicsOpportunityList opportunities={opportunities} />
      )}
    </DashboardWidgetCard>
  );
}
