export interface JiraPreferences {
  showAssignedIssues: boolean;
  showReportedIssues: boolean;
  showProjects: boolean;
}

export const DEFAULT_JIRA_PREFERENCES: JiraPreferences = {
  showAssignedIssues: true,
  showReportedIssues: true,
  showProjects: true,
};
