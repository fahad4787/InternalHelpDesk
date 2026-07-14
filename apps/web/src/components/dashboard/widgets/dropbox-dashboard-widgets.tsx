'use client';

import { FolderOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { DropboxFileList, DROPBOX_HOME_URL } from '@/components/shared/dropbox-file-list';
import { dropboxService } from '@/services/dropbox.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function DropboxFilesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['dropbox-files'],
    queryFn: () => dropboxService.getFiles(),
  });

  const files = data?.data?.files ?? [];

  return (
    <DashboardWidgetCard
      source="Dropbox"
      sourceLogo={<IntegrationIcon provider="DROPBOX" />}
      title="Dropbox files"
      deepLinkHref={DROPBOX_HOME_URL}
      deepLinkLabel="Open Dropbox"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No files found"
          description="Your Dropbox root folder has no files to show"
        />
      ) : (
        <DropboxFileList files={files} />
      )}
    </DashboardWidgetCard>
  );
}
