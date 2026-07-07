'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeft, X, type LucideIcon } from 'lucide-react';
import { workhubNavItems, workspaceNavItems } from '@/constants/navigation';
import { WorkhubLogo } from '@/components/shared/workhub-logo';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  disabled,
  badge,
  onNavigate,
}: {
  href: string | null;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  disabled?: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  const className = cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
    disabled
      ? 'cursor-not-allowed text-sidebar-muted/50'
      : isActive
        ? 'bg-sidebar-hover text-white shadow-sm ring-1 ring-brand/40'
        : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white',
  );

  const content = (
    <>
      <Icon className={cn('h-4 w-4 shrink-0', isActive && !disabled && 'text-brand')} />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {disabled && (
        <span className="rounded-full bg-sidebar-hover px-2 py-0.5 text-[10px] text-sidebar-muted">
          Soon
        </span>
      )}
    </>
  );

  if (disabled || !href) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isItemActive = (href: string | null) => {
    if (!href) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          onClick={onMobileClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={cn(
          'flex h-full w-64 shrink-0 flex-col border-r border-sidebar-hover bg-sidebar',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-hover px-5">
          <WorkhubLogo variant="sidebar" size="md" />
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-white lg:hidden"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          <div className="space-y-0.5">
            {workhubNavItems.map((item) => (
              <NavLink
                key={item.label}
                href={item.href}
                label={item.label}
                icon={item.icon}
                disabled={item.disabled}
                badge={item.badge}
                isActive={isItemActive(item.href)}
                onNavigate={onMobileClose}
              />
            ))}
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
              Workspace
            </p>
            <div className="space-y-0.5">
              {workspaceNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isItemActive(item.href)}
                  onNavigate={onMobileClose}
                />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-sidebar-hover p-4">
          {user && (
            <div className="flex items-center gap-3 rounded-xl border border-sidebar-hover bg-sidebar-hover/60 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[11px] text-sidebar-muted">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function SidebarMobileToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-warm bg-white text-muted hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
      onClick={onClick}
      aria-label="Open navigation"
    >
      <PanelLeft className="h-5 w-5" />
    </button>
  );
}
