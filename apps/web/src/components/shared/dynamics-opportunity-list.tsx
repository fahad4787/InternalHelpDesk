import { format } from 'date-fns';
import { ExternalLink, Handshake, Percent, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DynamicsOpportunity } from '@/services/dynamics.service';

interface DynamicsOpportunityListProps {
  opportunities: DynamicsOpportunity[];
}

function formatCurrency(value: number | null): string | null {
  if (value == null || Number.isNaN(value)) return null;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function OpportunityCard({
  opportunity,
}: {
  opportunity: DynamicsOpportunity;
}) {
  const amount = formatCurrency(opportunity.estimatedValue);

  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">
              {opportunity.name}
            </h3>
            {opportunity.closeProbability != null && (
              <Badge variant="secondary">
                {opportunity.closeProbability}% chance
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 text-sm text-muted">
            {amount && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{amount}</span>
              </div>
            )}
            {opportunity.estimatedCloseDate && (
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">
                  Close{' '}
                  {format(
                    new Date(opportunity.estimatedCloseDate),
                    'MMM d, yyyy',
                  )}
                </span>
              </div>
            )}
            {opportunity.closeProbability != null && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">
                  Probability {opportunity.closeProbability}%
                </span>
              </div>
            )}
            <p className="text-xs text-muted">
              Updated {format(new Date(opportunity.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {opportunity.webUrl && (
          <a
            href={opportunity.webUrl}
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

export function DynamicsOpportunityList({
  opportunities,
}: DynamicsOpportunityListProps) {
  return (
    <div className="space-y-3">
      {opportunities.map((opportunity) => (
        <OpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
}
