'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal';
import { EmptyState } from '@/components/shared/empty-state';
import { IntegrationIcon } from '@/components/shared/integration-icon';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { workdayService } from '@/services/workday.service';
import { DashboardWidgetCard } from '../dashboard-widget-card';

export function WorkdayDashboardWidget() {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ['workday-status'],
    queryFn: () => workdayService.getStatus(),
  });

  const connected = statusData?.data?.connected ?? false;

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['workday-articles', 'dashboard'],
    queryFn: () => workdayService.getArticles({ limit: 8 }),
    enabled: connected,
  });

  const articles = articlesData?.data ?? [];

  return (
    <>
      <DashboardWidgetCard
        source="Workday"
        sourceLogo={<IntegrationIcon provider="WORKDAY" />}
        title="Help articles"
        deepLinkHref="/integrations/workday"
        deepLinkLabel="Open Workday"
      >
        {isLoading ? (
          <WidgetContentSkeleton lines={5} />
        ) : articles.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No articles synced"
            description="Sync articles from Workday to see them here"
          />
        ) : (
          <ul className="space-y-2" role="list">
            {articles.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => setPreviewId(article.id)}
                  className="w-full rounded-xl border border-border-warm p-3 text-left transition-colors hover:border-brand-muted hover:bg-canvas"
                >
                  <p className="font-medium text-ink">{article.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {article.category ?? 'Uncategorized'}
                    {article._count?.chunks != null
                      ? ` · ${article._count.chunks} chunks`
                      : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {articles.length > 0 && (
          <Link
            href="/integrations/workday"
            className="mt-3 inline-block text-xs font-medium text-brand hover:underline"
          >
            View all on Workday integration
          </Link>
        )}
      </DashboardWidgetCard>

      <DocumentPreviewModal
        documentId={previewId}
        open={!!previewId}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
}
