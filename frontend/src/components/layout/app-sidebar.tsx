/**
 * @project AncestorTree
 * @file src/components/layout/app-sidebar.tsx
 * @description Main navigation sidebar component
 * @version 2.9.0
 * @updated 2026-03-09
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  GitBranchPlus,
  Users,
  BookUser,
  Calendar,
  FileText,
  Settings,
  UserCog,
  ClipboardList,
  LogOut,
  LogIn,
  UserPlus,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  UserCircle,
  Trophy,
  BookOpen,
  ScrollText,
  RotateCcw,
  DatabaseBackup,
  HelpCircle,
  Download,
  Upload,
  Copy,
  Route,
  BarChart3,
  MessageSquare,
  Bell,
  Landmark,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useElderly } from '@/contexts/elderly-context';
import { CLAN_NAME, CLAN_FULL_NAME } from '@/lib/clan-config';
import { useClanSettings } from '@/hooks/use-clan-settings';

function deriveInitial(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length > 1 ? (parts[parts.length - 1][0] ?? '?') : (parts[0][0] ?? '?');
}

function deriveSubtitle(fullName: string, shortName: string): string {
  return fullName.startsWith(shortName) ? fullName.slice(shortName.length).trim() : '';
}

const mainNavItems = [
  { title: 'Trang chủ', url: '/', icon: Home },
  { title: 'Cây gia phả', url: '/tree', icon: GitBranchPlus },
  { title: 'Thành viên', url: '/people', icon: Users },
  { title: 'Danh bạ', url: '/directory', icon: BookUser, viewerHidden: true },
  { title: 'Lịch cúng lễ', url: '/events', icon: Calendar },
  { title: 'Đề xuất', url: '/contributions', icon: ClipboardList },
  { title: 'Vinh danh', url: '/achievements', icon: Trophy },
  { title: 'Quỹ khuyến học', url: '/fund', icon: BookOpen },
  { title: 'Hương ước', url: '/charter', icon: ScrollText },
  { title: 'Tìm quan hệ', url: '/relationship', icon: Route },
  { title: 'Thống kê', url: '/stats', icon: BarChart3 },
  { title: 'Cầu đương', url: '/cau-duong', icon: RotateCcw },
  { title: 'Góc giao lưu', url: '/feed', icon: MessageSquare },
  { title: 'Thông báo', url: '/notifications', icon: Bell },
  { title: 'Tài liệu', url: '/documents', icon: FileText },
  { title: 'Hướng dẫn', url: '/help', icon: HelpCircle },
];

// Visible to any logged-in user
const accountNavItems = [
  { title: 'Hồ sơ cá nhân', url: '/settings/profile', icon: UserCircle },
  { title: 'Bảo mật (MFA)',  url: '/settings/security', icon: ShieldCheck },
];

const adminNavItems = [
  { title: 'Bảng điều khiển', url: '/admin', icon: Settings },
  { title: 'Người dùng', url: '/admin/users', icon: UserCog },
  { title: 'Đề xuất chỉnh sửa', url: '/admin/contributions', icon: ClipboardList },
  { title: 'QL Lịch sự kiện', url: '/admin/events', icon: Calendar },
  { title: 'QL Vinh danh', url: '/admin/achievements', icon: Trophy },
  { title: 'QL Quỹ & Học bổng', url: '/admin/fund', icon: BookOpen },
  { title: 'QL Hương ước', url: '/admin/charter', icon: ScrollText },
  { title: 'QL Cầu đương', url: '/admin/cau-duong', icon: RotateCcw },
  { title: 'QL Tài liệu', url: '/admin/documents', icon: FileText },
  { title: 'QL Bài viết', url: '/admin/feed', icon: MessageSquare },
  { title: 'Xuất dữ liệu', url: '/admin/export', icon: Download },
  { title: 'Nhập GEDCOM', url: '/admin/import', icon: Upload },
  { title: 'Trùng lặp', url: '/admin/duplicates', icon: Copy },
  { title: 'Đơn ghi danh', url: '/admin/registrations', icon: Landmark },
  { title: 'Cài đặt', url: '/admin/settings', icon: Settings },
  { title: 'Sao lưu dữ liệu', url: '/admin/backup', icon: DatabaseBackup },
];

// Core nav items shown in elderly mode (simplified sidebar)
const ELDERLY_NAV_URLS = new Set(['/', '/tree', '/people', '/events', '/help']);

// Admin items shown in elderly mode (essential only)
const ELDERLY_ADMIN_URLS = new Set(['/admin', '/admin/users', '/admin/contributions']);

function AdminNavGroup({ pathname, elderlyMode }: { pathname: string; elderlyMode: boolean }) {
  const isAdminPath = pathname.startsWith('/admin');
  const [open, setOpen] = useState(isAdminPath);

  const items = adminNavItems.filter((item) => !elderlyMode || ELDERLY_ADMIN_URLS.has(item.url));

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className="cursor-pointer select-none flex items-center justify-between hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>Quản trị</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </SidebarGroupLabel>
      {open && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={item.url === '/admin' ? pathname === '/admin' : pathname.startsWith(item.url)}>
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, profile, isAdmin, isEditor, signOut } = useAuth();
  const { elderlyMode } = useElderly();
  const { data: cs } = useClanSettings();
  const clanName = cs?.clan_name ?? CLAN_NAME;
  const clanFullName = cs?.clan_full_name ?? CLAN_FULL_NAME;
  const clanInitial = deriveInitial(clanName);
  const clanSubtitle = deriveSubtitle(clanFullName, clanName);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            {clanInitial}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{clanName}</span>
            {clanSubtitle && <span className="text-xs text-muted-foreground">{clanSubtitle}</span>}
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems
                .filter((item) => !item.viewerHidden || isEditor)
                .filter((item) => !elderlyMode || ELDERLY_NAV_URLS.has(item.url))
                .map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={item.url === '/' ? pathname === '/' : pathname.startsWith(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Tài khoản</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountNavItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(isAdmin || isEditor) && (
          <AdminNavGroup pathname={pathname} elderlyMode={elderlyMode} />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{profile?.full_name || user?.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">{profile?.role || 'viewer'}</span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Hồ sơ cá nhân
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/security">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Bảo mật (MFA)
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/login'}>
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    <span>Đăng nhập</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/register'}>
                  <Link href="/register">
                    <UserPlus className="h-4 w-4" />
                    <span>Đăng ký</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
