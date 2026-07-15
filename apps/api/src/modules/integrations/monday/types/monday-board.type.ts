export interface MondayItem {
  id: string;
  name: string;
  state: string | null;
  updatedAt: string | null;
  permalinkUrl: string | null;
  statusText: string | null;
}

export interface MondayBoard {
  id: string;
  name: string;
  description: string | null;
  boardKind: string | null;
  itemsCount: number;
  updatedAt: string | null;
  permalinkUrl: string | null;
}

export interface MondayBoardDetail {
  board: MondayBoard;
  items: MondayItem[];
}

export interface MondayProfile {
  id: string | null;
  name: string | null;
  email: string | null;
  accountSlug: string | null;
  accountName: string | null;
}
