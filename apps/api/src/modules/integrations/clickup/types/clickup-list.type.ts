export interface ClickUpTask {
  id: string;
  name: string;
  status: string | null;
  dueDate: string | null;
  url: string | null;
  assignees: string[];
}

export interface ClickUpList {
  id: string;
  name: string;
  taskCount: number | null;
  spaceName: string | null;
  folderName: string | null;
  teamName: string | null;
}

export interface ClickUpListDetail {
  list: ClickUpList;
  tasks: ClickUpTask[];
}

export interface ClickUpProfile {
  id: string | null;
  username: string | null;
  email: string | null;
}
