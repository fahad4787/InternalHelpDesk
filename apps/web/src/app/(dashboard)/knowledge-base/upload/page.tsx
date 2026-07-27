'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/shared/loading-state';

/** Legacy upload route — upload now lives as a modal on Knowledge Base. */
export default function UploadDocumentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/knowledge-base');
  }, [router]);

  return <FullPageLoader />;
}
