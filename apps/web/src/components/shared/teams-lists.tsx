import { ExternalLink, MessagesSquare, Users } from 'lucide-react';
import { TeamsChat, TeamsTeam } from '@/services/teams.service';

export function TeamsTeamList({ teams }: { teams: TeamsTeam[] }) {
  return (
    <ul className="space-y-2">
      {teams.map((team) => (
        <li
          key={team.id}
          className="flex items-start gap-3 rounded-xl border border-border-warm bg-white p-3"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-ink">{team.displayName}</p>
              {team.webUrl && (
                <a
                  href={team.webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-brand"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {team.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{team.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TeamsChatList({ chats }: { chats: TeamsChat[] }) {
  return (
    <ul className="space-y-2">
      {chats.map((chat) => (
        <li
          key={chat.id}
          className="flex items-start gap-3 rounded-xl border border-border-warm bg-white p-3"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
            <MessagesSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-ink">{chat.topic}</p>
              {chat.webUrl && (
                <a
                  href={chat.webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-brand"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {chat.lastMessagePreview && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                {chat.lastMessagePreview}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
