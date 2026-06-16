import { Badge } from '@/components/ui/badge';
import { DocumentStatus } from '@/types/api.types';

const documentVariants: Record<DocumentStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING: 'warning',
  PROCESSING: 'info',
  READY: 'success',
  FAILED: 'danger',
};

interface StatusBadgeProps {
  type: 'document-status';
  value: string;
  label?: string;
}

export function StatusBadge({ value, label }: StatusBadgeProps) {
  const variant = documentVariants[value as DocumentStatus] ?? 'secondary';
  const displayLabel = label ?? value.replace(/_/g, ' ');

  return <Badge variant={variant}>{displayLabel}</Badge>;
}
