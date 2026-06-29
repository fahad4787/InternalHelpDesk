import { Building2, Mail, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamsProfile } from '@/services/teams.service';

interface TeamsProfileCardProps {
  profile: TeamsProfile | null;
  isLoading: boolean;
}

export function TeamsProfileCard({ profile, isLoading }: TeamsProfileCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-slate-500">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Microsoft Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile.tenantName && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Building2 className="h-4 w-4 text-brand" />
            <span>{profile.tenantName}</span>
          </div>
        )}
        {profile.displayName && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <User className="h-4 w-4 text-brand" />
            <span>{profile.displayName}</span>
          </div>
        )}
        {profile.email && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Mail className="h-4 w-4 text-brand" />
            <span>{profile.email}</span>
          </div>
        )}
        {profile.tenantId && (
          <p className="text-xs text-slate-400">Tenant ID: {profile.tenantId}</p>
        )}
      </CardContent>
    </Card>
  );
}
