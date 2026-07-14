import {
  AsanaProject,
  AsanaTask,
} from '../types/asana-project.type';

export const MOCK_ASANA_PROJECTS: AsanaProject[] = [
  {
    gid: 'mock-project-1',
    name: 'Work requests',
    notes: 'Incoming work requests for Legal, Operations, and HR',
    color: 'light-blue',
    archived: false,
    permalinkUrl: 'https://app.asana.com',
    workspaceName: 'My Workspace',
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
    workspaceName: 'My Workspace',
    modifiedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    taskCount: 2,
  },
];

export const MOCK_ASANA_MY_TASKS: AsanaTask[] = [
  {
    gid: 'mock-task-1',
    name: 'Review and approve project plan updates',
    completed: false,
    dueOn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    assigneeName: 'You',
    projectName: 'Work requests',
    permalinkUrl: 'https://app.asana.com',
    modifiedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    gid: 'mock-task-2',
    name: 'Submit feedback on deliverable',
    completed: false,
    dueOn: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    assigneeName: 'You',
    projectName: 'Work requests',
    permalinkUrl: 'https://app.asana.com',
    modifiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    gid: 'mock-task-3',
    name: 'Request resource allocation',
    completed: false,
    dueOn: null,
    assigneeName: 'You',
    projectName: 'Work requests',
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
