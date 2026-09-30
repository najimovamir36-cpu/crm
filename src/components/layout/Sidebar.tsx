import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  CreditCard,
  Settings,
  LogOut,
  Flame,
  School,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'courses'
  | 'groups'
  | 'attendance'
  | 'payments'
  | 'schedule'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isMobileOpen,
  onMobileClose,
}) => {
  const { user, logout, hasRole } = useAuth();

  const isTeacher = user?.role === 'TEACHER';

  // Primary minimal navigation
  const primaryNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'TEACHER')[];
  }[] = isTeacher
    ? [
        { id: 'attendance', label: 'Davomat olish', icon: UserCheck, requiredRoles: ['TEACHER'] },
      ]
    : [
        { id: 'dashboard', label: 'Boshqaruv', icon: LayoutDashboard, requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
        { id: 'students', label: 'O‘quvchilar', icon: Users, requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
        { id: 'groups', label: 'Guruhlar', icon: School, requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
        { id: 'attendance', label: 'Davomat', icon: UserCheck, requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
        { id: 'payments', label: 'To‘lovlar', icon: CreditCard, requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
      ];

  const secondaryNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'OPERATOR')[];
  }[] = isTeacher
    ? []
    : [
        { id: 'courses', label: 'Kurslar', icon: BookOpen, requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
        { id: 'teachers', label: 'O‘qituvchilar', icon: GraduationCap, requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'OPERATOR'] },
        { id: 'settings', label: 'Sozlamalar', icon: Settings, requiredRoles: ['SUPER_ADMIN', 'ADMIN'] },
      ];

  const filterItems = (items: typeof primaryNavItems) =>
    items.filter((item) => {
      if (!item.requiredRoles) return true;
      return hasRole(item.requiredRoles as any);
    });

  const visiblePrimary = filterItems(primaryNavItems);
  const visibleSecondary = filterItems(secondaryNavItems as any);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0B1528] text-white flex flex-col border-r border-blue-950/60 shadow-xl transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-blue-950/80 bg-[#070F1E]/80">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/30">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
              EduCenter <span className="text-[10px] px-1 py-0.2 rounded bg-orange-500/20 text-orange-400 font-mono font-bold">CRM</span>
            </h1>
            <p className="text-[10px] text-blue-200/50 leading-none">
              {isTeacher ? 'O‘qituvchi Paneli' : 'O‘quv Markazi'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {/* Primary Section */}
          <div className="space-y-1">
            {!isTeacher && (
              <p className="px-3 text-[10px] font-semibold text-blue-300/40 uppercase tracking-wider mb-2">
                Asosiy
              </p>
            )}
            {visiblePrimary.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onMobileClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Section (if any) */}
          {visibleSecondary.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-1">
              <p className="px-3 text-[10px] font-semibold text-blue-300/40 uppercase tracking-wider mb-2">
                Tizim
              </p>
              {visibleSecondary.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onMobileClose();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Footer / Logout */}
        <div className="p-3 border-t border-blue-950/80 bg-[#070F1E]/60">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/5">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-orange-400/80 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={logout}
              title="Chiqish"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
