'use client';

import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUploader({
  onFileSelect,
  accept = '.txt,.md,.pdf,.doc,.docx,.json',
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(
    (file: File) => {
      setError('');
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be under ${maxSizeMB}MB`);
        return;
      }
      onFileSelect(file);
    },
    [maxSizeMB, onFileSelect],
  );

  return (
    <div>
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200',
          dragOver
            ? 'border-brand bg-brand-light'
            : 'border-border-warm bg-canvas hover:border-brand hover:bg-brand-light/50',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <div className="mb-3 rounded-full border border-brand-muted bg-brand-light p-3">
          <Upload className="h-6 w-6 text-brand" />
        </div>
        <p className="text-sm font-medium text-ink">
          Drop your file here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted">
          Supports TXT, MD, PDF, DOC, JSON (max {maxSizeMB}MB)
        </p>
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
