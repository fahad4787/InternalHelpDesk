'use client';

import { FolderOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { BoxFileList, BOX_HOME_URL } from '@/components/shared/box-file-list';
import { boxService } from '@/services/box.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function BoxFilesDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['box-files'],
    queryFn: () => boxService.getFiles(),
  });

  const files = data?.data?.files ?? [];

  return (
    <DashboardWidgetCard
      source="Box"
      sourceLogo={<IntegrationIcon provider="BOX" />}
      title="Box files"
      deepLinkHref={BOX_HOME_URL}
      deepLinkLabel="Open Box"
    >
      {isLoading ? (
        <WidgetContentSkeleton lines={5} />
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No files found"
          description="Your Box root folder has no files to show"
        />
      ) : (
        <BoxFileList files={files} />
      )}
    </DashboardWidgetCard>
  );
}
