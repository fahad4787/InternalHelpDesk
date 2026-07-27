import { Hash, Mail, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileCardSkeleton } from '@/components/shared/loading-state';
import { SlackProfile } from '@/services/slack.service';

interface SlackProfileCardProps {
  profile: SlackProfile | null;
  isLoading: boolean;
}

export function SlackProfileCard({ profile, isLoading }: SlackProfileCardProps) {
  if (isLoading) {
    return <ProfileCardSkeleton />;
  }

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workspace Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.teamName && (
          <div className="flex items-center gap-2 text-sm text-ink">
            <Hash className="h-4 w-4 text-brand" />
            <span>{profile.teamName}</span>
          </div>
        )}
        {profile.displayName && (
          <div className="flex items-center gap-2 text-sm text-ink">
            <User className="h-4 w-4 text-brand" />
            <span>{profile.displayName}</span>
          </div>
        )}
        {profile.email && (
          <div className="flex items-center gap-2 text-sm text-ink">
            <Mail className="h-4 w-4 text-brand" />
            <span>{profile.email}</span>
          </div>
        )}
        {profile.teamId && (
          <p className="text-xs text-muted">Team ID: {profile.teamId}</p>
        )}
      </CardContent>
    </Card>
  );
}
