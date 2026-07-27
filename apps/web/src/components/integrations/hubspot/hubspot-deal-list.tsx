import { format } from 'date-fns';
import { CalendarClock, DollarSign, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HubSpotDeal } from '@/services/hubspot.service';

interface HubSpotDealListProps {
  deals: HubSpotDeal[];
}

function formatAmount(amount: string | null): string | null {
  if (!amount) return null;
  const value = Number(amount);
  if (Number.isNaN(value)) return amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function DealCard({ deal }: { deal: HubSpotDeal }) {
  const amount = formatAmount(deal.amount);

  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{deal.name}</h3>
            {deal.stage && <Badge variant="info">{deal.stage}</Badge>}
          </div>

          <div className="space-y-1.5 text-sm text-muted">
            {amount && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 shrink-0 text-brand" />
                <span>{amount}</span>
              </div>
            )}
            {deal.closeDate && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0 text-brand" />
                <span>
                  Closes {format(new Date(deal.closeDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            <p className="text-xs text-muted">
              Updated {format(new Date(deal.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {deal.webUrl && (
          <a
            href={deal.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-brand hover:text-brand-hover"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        )}
      </div>
    </article>
  );
}

export function HubSpotDealList({ deals }: HubSpotDealListProps) {
  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  );
}
