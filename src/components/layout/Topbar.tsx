import React, { useState, useEffect } from 'react';
import { Menu, Cloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from './Sidebar';
import { FirebaseSyncModal } from '../common/FirebaseSyncModal';
import { subscribeFirebaseStatus, FirebaseSyncStatus } from '../../services/firebaseService';

interface TopbarProps {
  onMobileMenuToggle: () => void;
  currentTab: NavigationTab;
  onOpenQuickAddStudent?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMobileMenuToggle,
  currentTab,
}) => {
  const { user } = useAuth();
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [fbStatus, setFbStatus] = useState<FirebaseSyncStatus>({
    isConnected: true,
    isAuthenticated: false,
    currentUserEmail: null,
    currentUserId: null,
    lastSyncTime: null,
    syncedCounts: {
      students: 0,
      teachers: 0,
      courses: 0,
      groups: 0,
      attendance: 0,
      payments: 0,
      users: 0,
    },
    isSyncing: false,
    error: null,
  });

  useEffect(() => {
    const unsub = subscribeFirebaseStatus(setFbStatus);
    return unsub;
  }, []);

  const isTeacher = user?.role === 'TEACHER';

  const tabTitles: Record<NavigationTab, string> = {
    dashboard: 'Boshqaruv Paneli',
    students: 'O‘quvchilar',
    groups: 'Guruhlar',
    teachers: 'O‘qituvchilar',
    courses: 'Kurslar',
    attendance: isTeacher ? 'Davomat Jurnali' : 'Davomat',
    payments: 'To‘lovlar & Moliya',
    schedule: 'Dars Jadvali',
    reports: 'Hisobotlar',
    users: 'Xodimlar',
    audit: 'Audit Loglari',
    settings: 'Sozlamalar',
  };

  const title = isTeacher ? 'Davomat Olish' : (tabTitles[currentTab] || 'Boshqaruv');

  // Today formatted
  const todayFormatted = new Date().toLocaleDateString('uz-UZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
          aria-label="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Firebase Cloud Sync Button */}
        <button
          onClick={() => setIsFirebaseModalOpen(true)}
          title="Google Firebase Firestore holati"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            fbStatus.isAuthenticated
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Cloud className={`w-3.5 h-3.5 ${fbStatus.isAuthenticated ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">
            {fbStatus.isAuthenticated ? 'Firebase Faol' : 'Firebase'}
          </span>
        </button>

        {/* Date display */}
        <span className="hidden md:inline text-xs text-slate-500 font-medium capitalize">
          {todayFormatted}
        </span>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
            {user?.fullName.charAt(0) || 'U'}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
            {user?.fullName}
          </span>
        </div>
      </div>

      {/* Firebase Sync Modal */}
      <FirebaseSyncModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </header>
  );
};
