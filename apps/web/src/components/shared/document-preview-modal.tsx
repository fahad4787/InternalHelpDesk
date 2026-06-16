'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Modal } from '@/components/shared/modal';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { knowledgeBaseService } from '@/services/knowledge-base.service';

interface DocumentPreviewModalProps {
  documentId: string | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({
  documentId,
  open,
  onClose,
}: DocumentPreviewModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['document-preview', documentId],
    queryFn: () => knowledgeBaseService.getPreview(documentId!),
    enabled: open && !!documentId,
  });

  const doc = data?.data;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doc?.title ?? 'Document Preview'}
      className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden"
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : !doc ? (
        <p className="text-sm text-red-600">Document not found</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {doc.source === 'WORKDAY' && <Badge variant="info">Workday</Badge>}
            <StatusBadge type="document-status" value={doc.status} />
            <span className="text-xs text-slate-500">
              {doc.source === 'WORKDAY' ? 'Workday' : doc.fileName} ·{' '}
              {(doc.fileSize / 1024).toFixed(1)} KB · {doc._count?.chunks ?? 0} chunks
            </span>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3">
            <div className="min-h-0 lg:col-span-2">
              <pre className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {doc.content || 'No content available'}
              </pre>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-900">Details</p>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Source</span>
                <span className="font-medium text-slate-900">
                  {doc.source === 'WORKDAY' ? 'Workday' : 'Manual Upload'}
                </span>
              </div>
              {doc.category && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-900">{doc.category}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Uploaded by</span>
                <span className="font-medium text-slate-900">
                  {doc.uploadedBy
                    ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Created</span>
                <span className="font-medium text-slate-900">
                  {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              {doc.lastSyncedAt && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Last synced</span>
                  <span className="font-medium text-slate-900">
                    {format(new Date(doc.lastSyncedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {doc.sourceUrl && (
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Workday
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
