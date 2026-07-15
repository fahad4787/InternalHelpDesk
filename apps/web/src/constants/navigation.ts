import {
  Award,
  BookOpen,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Settings,
  Upload,
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
  { href: '/integrations', label: 'Integrations', icon: Plug, badge: MARKETPLACE_APP_COUNT },
  { href: null, label: 'My tasks', icon: CheckSquare, disabled: true },
  { href: null, label: 'Time off', icon: CalendarDays, disabled: true },
  { href: null, label: 'Recognition', icon: Award, disabled: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const workspaceNavItems: NavItem[] = [
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/knowledge-base', label: 'Documents', icon: BookOpen },
  { href: '/knowledge-base/upload', label: 'Upload', icon: Upload },
  { href: '/users', label: 'Users', icon: Users },
];
