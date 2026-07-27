import { format } from 'date-fns';
import { Building2, ExternalLink, Mail, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ZohoCrmLead } from '@/services/zoho-crm.service';

interface ZohoCrmLeadListProps {
  leads: ZohoCrmLead[];
}

function LeadCard({ lead }: { lead: ZohoCrmLead }) {
  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{lead.name}</h3>
            {lead.status && <Badge variant="secondary">{lead.status}</Badge>}
          </div>

          <div className="space-y-1.5 text-sm text-muted">
            {lead.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{lead.company}</span>
              </div>
            )}
            {lead.source && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{lead.source}</span>
              </div>
            )}
            <p className="text-xs text-muted">
              Updated {format(new Date(lead.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {lead.webUrl && (
          <a
            href={lead.webUrl}
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

export function ZohoCrmLeadList({ leads }: ZohoCrmLeadListProps) {
  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
