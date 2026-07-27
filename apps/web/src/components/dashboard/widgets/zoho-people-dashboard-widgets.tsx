'use client';

import { CalendarOff, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/integrations/common/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { ZohoPeopleEmployeeList } from '@/components/integrations/zoho-people/zoho-people-employee-list';
import { ZohoPeopleLeaveList } from '@/components/integrations/zoho-people/zoho-people-leave-list';
import { zohoPeopleService } from '@/services/zoho-people.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

const ZOHO_PEOPLE_HOME_URL = 'https://people.zoho.com';

export function ZohoPeopleEmployeesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoho-people-employees'],
    queryFn: () => zohoPeopleService.getEmployees(),
  });

  const employees = data?.data?.employees ?? [];

  return (
    <DashboardWidgetCard
      source="Zoho People"
      sourceLogo={<IntegrationIcon provider="ZOHO" />}
      title="Zoho People employees"
      deepLinkHref={ZOHO_PEOPLE_HOME_URL}
      deepLinkLabel="Open Zoho People"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Employees from your Zoho People org will appear here"
        />
      ) : (
        <ZohoPeopleEmployeeList employees={employees} />
      )}
    </DashboardWidgetCard>
  );
}

export function ZohoPeopleLeaveDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['zoho-people-leave'],
    queryFn: () => zohoPeopleService.getLeave(),
  });

  const leave = data?.data?.leave ?? [];

  return (
    <DashboardWidgetCard
      source="Zoho People"
      sourceLogo={<IntegrationIcon provider="ZOHO" />}
      title="Zoho People leave"
      deepLinkHref={ZOHO_PEOPLE_HOME_URL}
      deepLinkLabel="Open Zoho People"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : leave.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No leave found"
          description="Leave requests from Zoho People will appear here"
        />
      ) : (
        <ZohoPeopleLeaveList leave={leave} />
      )}
    </DashboardWidgetCard>
  );
}
