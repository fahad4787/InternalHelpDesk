'use client';

import { FolderOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import {
  OneDriveFileList,
  ONEDRIVE_HOME_URL,
} from '@/components/shared/onedrive-file-list';
import { oneDriveService } from '@/services/onedrive.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function OneDriveFilesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['onedrive-files'],
    queryFn: () => oneDriveService.getFiles(),
  });

  const files = data?.data?.files ?? [];

  return (
    <DashboardWidgetCard
      source="OneDrive"
      sourceLogo={<IntegrationIcon provider="ONEDRIVE" />}
      title="OneDrive files"
      deepLinkHref={ONEDRIVE_HOME_URL}
      deepLinkLabel="Open OneDrive"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No files found"
          description="Your OneDrive root folder has no files to show"
        />
      ) : (
        <OneDriveFileList files={files} />
      )}
    </DashboardWidgetCard>
  );
}
