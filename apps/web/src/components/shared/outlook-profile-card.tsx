import { Mail, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { OutlookProfile } from '@/services/outlook.service';

interface OutlookProfileCardProps {
  profile: OutlookProfile;
}

export function OutlookProfileCard({ profile }: OutlookProfileCardProps) {
  return (
    <Card className="connected-card overflow-hidden">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-muted bg-white text-brand shadow-sm">
          <User className="h-6 w-6" />
        </div>
        <div className="min-w-0 space-y-1">
          {profile.displayName && (
            <p className="text-base font-semibold text-ink">
              {profile.displayName}
            </p>
          )}
          {profile.email && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />
              {profile.email}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
