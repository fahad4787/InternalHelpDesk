'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FileUploader } from '@/components/shared/file-uploader';
import { FormField } from '@/components/forms/form-field';
import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { knowledgeBaseService } from '@/services/knowledge-base.service';
import { getErrorMessage } from '@/lib/api-client';

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadDocumentModal({ open, onClose }: UploadDocumentModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setFile(null);
      setTitle('');
      setError('');
    }
  }, [open]);

  const uploadMutation = useMutation({
    mutationFn: () => knowledgeBaseService.upload(file!, title || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onClose();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Upload Document">
      <div className="space-y-5">
        <p className="text-sm text-muted">
          Add policies, guides, and FAQs to your company knowledge base.
        </p>
        <FileUploader
          onFileSelect={(f) => {
            setFile(f);
            setTitle((current) => current || f.name.replace(/\.[^/.]+$/, ''));
          }}
        />
        {file && (
          <>
            <FormField label="Document Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormField>
            <p className="text-sm text-muted">
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
    </Modal>
  );
}
