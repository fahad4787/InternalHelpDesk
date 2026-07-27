import { CalendarRange, ExternalLink, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ZohoPeopleLeave } from '@/services/zoho-people.service';

interface ZohoPeopleLeaveListProps {
  leave: ZohoPeopleLeave[];
}

function LeaveCard({ item }: { item: ZohoPeopleLeave }) {
  return (
    <article className="rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{item.employeeName}</h3>
            {item.approvalStatus && (
              <Badge variant="secondary">{item.approvalStatus}</Badge>
            )}
            {item.leaveType && <Badge variant="info">{item.leaveType}</Badge>}
          </div>

          <div className="space-y-1.5 text-sm text-muted">
            {(item.fromDate || item.toDate) && (
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 shrink-0 text-brand" />
                <span>
                  {[item.fromDate, item.toDate].filter(Boolean).join(' → ')}
                </span>
              </div>
            )}
            {item.days && (
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 shrink-0 text-brand" />
                <span>{item.days} day(s)</span>
              </div>
            )}
          </div>
        </div>

        {item.webUrl && (
          <a
            href={item.webUrl}
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

export function ZohoPeopleLeaveList({ leave }: ZohoPeopleLeaveListProps) {
  return (
    <div className="space-y-3">
      {leave.map((item) => (
        <LeaveCard key={item.id} item={item} />
      ))}
    </div>
  );
}
