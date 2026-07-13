'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, CalendarClock, ExternalLink, LayoutGrid } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { TrelloMediaImage } from '@/components/shared/trello-media-image';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrelloBoard,
  TrelloCardSummary,
  trelloService,
} from '@/services/trello.service';

interface TrelloBoardsSectionProps {
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string | null) => void;
}

function BoardCard({
  board,
  onOpen,
}: {
  board: TrelloBoard;
  onOpen: () => void;
}) {
  const activity = board.lastActivityAt
    ? new Date(board.lastActivityAt)
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 text-left shadow-sm transition-all hover:border-brand-muted hover:shadow-md"
    >
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <Badge variant="info">Board</Badge>
        </div>
        <h3 className="font-semibold text-ink">{board.name}</h3>
        {board.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {board.description}
          </p>
        )}
        {activity && (
          <p className="mt-2 text-xs text-muted">
            Active {format(activity, 'MMM d, yyyy')} ·{' '}
            {formatDistanceToNow(activity, { addSuffix: true })}
          </p>
        )}
      </div>
    </button>
  );
}

function BoardCardItem({ card }: { card: TrelloCardSummary }) {
  const imageUrl = card.coverUrl ?? card.imageUrls[0] ?? null;
  const due = card.dueAt ? new Date(card.dueAt) : null;

  return (
    <article className="overflow-hidden rounded-xl border border-border-warm bg-white shadow-sm">
      {imageUrl && (
        <TrelloMediaImage
          url={imageUrl}
          alt={card.name}
          className="max-h-40 rounded-none rounded-t-xl"
        />
      )}
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-ink">{card.name}</h4>
          {card.url && (
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="shrink-0"
            >
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
        {card.descriptionText && (
          <p className="line-clamp-3 text-xs text-muted">
            {card.descriptionText}
          </p>
        )}
        {due && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <CalendarClock className="h-3.5 w-3.5 text-brand" />
            Due {format(due, 'MMM d, yyyy')}
          </p>
        )}
      </div>
    </article>
  );
}

function TrelloBoardDetailView({
  boardId,
  onBack,
}: {
  boardId: string;
  onBack: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['trello-board', boardId],
    queryFn: () => trelloService.getBoardDetail(boardId),
  });

  const board = data?.data?.board;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 widget-card-header pb-4">
        <div className="min-w-0">
          <CardTitle className="text-lg">
            {board?.name ?? 'Board'}
          </CardTitle>
          <CardDescription className="mt-1">
            Lists and cards from this Trello board
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {board?.url && (
            <a href={board.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Trello
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Boards
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <WidgetContentSkeleton lines={8} />
        ) : !board ? (
          <EmptyState
            icon={LayoutGrid}
            title="Board unavailable"
            description="Could not load this Trello board"
          />
        ) : board.lists.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="No lists"
            description="This board has no open lists"
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {board.lists.map((list) => (
              <div
                key={list.id}
                className="w-72 shrink-0 rounded-2xl border border-border-warm bg-canvas/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-ink">
                    {list.name}
                  </h3>
                  <Badge variant="secondary">{list.cards.length}</Badge>
                </div>
                <div className="space-y-3">
                  {list.cards.length === 0 ? (
                    <p className="px-1 text-xs text-muted">No cards</p>
                  ) : (
                    list.cards.map((card) => (
                      <BoardCardItem key={card.id} card={card} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrelloBoardsSection({
  selectedBoardId,
  onSelectBoard,
}: TrelloBoardsSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['trello-boards'],
    queryFn: () => trelloService.getBoards(),
  });

  const boards = data?.data?.boards ?? [];

  if (selectedBoardId) {
    return (
      <TrelloBoardDetailView
        boardId={selectedBoardId}
        onBack={() => onSelectBoard(null)}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="widget-card-header pb-4">
        <CardTitle className="text-lg">Boards</CardTitle>
        <CardDescription className="mt-1">
          Click a board to view its lists and cards
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <WidgetContentSkeleton lines={5} />
        ) : boards.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="No boards found"
            description="Open Trello boards you can access will appear here"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onOpen={() => onSelectBoard(board.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
