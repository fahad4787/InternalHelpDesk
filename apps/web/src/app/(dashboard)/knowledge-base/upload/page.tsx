import { redirect } from 'next/navigation';

/** Legacy upload route — upload now lives as a modal on Knowledge Base. */
export default function UploadDocumentPage() {
  redirect('/knowledge-base');
}
