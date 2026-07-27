import { format } from 'date-fns';
import { Briefcase, Building2, ExternalLink, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { HubSpotContact } from '@/services/hubspot.service';

interface HubSpotContactListProps {
  contacts: HubSpotContact[];
}

function ContactCard({ contact }: { contact: HubSpotContact }) {
  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{contact.name}</h3>
            {contact.lifecycleStage && (
              <Badge variant="secondary">{contact.lifecycleStage}</Badge>
            )}
          </div>

          <div className="space-y-1.5 text-sm text-muted">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{contact.company}</span>
              </div>
            )}
            {contact.jobTitle && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{contact.jobTitle}</span>
              </div>
            )}
            <p className="text-xs text-muted">
              Updated {format(new Date(contact.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {contact.webUrl && (
          <a
            href={contact.webUrl}
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

export function HubSpotContactList({ contacts }: HubSpotContactListProps) {
  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
