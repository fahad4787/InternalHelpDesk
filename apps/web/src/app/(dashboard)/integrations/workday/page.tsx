'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, RefreshCw, ScrollText } from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { PageSpinner, WidgetContentSkeleton } from '@/components/shared/loading-state';
import { ToastContainer, showToast } from '@/components/shared/toast';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationWidgetsSection } from '@/components/shared/integration-widget-panel';
import { WorkdayConnectionCard } from '@/components/shared/workday-connection-card';
import { Modal } from '@/components/shared/modal';
import { DataTable, Column } from '@/components/tables/data-table';
import { FormField } from '@/components/forms/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  SYNC_STATUS_VARIANTS,
  WORKDAY_ENVIRONMENTS,
} from '@/constants/workday';
import { getErrorMessage } from '@/lib/api-client';
import {
  WorkdayConnectPayload,
  WorkdaySyncLog,
  workdayService,
} from '@/services/workday.service';

const syncLogColumns: Column<WorkdaySyncLog>[] = [
  {
    key: 'startedAt',
    header: 'Started',
    cell: (row) => format(new Date(row.startedAt), 'MMM d, yyyy h:mm a'),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={SYNC_STATUS_VARIANTS[row.status] ?? 'secondary'}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'totalItems',
    header: 'Total',
    cell: (row) => row.totalItems,
  },
  {
    key: 'createdCount',
    header: 'Created',
    cell: (row) => row.createdCount,
  },
  {
    key: 'updatedCount',
    header: 'Updated',
    cell: (row) => row.updatedCount,
  },
  {
    key: 'failedCount',
    header: 'Failed',
    cell: (row) => row.failedCount,
  },
  {
    key: 'message',
    header: 'Message',
    cell: (row) => row.message ?? '—',
  },
];

export default function WorkdayIntegrationPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WorkdayConnectPayload>({
    tenantUrl: '',
    clientId: '',
    clientSecret: '',
    environment: 'SANDBOX',
  });
  const [resetOpen, setResetOpen] = useState(false);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['workday-status'],
    queryFn: () => workdayService.getStatus(),
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['workday-sync-logs'],
    queryFn: () => workdayService.getSyncLogs(),
  });

  const status = statusData?.data;
  const logs = logsData?.data ?? [];

  useEffect(() => {
    if (!status) return;
    setForm((prev) => ({
      ...prev,
      tenantUrl: status.tenantUrl ?? '',
      clientId: status.clientId ?? '',
      environment: (status.environment as WorkdayConnectPayload['environment']) ?? 'SANDBOX',
    }));
  }, [status]);

  const connectMutation = useMutation({
    mutationFn: () => workdayService.connect(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workday-status'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      showToast('Workday connection saved', 'success');
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  const testMutation = useMutation({
    mutationFn: () => workdayService.testConnection(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workday-status'] });
      showToast('Connection test successful', 'success');
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  const syncMutation = useMutation({
    mutationFn: () => workdayService.sync(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['workday-status'] });
      queryClient.invalidateQueries({ queryKey: ['workday-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['workday-articles'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      const s = res.data;
      showToast(
        `Sync complete: ${s.created} created, ${s.updated} updated, ${s.failed} failed`,
        s.failed > 0 ? 'info' : 'success',
      );
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  const resetMutation = useMutation({
    mutationFn: () => workdayService.reset(),
    onSuccess: (res) => {
      setResetOpen(false);
      setForm({
        tenantUrl: '',
        clientId: '',
        clientSecret: '',
        environment: 'SANDBOX',
      });
      queryClient.invalidateQueries({ queryKey: ['workday-status'] });
      queryClient.invalidateQueries({ queryKey: ['workday-sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['workday-articles'] });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      const { documentsRemoved, syncLogsRemoved } = res.data;
      showToast(
        `Reset complete: ${documentsRemoved} articles and ${syncLogsRemoved} sync logs removed`,
        'success',
      );
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  const updateField = <K extends keyof WorkdayConnectPayload>(
    key: K,
    value: WorkdayConnectPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (statusLoading) {
    return (
      <PageContainer
        title="Workday Integration"
        description="Sync help articles and internal SOPs from Workday into your knowledge base"
      >
        <PageSpinner label="Loading Workday…" />
      </PageContainer>
    );
  }

  const isConnected = status?.connected === true;
  const connectError = connectMutation.error
    ? getErrorMessage(connectMutation.error)
    : null;

  return (
    <>
      <PageContainer
        title="Workday Integration"
        description="Sync help articles and internal SOPs from Workday into your knowledge base"
        actions={
          <Link href="/integrations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Integrations
            </Button>
          </Link>
        }
      >
        <div className="mb-6 space-y-6">
          <WorkdayConnectionCard
            status={status}
            isLoading={false}
            isConnected={isConnected}
            isPending={connectMutation.isPending || resetMutation.isPending}
            isConnecting={connectMutation.isPending}
            isDisconnecting={resetMutation.isPending}
            connectError={connectError}
            onConnect={() => connectMutation.mutate()}
            onDisconnect={() => setResetOpen(true)}
          />

          {isConnected && <IntegrationWidgetsSection provider="WORKDAY" />}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Connection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Tenant URL">
                  <Input
                    value={form.tenantUrl ?? ''}
                    onChange={(e) => updateField('tenantUrl', e.target.value)}
                    placeholder="https://wd2-impl-services1.workday.com"
                  />
                </FormField>
                <FormField label="Client ID">
                  <Input
                    value={form.clientId ?? ''}
                    onChange={(e) => updateField('clientId', e.target.value)}
                    placeholder="Workday OAuth Client ID"
                  />
                </FormField>
                <FormField label="Client Secret">
                  <Input
                    type="password"
                    value={form.clientSecret ?? ''}
                    onChange={(e) => updateField('clientSecret', e.target.value)}
                    placeholder={status?.hasClientSecret ? '•••••••• (saved)' : 'Workday OAuth Client Secret'}
                  />
                </FormField>
                <FormField label="Environment">
                  <Select
                    value={form.environment ?? 'SANDBOX'}
                    onChange={(e) =>
                      updateField('environment', e.target.value as WorkdayConnectPayload['environment'])
                    }
                  >
                    {WORKDAY_ENVIRONMENTS.map((env) => (
                      <option key={env.value} value={env.value}>
                        {env.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                  >
                    {testMutation.isPending ? 'Testing…' : 'Test Connection'}
                  </Button>
                  {isConnected && (
                    <Button
                      onClick={() => connectMutation.mutate()}
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? 'Saving…' : 'Update Connection'}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending || !isConnected}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    {syncMutation.isPending ? 'Syncing…' : 'Sync Articles'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink">Sync Logs</h2>
              {logsLoading ? (
                <WidgetContentSkeleton lines={4} />
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={ScrollText}
                  title="No sync logs"
                  description="Run a sync to see history here"
                />
              ) : (
                <DataTable
                  columns={syncLogColumns}
                  data={logs}
                  keyExtractor={(row) => row.id}
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Last Sync</span>
                  <span className="font-medium text-ink">
                    {status?.lastSyncedAt
                      ? format(new Date(status.lastSyncedAt), 'MMM d, yyyy h:mm a')
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Last Tested</span>
                  <span className="font-medium text-ink">
                    {status?.lastTestedAt
                      ? format(new Date(status.lastTestedAt), 'MMM d, yyyy h:mm a')
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Synced Articles</span>
                  <span className="font-medium text-ink">
                    {status?.totalSyncedArticles ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset Workday Integration">
        <p className="text-sm text-muted">
          This will remove the Workday connection settings, all synced Workday articles from the
          knowledge base, and all sync logs. This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? 'Resetting...' : 'Reset Everything'}
          </Button>
        </div>
      </Modal>
      <ToastContainer />
    </>
  );
}
