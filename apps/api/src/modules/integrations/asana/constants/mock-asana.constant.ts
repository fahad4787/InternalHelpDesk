import {
  AsanaProject,
  AsanaTask,
} from '../types/asana-project.type';

export const MOCK_ASANA_PROJECTS: AsanaProject[] = [
  {
    gid: 'mock-project-1',
    name: 'Product Launch',
    notes: 'Tasks for the next product release',
    color: 'light-blue',
    archived: false,
    permalinkUrl: 'https://app.asana.com',
    workspaceName: 'Acme Workspace',
    modifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    taskCount: 3,
  },
  {
    gid: 'mock-project-2',
    name: 'Customer Support',
    notes: 'Ongoing support requests',
    color: 'light-green',
    archived: false,
    permalinkUrl: 'https://app.asana.com',
    workspaceName: 'Acme Workspace',
    modifiedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    taskCount: 2,
  },
];

export const MOCK_ASANA_MY_TASKS: AsanaTask[] = [
  {
    gid: 'mock-task-1',
    name: 'Draft launch checklist',
    completed: false,
    dueOn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    assigneeName: 'You',
    projectName: 'Product Launch',
    permalinkUrl: 'https://app.asana.com',
    modifiedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    gid: 'mock-task-2',
    name: 'Reply to priority tickets',
    completed: false,
    dueOn: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    assigneeName: 'You',
    projectName: 'Customer Support',
    permalinkUrl: 'https://app.asana.com',
    modifiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    gid: 'mock-task-3',
    name: 'Update help docs',
    completed: true,
    dueOn: null,
    assigneeName: 'You',
    projectName: 'Product Launch',
    permalinkUrl: 'https://app.asana.com',
    modifiedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

export function mockProjectDetail(projectGid: string) {
  const project =
    MOCK_ASANA_PROJECTS.find((p) => p.gid === projectGid) ?? MOCK_ASANA_PROJECTS[0];
  return {
    project,
    tasks: MOCK_ASANA_MY_TASKS.filter((t) => t.projectName === project.name),
  };
}
