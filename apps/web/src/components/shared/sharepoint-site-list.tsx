import { ExternalLink, Globe } from 'lucide-react';
import { SharePointSite } from '@/services/sharepoint.service';

export const SHAREPOINT_HOME_URL = 'https://www.office.com/launch/sharepoint';
const MAX_SITES = 10;

interface SharePointSiteListProps {
  sites: SharePointSite[];
}

export function SharePointSiteList({ sites }: SharePointSiteListProps) {
  const visibleSites = sites.slice(0, MAX_SITES);

  return (
    <div className="space-y-3">
      {visibleSites.map((site) => (
        <div
          key={site.id}
          className="flex items-center justify-between rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-warm bg-canvas">
              <Globe className="h-5 w-5 text-sky-700" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{site.name}</p>
              {site.description && (
                <p className="mt-0.5 truncate text-xs text-muted">
                  {site.description}
                </p>
              )}
            </div>
          </div>
          {site.webUrl && (
            <a
              href={site.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-brand hover:text-brand-hover"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
