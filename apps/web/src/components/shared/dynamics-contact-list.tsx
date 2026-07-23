import { format } from 'date-fns';
import { Briefcase, ExternalLink, Mail, Phone } from 'lucide-react';
import { DynamicsContact } from '@/services/dynamics.service';

interface DynamicsContactListProps {
  contacts: DynamicsContact[];
}

function ContactCard({ contact }: { contact: DynamicsContact }) {
  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-base font-semibold text-ink">{contact.name}</h3>
          <div className="space-y-1.5 text-sm text-muted">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand" />
                <span className="truncate">{contact.phone}</span>
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

export function DynamicsContactList({ contacts }: DynamicsContactListProps) {
  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} />
      ))}
    </div>
  );
}
