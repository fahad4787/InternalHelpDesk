import { JiraIssue, JiraProject } from '../types/jira-issue.type';

export const MOCK_JIRA_ISSUES: JiraIssue[] = [
  {
    id: 'mock-1',
    key: 'HELP-101',
    summary: 'VPN connection drops intermittently',
    status: 'In Progress',
    priority: 'High',
    issueType: 'Bug',
    assignee: 'You',
    reporter: 'Alex Johnson',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    webUrl: 'https://example.atlassian.net/browse/HELP-101',
  },
  {
    id: 'mock-2',
    key: 'HELP-98',
    summary: 'Request new laptop for onboarding',
    status: 'To Do',
    priority: 'Medium',
    issueType: 'Task',
    assignee: 'You',
    reporter: 'Sarah Chen',
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    webUrl: 'https://example.atlassian.net/browse/HELP-98',
  },
  {
    id: 'mock-3',
    key: 'HELP-87',
    summary: 'Password reset for finance portal',
    status: 'Done',
    priority: 'Low',
    issueType: 'Service Request',
    assignee: 'Mike Davis',
    reporter: 'You',
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    webUrl: 'https://example.atlassian.net/browse/HELP-87',
  },
];

export const MOCK_JIRA_PROJECTS: JiraProject[] = [
  {
    id: 'mock-p1',
    key: 'HELP',
    name: 'IT Helpdesk',
    projectType: 'software',
    webUrl: 'https://example.atlassian.net/browse/HELP',
  },
  {
    id: 'mock-p2',
    key: 'HR',
    name: 'HR Requests',
    projectType: 'service_desk',
    webUrl: 'https://example.atlassian.net/browse/HR',
  },
];

export function getMockAssignedIssues(): JiraIssue[] {
  return MOCK_JIRA_ISSUES.filter((issue) => issue.assignee === 'You');
}

export function getMockReportedIssues(): JiraIssue[] {
  return MOCK_JIRA_ISSUES.filter((issue) => issue.reporter === 'You');
}
