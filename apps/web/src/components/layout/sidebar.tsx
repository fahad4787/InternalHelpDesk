'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';
import { mainNavItems } from '@/constants/navigation';
import { appConfig } from '@/config/app.config';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-accent shadow-md shadow-brand/20">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-900">{appConfig.name}</span>
          <p className="flex items-center gap-1 text-[10px] text-brand-accent">
            <Sparkles className="h-2.5 w-2.5" />
            AI Powered
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-xl border border-brand-muted bg-brand-light p-3">
          <p className="text-xs font-semibold text-brand">AI Assistant</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Answers from your docs</p>
        </div>
      </div>
    </aside>
  );
}
