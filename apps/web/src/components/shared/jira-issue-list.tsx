import { format, formatDistanceToNow } from 'date-fns';
import { ExternalLink, Tag, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JiraIssue } from '@/services/jira.service';

interface JiraIssueListProps {
  issues: JiraIssue[];
}

function getStatusVariant(status: string): 'success' | 'info' | 'secondary' {
  const normalized = status.toLowerCase();
  if (normalized.includes('done') || normalized.includes('closed')) {
    return 'success';
  }
  if (normalized.includes('progress')) {
    return 'info';
  }
  return 'secondary';
}

function JiraIssueCard({ issue }: { issue: JiraIssue }) {
  const updated = new Date(issue.updatedAt);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="info">{issue.key}</Badge>
            <Badge variant={getStatusVariant(issue.status)}>{issue.status}</Badge>
            {issue.priority && <Badge variant="secondary">{issue.priority}</Badge>}
            <Badge variant="secondary">{issue.issueType}</Badge>
          </div>

          <h3 className="text-base font-semibold text-slate-900">{issue.summary}</h3>

          <div className="mt-3 space-y-1.5 text-sm text-slate-600">
            {issue.assignee && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-brand" />
                <span>Assignee: {issue.assignee}</span>
              </div>
            )}
            {issue.reporter && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 shrink-0 text-brand" />
                <span>Reporter: {issue.reporter}</span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              Updated {format(updated, 'MMM d, yyyy')} ·{' '}
              {formatDistanceToNow(updated, { addSuffix: true })}
            </p>
          </div>
        </div>

        {issue.webUrl && (
          <a href={issue.webUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
          </a>
        )}
      </div>
    </article>
  );
}

export function JiraIssueList({ issues }: JiraIssueListProps) {
  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <JiraIssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
