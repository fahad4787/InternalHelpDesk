'use client';

import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SHAREPOINT_WORK_ACCOUNT_MESSAGE } from '@/lib/teams-account';

interface SharePointUnsupportedAccountCardProps {
  email?: string | null;
}

export function SharePointUnsupportedAccountCard({
  email,
}: SharePointUnsupportedAccountCardProps) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700">
          <Info className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-amber-950">
            Work or school Microsoft 365 account required
          </p>
          <p className="text-sm leading-relaxed text-amber-900/90">
            {SHAREPOINT_WORK_ACCOUNT_MESSAGE}
          </p>
          {email ? (
            <p className="pt-1 text-sm text-amber-800">
              Connected account: <span className="font-medium">{email}</span>
            </p>
          ) : null}
          <p className="pt-1 text-sm text-amber-800">
            Disconnect, then reconnect with an organizational Microsoft 365
            account that has SharePoint.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
