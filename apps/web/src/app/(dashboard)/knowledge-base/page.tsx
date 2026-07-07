'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { PageContainer } from '@/components/shared/page-container';
import { DocumentPreviewModal } from '@/components/shared/document-preview-modal';
import { SearchInput } from '@/components/shared/search-input';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { ListSkeleton } from '@/components/shared/loading-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { knowledgeBaseService } from '@/services/knowledge-base.service';

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page, search],
    queryFn: () =>
      knowledgeBaseService.getAll({ page, limit: 10, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => knowledgeBaseService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (previewId === id) setPreviewId(null);
    },
  });

  const documents = data?.data ?? [];

  return (
    <>
      <PageContainer
        title="Knowledge Base"
        description="Company documents used by the AI assistant"
        actions={
          <Link href="/knowledge-base/upload">
            <Button>Upload Document</Button>
          </Link>
        }
      >
        <div className="mb-4 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search documents..." />
        </div>

        {isLoading ? (
          <ListSkeleton count={6} />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No documents"
            description="Upload company policies, guides, and FAQs"
            actionLabel="Upload Document"
            onAction={() => window.location.href = '/knowledge-base/upload'}
          />
        ) : (
          <>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewId(doc.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <h3 className="font-medium text-ink">{doc.title}</h3>
                    <p className="text-xs text-muted">
                      {doc.source === 'WORKDAY' ? 'Workday' : doc.fileName} ·{' '}
                      {(doc.fileSize / 1024).toFixed(1)} KB ·{' '}
                      {doc._count?.chunks ?? 0} chunks ·{' '}
                      {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                    </p>
                  </button>
                  <div className="flex items-center gap-3">
                    {doc.source === 'WORKDAY' && (
                      <Badge variant="info">Workday</Badge>
                    )}
                    <StatusBadge type="document-status" value={doc.status} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {data?.meta && <Pagination meta={data.meta} onPageChange={setPage} />}
          </>
        )}
      </PageContainer>

      <DocumentPreviewModal
        documentId={previewId}
        open={!!previewId}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
}
