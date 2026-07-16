'use client';

import { Handshake, LifeBuoy, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { HubSpotContactList } from '@/components/shared/hubspot-contact-list';
import { HubSpotDealList } from '@/components/shared/hubspot-deal-list';
import { HubSpotTicketList } from '@/components/shared/hubspot-ticket-list';
import { hubspotService } from '@/services/hubspot.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const HUBSPOT_HOME_URL = 'https://app.hubspot.com';

export function HubSpotContactsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['hubspot-contacts'],
    queryFn: () => hubspotService.getContacts(),
  });

  const contacts = data?.data?.contacts ?? [];

  return (
    <DashboardWidgetCard
      source="HubSpot"
      sourceLogo={<IntegrationIcon provider="HUBSPOT" />}
      title="HubSpot contacts"
      deepLinkHref={HUBSPOT_HOME_URL}
      deepLinkLabel="Open HubSpot"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Contacts from your HubSpot CRM will appear here"
        />
      ) : (
        <HubSpotContactList contacts={contacts} />
      )}
    </DashboardWidgetCard>
  );
}

export function HubSpotDealsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['hubspot-deals'],
    queryFn: () => hubspotService.getDeals(),
  });

  const deals = data?.data?.deals ?? [];

  return (
    <DashboardWidgetCard
      source="HubSpot"
      sourceLogo={<IntegrationIcon provider="HUBSPOT" />}
      title="HubSpot deals"
      deepLinkHref={HUBSPOT_HOME_URL}
      deepLinkLabel="Open HubSpot"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No deals found"
          description="Deals from your HubSpot CRM will appear here"
        />
      ) : (
        <HubSpotDealList deals={deals} />
      )}
    </DashboardWidgetCard>
  );
}

export function HubSpotTicketsDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['hubspot-tickets'],
    queryFn: () => hubspotService.getTickets(),
  });

  const tickets = data?.data?.tickets ?? [];

  return (
    <DashboardWidgetCard
      source="HubSpot"
      sourceLogo={<IntegrationIcon provider="HUBSPOT" />}
      title="HubSpot tickets"
      deepLinkHref={HUBSPOT_HOME_URL}
      deepLinkLabel="Open HubSpot"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No tickets found"
          description="Support tickets from your HubSpot Service Hub will appear here"
        />
      ) : (
        <HubSpotTicketList tickets={tickets} />
      )}
    </DashboardWidgetCard>
  );
}
