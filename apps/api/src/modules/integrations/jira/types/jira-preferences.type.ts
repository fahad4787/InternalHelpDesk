export interface JiraPreferences {
  showProfile: boolean;
  showAssignedIssues: boolean;
  showReportedIssues: boolean;
  showProjects: boolean;
}

export const DEFAULT_JIRA_PREFERENCES: JiraPreferences = {
  showProfile: true,
  showAssignedIssues: true,
  showReportedIssues: true,
  showProjects: true,
};
