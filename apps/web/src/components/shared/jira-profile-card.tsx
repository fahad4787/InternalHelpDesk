'use client';

import { ExternalLink, Globe, Mail, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JiraProfile } from '@/services/jira.service';

interface JiraProfileCardProps {
  profile: JiraProfile;
}

export function JiraProfileCard({ profile }: JiraProfileCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
        <div>
          <CardTitle className="text-lg">Jira Profile</CardTitle>
          <CardDescription className="mt-1">
            Account details from your connected Jira site
          </CardDescription>
        </div>
        {profile.siteUrl && (
          <a href={profile.siteUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Jira
            </Button>
          </a>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="font-semibold text-slate-900">
              {profile.displayName ?? 'Jira user'}
            </p>
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

        {profile.siteName && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Jira Site</p>
              <p className="font-semibold text-slate-900">{profile.siteName}</p>
              {profile.siteUrl && (
                <Badge variant="secondary" className="mt-2 font-mono text-xs">
                  {profile.siteUrl}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
