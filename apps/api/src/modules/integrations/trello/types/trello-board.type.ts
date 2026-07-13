export interface TrelloBoard {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  closed: boolean;
  lastActivityAt: string | null;
}

export interface TrelloCardSummary {
  id: string;
  name: string;
  description: string | null;
  descriptionText: string | null;
  imageUrls: string[];
  coverUrl: string | null;
  url: string | null;
  dueAt: string | null;
  lastActivityAt: string | null;
}

export interface TrelloListWithCards {
  id: string;
  name: string;
  cards: TrelloCardSummary[];
}

export interface TrelloBoardDetail {
  id: string;
  name: string;
  url: string | null;
  lists: TrelloListWithCards[];
}
