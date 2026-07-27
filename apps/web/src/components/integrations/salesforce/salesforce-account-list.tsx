import { format } from 'date-fns';
import { Building2, ExternalLink, Globe, MapPin, Phone } from 'lucide-react';
import { SalesforceAccount } from '@/services/salesforce.service';

interface SalesforceAccountListProps {
  accounts: SalesforceAccount[];
}

function AccountCard({ account }: { account: SalesforceAccount }) {
  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-brand" />
            <h3 className="text-base font-semibold text-ink">{account.name}</h3>
          </div>
          <div className="space-y-1.5 text-sm text-muted">
            {account.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{account.phone}</span>
              </div>
            )}
            {account.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{account.website}</span>
              </div>
            )}
            {account.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{account.city}</span>
              </div>
            )}
            <p className="text-xs text-muted">
              Updated {format(new Date(account.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {account.webUrl && (
          <a
            href={account.webUrl}
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

export function SalesforceAccountList({ accounts }: SalesforceAccountListProps) {
  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}
