import { ExternalLink, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JiraProject } from '@/services/jira.service';

interface JiraProjectListProps {
  projects: JiraProject[];
}

export function JiraProjectList({ projects }: JiraProjectListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <article
          key={project.id}
          className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
        >
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                <FolderKanban className="h-4 w-4" />
              </div>
              <Badge variant="info">{project.key}</Badge>
            </div>
            <h3 className="font-semibold text-slate-900">{project.name}</h3>
            {project.projectType && (
              <p className="mt-1 text-sm capitalize text-slate-500">
                {project.projectType.replace(/_/g, ' ')}
              </p>
            )}
          </div>

          {project.webUrl && (
            <a href={project.webUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
