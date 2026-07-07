import { format } from 'date-fns';
import { ExternalLink, File, FileSpreadsheet, FileText } from 'lucide-react';
import { GoogleDriveFile } from '@/services/google-calendar.service';

export const GOOGLE_DRIVE_URL = 'https://drive.google.com/drive/my-drive';
const MAX_FILES = 10;

interface GoogleDriveListProps {
  files: GoogleDriveFile[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes('spreadsheet')) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
  }
  if (mimeType.includes('pdf') || mimeType.includes('document')) {
    return <FileText className="h-5 w-5 text-brand" />;
  }
  return <File className="h-5 w-5 text-muted" />;
}

export function GoogleDriveList({ files }: GoogleDriveListProps) {
  const visibleFiles = files.slice(0, MAX_FILES);

  return (
    <div className="space-y-3">
      {visibleFiles.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-warm bg-canvas">
              <FileIcon mimeType={file.mimeType} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatFileSize(file.size)} ·{' '}
                {format(new Date(file.modifiedAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          {file.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-brand hover:text-brand-hover"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
