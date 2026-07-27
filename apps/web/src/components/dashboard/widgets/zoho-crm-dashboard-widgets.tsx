'use client';

import { Handshake, Target, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { ZohoCrmContactList } from '@/components/shared/zoho-crm-contact-list';
import { ZohoCrmDealList } from '@/components/shared/zoho-crm-deal-list';
import { ZohoCrmLeadList } from '@/components/shared/zoho-crm-lead-list';
import { zohoCrmService } from '@/services/zoho-crm.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const ZOHO_CRM_HOME_URL = 'https://crm.zoho.com';

export function ZohoCrmContactsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoho-crm-contacts'],
    queryFn: () => zohoCrmService.getContacts(),
  });

  const contacts = data?.data?.contacts ?? [];

  return (
    <DashboardWidgetCard
      source="Zoho CRM"
      sourceLogo={<IntegrationIcon provider="ZOHO" />}
      title="Zoho CRM contacts"
      deepLinkHref={ZOHO_CRM_HOME_URL}
      deepLinkLabel="Open Zoho CRM"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Contacts from your Zoho CRM will appear here"
        />
      ) : (
        <ZohoCrmContactList contacts={contacts} />
      )}
    </DashboardWidgetCard>
  );
}

export function ZohoCrmDealsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoho-crm-deals'],
    queryFn: () => zohoCrmService.getDeals(),
  });

  const deals = data?.data?.deals ?? [];

  return (
    <DashboardWidgetCard
      source="Zoho CRM"
      sourceLogo={<IntegrationIcon provider="ZOHO" />}
      title="Zoho CRM deals"
      deepLinkHref={ZOHO_CRM_HOME_URL}
      deepLinkLabel="Open Zoho CRM"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No deals found"
          description="Deals from your Zoho CRM will appear here"
        />
      ) : (
        <ZohoCrmDealList deals={deals} />
      )}
    </DashboardWidgetCard>
  );
}

export function ZohoCrmLeadsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoho-crm-leads'],
    queryFn: () => zohoCrmService.getLeads(),
  });

  const leads = data?.data?.leads ?? [];

  return (
    <DashboardWidgetCard
      source="Zoho CRM"
      sourceLogo={<IntegrationIcon provider="ZOHO" />}
      title="Zoho CRM leads"
      deepLinkHref={ZOHO_CRM_HOME_URL}
      deepLinkLabel="Open Zoho CRM"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No leads found"
          description="Leads from your Zoho CRM will appear here"
        />
      ) : (
        <ZohoCrmLeadList leads={leads} />
      )}
    </DashboardWidgetCard>
  );
}
