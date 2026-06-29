'use client';

import { ExternalLink, Globe, Hash, Mail, User, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ZoomProfile } from '@/services/zoom.service';

interface ZoomProfileCardProps {
  profile: ZoomProfile;
}

function formatPmi(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return value;
}

export function ZoomProfileCard({ profile }: ZoomProfileCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
        <div>
          <CardTitle className="text-lg">Zoom Profile</CardTitle>
          <CardDescription className="mt-1">
            Account details from your connected Zoom account
          </CardDescription>
        </div>
        <a href="https://zoom.us/meeting" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Zoom
          </Button>
        </a>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="font-semibold text-slate-900">
              {profile.displayName ?? 'Zoom user'}
            </p>
            {profile.accountType && (
              <Badge variant="secondary" className="mt-2">
                {profile.accountType}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="break-all font-semibold text-slate-900">
              {profile.email ?? '—'}
            </p>
          </div>
        </div>

        {profile.pmi && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Personal Meeting ID</p>
              <p className="font-mono font-semibold text-slate-900">
                {formatPmi(profile.pmi)}
              </p>
            </div>
          </div>
        )}

        {profile.timezone && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Timezone</p>
              <p className="font-semibold text-slate-900">{profile.timezone}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <a href="https://zoom.us/meeting" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Video className="mr-2 h-4 w-4" />
              Zoom Meetings
            </Button>
          </a>
          <a href="https://zoom.us/meeting/schedule" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              Schedule on Zoom
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
