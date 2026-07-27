'use client';

import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  ExternalLink,
  LayoutGrid,
  ListTodo,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/shared/empty-state';
import { WidgetContentSkeleton } from '@/components/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/api-client';
import {
  MondayBoard,
  MondayItem,
  mondayService,
} from '@/services/monday.service';

interface MondayBoardsSectionProps {
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string | null) => void;
}

function ItemRow({ item }: { item: MondayItem }) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-border-warm bg-white p-4 shadow-sm transition-colors hover:border-brand-muted hover:shadow-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-warm bg-canvas">
          <ListTodo className="h-5 w-5 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{item.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {item.statusText && <Badge variant="info">{item.statusText}</Badge>}
            {item.state && <span className="capitalize">{item.state}</span>}
          </div>
        </div>
      </div>
      {item.permalinkUrl && (
        <a
          href={item.permalinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-brand hover:text-brand-hover"
          onClick={(event) => event.stopPropagation()}
        >
          <ExternalLink className="h-5 w-5" />
        </a>
      )}
    </article>
  );
}

function BoardCard({
  board,
  onOpen,
}: {
  board: MondayBoard;
  onOpen: () => void;
}) {
  const activity = board.updatedAt ? new Date(board.updatedAt) : null;

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
          <p className="mt-1 line-clamp-2 text-sm text-muted">{board.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>
            {board.itemsCount} item{board.itemsCount === 1 ? '' : 's'}
          </span>
          {activity && (
            <span>
              Updated {format(activity, 'MMM d, yyyy')} ·{' '}
              {formatDistanceToNow(activity, { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MondayBoardDetailView({
  boardId,
  onBack,
}: {
  boardId: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['monday-board', boardId],
    queryFn: () => mondayService.getBoardDetail(boardId),
  });

  const board = data?.data?.board;
  const items = data?.data?.items ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 widget-card-header pb-4">
        <div className="min-w-0">
          <CardTitle className="text-lg">{board?.name ?? 'Board'}</CardTitle>
          <CardDescription className="mt-1">
            Items on this Monday.com board
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {board?.permalinkUrl && (
            <a href={board.permalinkUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Monday
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
          <WidgetContentSkeleton lines={6} />
        ) : isError ? (
          <EmptyState
            icon={LayoutGrid}
            title="Could not load board"
            description={getErrorMessage(error)}
          />
        ) : !board ? (
          <EmptyState
            icon={LayoutGrid}
            title="Board not found"
            description="This Monday.com board could not be loaded"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No items on this board"
            description="Items will appear here when they are added in Monday.com"
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MondayBoardsSection({
  selectedBoardId,
  onSelectBoard,
}: MondayBoardsSectionProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['monday-boards'],
    queryFn: () => mondayService.getBoards(),
  });

  const boards = data?.data?.boards ?? [];

  if (selectedBoardId) {
    return (
      <MondayBoardDetailView
        boardId={selectedBoardId}
        onBack={() => onSelectBoard(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Boards</CardTitle>
        <CardDescription>Boards from your Monday.com account</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetContentSkeleton lines={5} />
        ) : isError ? (
          <EmptyState
            icon={LayoutGrid}
            title="Could not load boards"
            description={getErrorMessage(error)}
          />
        ) : boards.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="No boards found"
            description="Monday.com boards you can access will appear here"
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
