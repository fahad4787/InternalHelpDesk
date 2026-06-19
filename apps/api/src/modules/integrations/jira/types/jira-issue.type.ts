export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string | null;
  issueType: string;
  assignee: string | null;
  reporter: string | null;
  updatedAt: string;
  webUrl: string | null;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectType: string | null;
  webUrl: string | null;
}

export interface JiraProfile {
  accountId: string | null;
  email: string | null;
  displayName: string | null;
  siteUrl: string | null;
  siteName: string | null;
}
