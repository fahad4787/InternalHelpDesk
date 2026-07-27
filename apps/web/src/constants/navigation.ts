import {
  BookOpen,
  CheckSquare,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Settings,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getMarketplaceAppCount } from './dashboard-integrations';

export const MARKETPLACE_APP_COUNT = getMarketplaceAppCount();

export interface NavItem {
  href: string | null;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: number;
}

export const workhubNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/my-tasks', label: 'My tasks', icon: CheckSquare },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const workspaceNavItems: NavItem[] = [
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/knowledge-base', label: 'Documents', icon: BookOpen },
  { href: '/users', label: 'Users', icon: Users },
];
