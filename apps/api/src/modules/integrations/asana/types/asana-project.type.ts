export interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  dueOn: string | null;
  assigneeName: string | null;
  projectName: string | null;
  permalinkUrl: string | null;
  modifiedAt: string | null;
}

export interface AsanaProject {
  gid: string;
  name: string;
  notes: string | null;
  color: string | null;
  archived: boolean;
  permalinkUrl: string | null;
  workspaceName: string | null;
  modifiedAt: string | null;
  taskCount: number;
}

export interface AsanaProjectDetail {
  project: AsanaProject;
  tasks: AsanaTask[];
}

export interface AsanaProfile {
  gid: string | null;
  name: string | null;
  email: string | null;
}
