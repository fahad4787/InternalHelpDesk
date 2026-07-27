import type { AsanaTask } from '@/services/asana.service';
import type { JiraIssue } from '@/services/jira.service';
import type { MyTaskItem } from '@/types/my-tasks';

export function mapJiraIssueToMyTask(issue: JiraIssue): MyTaskItem {
  return {
    id: `jira:${issue.id}`,
    provider: 'JIRA',
    title: issue.summary,
    status: issue.status,
    subtitle: [issue.issueType, issue.priority].filter(Boolean).join(' · ') || null,
    dueOn: null,
    updatedAt: issue.updatedAt,
    url: issue.webUrl,
    badge: issue.key,
  };
}

export function mapAsanaTaskToMyTask(task: AsanaTask): MyTaskItem {
  return {
    id: `asana:${task.gid}`,
    provider: 'ASANA',
    title: task.name,
    status: task.completed ? 'Completed' : 'Open',
    subtitle: task.projectName,
    dueOn: task.dueOn,
    updatedAt: task.modifiedAt,
    url: task.permalinkUrl,
    badge: null,
  };
}

export function sortMyTasks(tasks: MyTaskItem[]): MyTaskItem[] {
  return [...tasks].sort((a, b) => {
    const aDue = a.dueOn ? new Date(a.dueOn).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueOn ? new Date(b.dueOn).getTime() : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;

    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bUpdated - aUpdated;
  });
}
