import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Settings,
  Upload,
  Users,
} from 'lucide-react';

export const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/knowledge-base', label: 'Documents', icon: BookOpen },
  { href: '/knowledge-base/upload', label: 'Upload', icon: Upload },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;
