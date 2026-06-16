'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageContainer } from '@/components/shared/page-container';
import { FileUploader } from '@/components/shared/file-uploader';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { knowledgeBaseService } from '@/services/knowledge-base.service';
import { getErrorMessage } from '@/lib/api-client';

export default function UploadDocumentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const uploadMutation = useMutation({
    mutationFn: () => knowledgeBaseService.upload(file!, title || undefined),
    onSuccess: () => router.push('/knowledge-base'),
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <PageContainer
      title="Upload Document"
      description="Add documents to your company knowledge base"
    >
      <div className="mx-auto max-w-xl space-y-6">
        <FileUploader
          onFileSelect={(f) => {
            setFile(f);
            if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
          }}
        />
        {file && (
          <>
            <FormField label="Document Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <p className="text-sm text-slate-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              className="w-full"
              disabled={uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
            </Button>
          </>
        )}
      </div>
    </PageContainer>
  );
}
