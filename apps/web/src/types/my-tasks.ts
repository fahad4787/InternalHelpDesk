export type MyTaskProvider = 'JIRA' | 'ASANA' | 'CLICKUP' | 'TRELLO';

export interface MyTaskItem {
  id: string;
  provider: MyTaskProvider;
  title: string;
  status: string | null;
  subtitle: string | null;
  dueOn: string | null;
  updatedAt: string | null;
  url: string | null;
  badge: string | null;
}
