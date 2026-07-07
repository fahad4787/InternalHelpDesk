'use client';

import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SidebarMobileToggle } from '@/components/layout/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { USER_ROLES } from '@/constants/roles';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-warm bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && <SidebarMobileToggle onClick={onMenuClick} />}
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border-warm bg-canvas">
              <User className="h-4 w-4 text-muted" />
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted">{USER_ROLES[user.role]}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted hover:bg-canvas hover:text-ink"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
