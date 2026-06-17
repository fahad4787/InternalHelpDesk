'use client';

import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  FolderOpen,
  HelpCircle,
  Mail,
  MessageSquare,
  Users,
} from 'lucide-react';
import { PageContainer } from '@/components/shared/page-container';
import { EmptyState } from '@/components/shared/empty-state';
import { MeetEventList } from '@/components/shared/meet-event-list';
import { GoogleDriveList, GoToDriveButton } from '@/components/shared/google-drive-list';
import { GoogleGmailList, GoToGmailButton } from '@/components/shared/google-gmail-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoogleWidgets } from '@/hooks/use-google-widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateMeetButton } from '@/components/shared/create-meet-button';
import { dashboardService } from '@/services/dashboard.service';

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { key: 'totalDocuments', label: 'Documents', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'totalChats', label: 'Chat Sessions', icon: MessageSquare, color: 'text-brand bg-brand-light border-brand-muted' },
  { key: 'unansweredQuestions', label: 'Unanswered', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
] as const;

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const {
    status: googleStatus,
    showMeet,
    showDrive,
    showGmail,
    events,
    eventsLoading,
    files,
    driveLoading,
    messages,
    gmailLoading,
  } = useGoogleWidgets();

  const stats = data?.data;

  return (
    <PageContainer
      title="Dashboard"
      description="Overview of your internal helpdesk activity"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg border p-3 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">{card.label}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {isLoading ? '—' : value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showMeet && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-muted bg-brand-light">
                    <Calendar className="h-5 w-5 text-brand" />
                  </div>
                  Upcoming Google Meet
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Video meetings from your connected Google account
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <CreateMeetButton
                  onCreated={() =>
                    queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] })
                  }
                />
                {events.length > 0 && (
                  <Badge variant="success">
                    {events.length} meeting{events.length === 1 ? '' : 's'}
                  </Badge>
                )}
                {googleStatus?.googleEmail && (
                  <span className="text-xs text-slate-500">{googleStatus.googleEmail}</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {eventsLoading ? (
              <p className="text-sm text-slate-500">Loading meetings...</p>
            ) : events.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming Google Meet meetings"
                description="Only calendar events with a Google Meet link are shown"
              />
            ) : (
              <>
                <MeetEventList events={events} />
                <div className="pt-2">
                  <Link href="/integrations/google">
                    <Button variant="outline" size="sm">
                      Manage Google
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {showDrive && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-muted bg-brand-light">
                    <FolderOpen className="h-5 w-5 text-brand" />
                  </div>
                  Google Drive
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Last 10 files from your My Drive
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {files.length > 0 && (
                  <Badge variant="success">
                    {files.length} file{files.length === 1 ? '' : 's'}
                  </Badge>
                )}
                <GoToDriveButton />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {driveLoading ? (
              <p className="text-sm text-slate-500">Loading files...</p>
            ) : files.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No files found"
                description="Your My Drive folder has no files to show"
              />
            ) : (
              <>
                <GoogleDriveList files={files} />
                <div className="pt-2">
                  <Link href="/integrations/google">
                    <Button variant="outline" size="sm">
                      Manage Google
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {showGmail && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-brand-light/40 to-white pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-muted bg-brand-light">
                    <Mail className="h-5 w-5 text-brand" />
                  </div>
                  Gmail
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Last 10 emails from your inbox
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Badge variant="success">
                    {messages.length} email{messages.length === 1 ? '' : 's'}
                  </Badge>
                )}
                <GoToGmailButton />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {gmailLoading ? (
              <p className="text-sm text-slate-500">Loading emails...</p>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No emails found"
                description="Your inbox has no emails to show"
              />
            ) : (
              <>
                <GoogleGmailList messages={messages} />
                <div className="pt-2">
                  <Link href="/integrations/google">
                    <Button variant="outline" size="sm">
                      Manage Google
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
