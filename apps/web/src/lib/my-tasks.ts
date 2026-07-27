import type { AsanaTask } from '@/services/asana.service';
import type { ClickUpTask } from '@/services/clickup.service';
import type { JiraIssue } from '@/services/jira.service';
import type { TrelloMyCard } from '@/services/trello.service';
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

export function mapClickUpTaskToMyTask(task: ClickUpTask): MyTaskItem {
  const subtitle =
    [task.listName, task.folderName ?? task.spaceName].filter(Boolean).join(' · ') ||
    null;

  return {
    id: `clickup:${task.id}`,
    provider: 'CLICKUP',
    title: task.name,
    status: task.status,
    subtitle,
    dueOn: task.dueDate,
    updatedAt: task.updatedAt,
    url: task.url,
    badge: null,
  };
}

export function mapTrelloCardToMyTask(card: TrelloMyCard): MyTaskItem {
  return {
    id: `trello:${card.id}`,
    provider: 'TRELLO',
    title: card.name,
    status: card.listName,
    subtitle: card.boardName,
    dueOn: card.dueAt,
    updatedAt: card.lastActivityAt,
    url: card.url,
    badge: card.label,
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
