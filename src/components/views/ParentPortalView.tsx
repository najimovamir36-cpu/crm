import React, { useState, useEffect } from 'react';
import {
  Home,
  Trophy,
  Award,
  CalendarCheck,
  Calendar,
  Bell,
  User,
  LogOut,
  Clock,
  MapPin,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Info,
  TrendingUp,
  Star,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  ParentChildProfile,
  ParentAttendanceStat,
  ParentAttendanceItem,
  ParentGroupRanking,
  ParentScheduleItem,
  AnnouncementItem,
} from '../../types';

type ParentTab = 'home' | 'ranking' | 'attendance' | 'schedule' | 'announcements' | 'profile';

export const ParentPortalView: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ParentTab>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Portal Data States
  const [profile, setProfile] = useState<ParentChildProfile | null>(null);
  const [ranking, setRanking] = useState<ParentGroupRanking | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<ParentAttendanceStat | null>(null);
  const [monthSummary, setMonthSummary] = useState<string>('Sentabr davomati: 92%');
  const [attendanceRecords, setAttendanceRecords] = useState<ParentAttendanceItem[]>([]);
  const [schedules, setSchedules] = useState<ParentScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const loadAllData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [profRes, rankRes, attRes, schRes, annRes] = await Promise.all([
        api.getParentProfile().catch(() => null),
        api.getParentRanking().catch(() => null),
        api.getParentAttendance().catch(() => null),
        api.getParentSchedule().catch(() => null),
        api.getParentAnnouncements().catch(() => null),
      ]);

      if (profRes?.success) setProfile(profRes.data);
      if (rankRes?.success) setRanking(rankRes.data);
      if (attRes?.success) {
        setAttendanceStats(attRes.stats);
        setAttendanceRecords(attRes.records || []);
        if (attRes.monthSummary) setMonthSummary(attRes.monthSummary);
      }
      if (schRes?.success) {
        setSchedules(schRes.schedule || []);
      }
      if (annRes?.success) {
        setAnnouncements(annRes.announcements || []);
        setUnreadCount(annRes.unreadCount || 0);
      }
    } catch (err: any) {
      console.error('Error loading parent portal data:', err);
      setError(err.message || 'Ma’lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="w-12 h-12 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Ota-ona kabineti yuklanmoqda...</p>
      </div>
    );
  }

  const childName = profile ? `${profile.firstName} ${profile.lastName}` : 'O‘quvchi';
  const myRank = ranking?.myRank || profile?.groupRank?.rank || 1;
  const totalStudents = ranking?.totalStudents || profile?.groupRank?.totalStudents || 12;
  const overallScore = ranking?.overallScore || profile?.groupRank?.overallScore || 95;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans pb-20 md:pb-6">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
              EC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                  EduCenter
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200">
                  Ota-ona
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                Farzand: <strong className="text-slate-700 font-semibold">{childName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAllData(false)}
              disabled={isRefreshing}
              title="Yangilash"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="E’lonlar va bildirishnomalar"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors cursor-pointer ml-1"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Top Sub-navigation (Visible on md and up) */}
      <nav className="hidden md:block bg-white border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'home'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            Bosh sahifa
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ranking'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            Guruhdagi o‘rni
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Davomat
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schedule'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Dars jadvali
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'announcements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            E’lonlar
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Profil
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => loadAllData()}
              className="text-xs font-bold underline hover:no-underline cursor-pointer"
            >
              Qaytadan urinish
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. BOSH SAHIFA (HOME)                                        */}
        {/* ============================================================ */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Welcome Greeting Banner (CSS Selector 1 Target) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-sky-400 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/20 flex-shrink-0">
                    {profile ? profile.firstName[0] : 'O'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
                      Xush kelibsiz!
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {childName}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      O‘quvchi ID: <strong className="text-slate-800 font-mono">{profile?.studentId || '583217'}</strong> • Ota-onasi:{' '}
                      <strong className="text-slate-800 font-medium">{profile?.parentName || 'Dilshod Najimov'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200/90 rounded-xl text-xs font-bold shadow-xs">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
                    Guruhdagi o‘rni:{' '}
                    <strong className="text-amber-700 font-black text-sm">
                      {myRank}-o‘rin
                    </strong>{' '}
                    <span className="text-slate-500 font-medium text-[11px]">
                      ({totalStudents} ta o‘quvchi ichida)
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    O‘quvchi holati: Faol
                  </div>
                </div>
              </div>

              {/* Course & Group Overview Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kurs</span>
                    <span className="font-bold text-slate-800">{profile?.courseName || 'IELTS & Intensive English'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <Users className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Guruh</span>
                    <span className="font-bold text-slate-800">{profile?.groupName || 'IELTS-MASTER'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <User className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">O‘qituvchi</span>
                    <span className="font-bold text-slate-800">{profile?.teacherName || 'Sardor Raximov'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Lesson Widget */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Bugungi dars jadvali
                </h2>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {profile?.todayLesson?.currentDay || 'Bugun'}
                </span>
              </div>

              {profile?.todayLesson?.hasClassToday ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-950">
                          {profile.todayLesson.courseName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">
                          Bugun dars bor
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        O‘qituvchi: <strong className="text-slate-800">{profile.todayLesson.teacherName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 bg-white/90 px-3.5 py-2 rounded-xl border border-blue-100">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <Clock className="w-3.5 h-3.5" />
                      {profile.todayLesson.time}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {profile.todayLesson.room || '204-xona'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Bugun rejalashtirilgan dars yo‘q</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Keyingi dars kunlari: {profile?.lessonTime || 'Dushanba, Chorshanba, Juma (18:00 – 19:30)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    To‘liq jadvalni ko‘rish →
                  </button>
                </div>
              )}
            </div>

            {/* Quick 3 Key Performance Indicator Cards (CSS Selectors 2 & 3 Targets) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Guruhdagi o‘rni (Group Rank) */}
              <div
                onClick={() => setActiveTab('ranking')}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Guruhdagi o‘rni
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 group-hover:text-amber-700 transition-colors">
                    {myRank}-o‘rin
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    / {totalStudents} o‘quvchi
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Guruh yetakchisi (TOP-1)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600 group-hover:underline">
                    Reyting →
                  </span>
                </div>
              </div>

              {/* Card 2: O‘zlashtirish va Reyting bali (Replacing monthly fee card - CSS Selector 2 Target) */}
              <div
                onClick={() => setActiveTab('ranking')}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    O‘zlashtirish bali
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Award className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {overallScore} ball
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {ranking?.grade || 'A+'} (A’lo)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2.5 font-medium">
                  Uyga vazifalar: <strong className="text-slate-700">98%</strong> • Sinov: <strong className="text-slate-700">95 ball</strong>
                </p>
              </div>

              {/* Card 3: Davomat ko‘rsatkichi (Replacing debt card - CSS Selector 3 Target) */}
              <div
                onClick={() => setActiveTab('attendance')}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Davomat ko‘rsatkichi
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {attendanceStats?.attendanceRate ?? 92}%
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Yuqori qatnashuv
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2.5 font-medium">
                  {monthSummary || 'Sentabr davomati: 92% (12 keldi, 1 kelmadi)'}
                </p>
              </div>
            </div>

            {/* Group Leaderboard & Ranking Preview (CSS Selector 4 Target) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Trophy className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Guruh o‘quvchilari reytingi
                    </h2>
                    <p className="text-xs text-slate-500">
                      Farzandingiz <strong className="text-amber-700">{totalStudents} nafar o‘quvchi</strong> orasida{' '}
                      <strong className="text-amber-700">{myRank}-o‘rinda</strong> bormoqda
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('ranking')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  To‘liq reytingni ko‘rish →
                </button>
              </div>

              {/* Top 3 Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {(ranking?.leaderboard || []).slice(0, 3).map((item) => (
                  <div
                    key={item.rank}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.isCurrentStudent
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                        : 'bg-slate-50/80 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <span>{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}</span>
                        <span className={item.isCurrentStudent ? 'text-amber-900 font-extrabold' : 'text-slate-800'}>
                          {item.name}
                        </span>
                      </span>
                      <span className="text-xs font-black text-slate-900">{item.score} ball</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Davomat: {item.attendanceRate}%</span>
                      {item.isCurrentStudent && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[10px] font-bold">
                          Farzandingiz
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Announcements Alert */}
            {announcements.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    Muhim e’lonlar va xabarnomalar
                  </h2>
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Barchasini ko‘rish ({announcements.length}) →
                  </button>
                </div>

                <div className="space-y-3">
                  {announcements.slice(0, 2).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-slate-900 text-sm">{ann.title}</span>
                        {ann.priority === 'URGENT' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold">
                            Shoshilinch
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 leading-relaxed">{ann.content}</p>
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-3">
                        <span>Chop etildi: {new Date(ann.createdAt).toLocaleDateString('uz-UZ')}</span>
                        {ann.authorName && <span>• {ann.authorName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. GURUHDAGI O‘RNI VA REYTING (RANKING & LEADERBOARD)        */}
        {/* ============================================================ */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
                    Guruhdagi o‘rni va reyting
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Kurs: <strong className="text-slate-700">{profile?.courseName || 'IELTS'}</strong> • Guruh:{' '}
                    <strong className="text-slate-700">{profile?.groupName || 'IELTS-MASTER'}</strong> (Faqat ko‘rish huquqi)
                  </p>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-sm">
                    {myRank}
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 block text-sm">
                      {myRank}-o‘rin (Guruh yetakchisi)
                    </span>
                    <span className="text-[11px] text-amber-700 font-semibold">
                      {totalStudents} nafar o‘quvchi ichida
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Hero Ranking Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-blue-500/10 border border-amber-200/80 my-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-amber-500/20 flex-shrink-0">
                      🥇
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-black text-slate-900">
                          {childName}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wide">
                          TOP 1
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-xl">
                        {ranking?.teacherComment ||
                          `${childName} guruhda darslarga faol qatnashib, barcha uyga vazifalarni va sinov testlarini a’lo darajada topshirmoqda. Guruhda 1-o‘rinni mustahkam egallab turibdi.`}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-amber-100 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Umumiy reyting bali
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-600">
                      {overallScore} / 100
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">
                      {ranking?.grade || 'A+'} (A’lo daraja)
                    </span>
                  </div>
                </div>

                {/* Score Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-amber-200/60">
                  <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Davomat ko‘rsatkichi
                    </span>
                    <span className="text-lg font-black text-slate-800">
                      {ranking?.breakdown?.attendanceRate || attendanceStats?.attendanceRate || 92}%
                    </span>
                  </div>

                  <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Uyga vazifalar
                    </span>
                    <span className="text-lg font-black text-emerald-600">
                      {ranking?.breakdown?.homeworkRate || 98}%
                    </span>
                  </div>

                  <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Sinov testlari
                    </span>
                    <span className="text-lg font-black text-indigo-600">
                      {ranking?.breakdown?.examScore || 95} ball
                    </span>
                  </div>

                  <div className="bg-white/90 p-3 rounded-2xl border border-amber-100 text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Darsdagi faollik
                    </span>
                    <span className="text-lg font-black text-amber-600">
                      {ranking?.breakdown?.activityScore || 96}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Group Leaderboard Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Guruh o‘quvchilari o‘rtasidagi to‘liq reyting jadvali:
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    Jami {ranking?.leaderboard?.length || totalStudents} nafar o‘quvchi
                  </span>
                </div>

                <div className="space-y-2">
                  {(ranking?.leaderboard || []).map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <div
                        key={entry.rank}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                          entry.isCurrentStudent
                            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                              isTop1
                                ? 'bg-amber-400 text-amber-950 shadow-sm'
                                : isTop2
                                ? 'bg-slate-200 text-slate-700'
                                : isTop3
                                ? 'bg-amber-700/20 text-amber-900'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `${entry.rank}`}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-bold ${
                                  entry.isCurrentStudent ? 'text-blue-950 font-black' : 'text-slate-800'
                                }`}
                              >
                                {entry.name}
                              </span>
                              {entry.isCurrentStudent && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                                  Farzandingiz
                                </span>
                              )}
                              {entry.badge && !entry.isCurrentStudent && (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {entry.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              <span>Davomat: <strong>{entry.attendanceRate}%</strong></span>
                              <span>•</span>
                              <span>
                                Holat: {entry.trend === 'up' ? '↗ O‘smoqda' : entry.trend === 'down' ? '↘ Pasaymoqda' : '→ Barqaror'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-sm sm:text-base font-black text-slate-900">
                            {entry.score} <span className="text-[10px] text-slate-400 font-normal">ball</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              entry.rank === 1
                                ? 'bg-amber-100 text-amber-800'
                                : entry.rank <= 3
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {entry.rank}-o‘rin
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400">
                  🔒 Reyting ko‘rsatkichlari har darsdagi davomat, uyga vazifalar va test natijalari asosida o‘qituvchi tomonidan yuritiladi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. DAVOMAT (ATTENDANCE)                                      */}
        {/* ============================================================ */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6 text-emerald-600" />
                    Farzand davomati
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Barcha darslarga qatnashish ko‘rsatkichi va kunlik qaydlar (Faqat ko‘rish huquqi)
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-950 flex items-center gap-3">
                  <div className="text-2xl font-black text-emerald-600">
                    {attendanceStats?.attendanceRate ?? 92}%
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block">{monthSummary || 'Sentabr davomat'}</span>
                    <span className="text-[11px] text-emerald-700">Yuqori daraja</span>
                  </div>
                </div>
              </div>

              {/* Attendance Quick Metrics */}
              <div className="grid grid-cols-3 gap-3 my-5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase block">Jami darslar</span>
                  <span className="text-lg font-black text-slate-800">{attendanceStats?.totalLessons ?? attendanceRecords.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <span className="text-[11px] text-emerald-600 font-semibold uppercase block">Kelgan</span>
                  <span className="text-lg font-black text-emerald-700">{attendanceStats?.presentCount ?? 12}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
                  <span className="text-[11px] text-rose-600 font-semibold uppercase block">Kelmagan</span>
                  <span className="text-lg font-black text-rose-700">{attendanceStats?.absentCount ?? 1}</span>
                </div>
              </div>

              {/* Attendance Records List */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Darslar bo‘yicha batafsil ro‘yxat:
                </h3>

                {attendanceRecords.length === 0 ? (
                  <p className="text-xs text-slate-500 p-6 text-center">Hozircha davomat yozuvlari mavjud emas.</p>
                ) : (
                  attendanceRecords.map((item) => {
                    const isPresent = item.status === 'PRESENT';
                    const isAbsent = item.status === 'ABSENT';

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                          isPresent
                            ? 'bg-white border-slate-200/80 hover:border-emerald-300'
                            : isAbsent
                            ? 'bg-rose-50/40 border-rose-200/80'
                            : 'bg-amber-50/40 border-amber-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-700'
                                : isAbsent
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isPresent ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isAbsent ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              <Info className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {item.formattedFullDate || item.lessonDate}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {item.notes || (isPresent ? 'Darsda to‘liq qatnashdi' : 'Sababsiz qatnashmadi')}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                              isPresent
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isAbsent
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.statusLabel || (isPresent ? 'Keldi' : 'Kelmadi')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400">
                  🔒 Davomat ma’lumotlari o‘qituvchi tomonidan kiritiladi va ota-onalar tomonidan o‘zgartirilishi mumkin emas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. DARS JADVALI (SCHEDULE)                                   */}
        {/* ============================================================ */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="pb-5 border-b border-slate-100">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  Haftalik dars jadvali
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Kurs: <strong className="text-slate-700">{profile?.courseName || 'IELTS'}</strong> • Guruh:{' '}
                  <strong className="text-slate-700">{profile?.groupName || 'IELTS-MASTER'}</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {schedules.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-5 rounded-2xl bg-gradient-to-b from-white to-slate-50/70 border border-slate-200/90 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                          {item.dayOfWeek}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {item.room || '204-xona'}
                        </span>
                      </div>

                      <div className="text-lg font-black text-slate-900 tracking-tight mb-1">
                        {item.startTime} – {item.endTime}
                      </div>

                      <div className="text-xs font-medium text-slate-600">
                        {item.courseName || profile?.courseName || 'IELTS'}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                      <span>O‘qituvchi:</span>
                      <strong className="text-slate-800 font-semibold">{item.teacherName || 'Sardor Raximov'}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  Dars jadvalida o‘zgarish bo‘lsa, ushbu sahifada va E’lonlar bo‘limida avtomatik aks ettiriladi.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 5. E’LONLAR (ANNOUNCEMENTS)                                  */}
        {/* ============================================================ */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="pb-5 border-b border-slate-100">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Bell className="w-6 h-6 text-amber-500" />
                  E’lonlar va markaz xabarlari
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  O‘quv markazi ma’muriyati tomonidan berilgan barcha rasmiy e’lonlar
                </p>
              </div>

              <div className="space-y-4 mt-6">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-500 p-8 text-center">Hozircha yangi e’lonlar yo‘q.</p>
                ) : (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">{ann.title}</h3>
                        {ann.priority === 'URGENT' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex-shrink-0">
                            Muhim
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{ann.content}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span>Chop etildi: {new Date(ann.createdAt).toLocaleDateString('uz-UZ')}</span>
                        <span className="font-medium text-slate-600">Muallif: {ann.authorName || 'Ma’muriyat'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. PROFIL (PROFILE)                                          */}
        {/* ============================================================ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="pb-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Farzand va ota-ona profili
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Tizimda ro‘yxatga olingan shaxsiy ma’lumotlar va o‘quvchi holati
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Child Information */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 text-xs">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    O‘quvchi ma’lumotlari
                  </h3>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">F.I.SH</span>
                    <span className="font-bold text-slate-800 text-sm">{childName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">O‘quvchi ID</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {profile?.studentId || '583217'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Guruhdagi o‘rni</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      {myRank}-o‘rin ({totalStudents} ta o‘quvchi ichida) • TOP 1
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reyting bali</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-400" />
                      {overallScore} ball ({ranking?.grade || 'A+'} daraja)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Telefon raqami</span>
                    <span className="font-semibold text-slate-800">{profile?.phone || '+998 90 583 21 70'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Biriktirilgan kurs</span>
                    <span className="font-semibold text-slate-800">{profile?.courseName || 'IELTS'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Guruh va Xona</span>
                    <span className="font-semibold text-slate-800">
                      {profile?.groupName || 'IELTS-MASTER'} ({profile?.room || '204-xona'})
                    </span>
                  </div>
                </div>

                {/* Parent Information */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 text-xs">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Ota-ona ma’lumotlari
                  </h3>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Ota-ona ismi</span>
                    <span className="font-bold text-slate-800 text-sm">{profile?.parentName || 'Dilshod Najimov'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Bog‘lanish telefoni</span>
                    <span className="font-semibold text-slate-800">{profile?.parentPhone || '+998 90 987 65 43'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">O‘qituvchi</span>
                    <span className="font-semibold text-slate-800">{profile?.teacherName || 'Sardor Raximov'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Xavfsizlik & Kirish</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Avtorizatsiyadan o‘tgan xavfsiz sessiya
                    </span>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={logout}
                      className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Tizimdan chiqish (Logout)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          Bosh sahifa
        </button>

        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'ranking' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          O‘rni
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'attendance' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          Davomat
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'schedule' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          Jadval
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`relative flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'announcements' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Bell className="w-5 h-5 mb-0.5" />
          E’lonlar
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          Profil
        </button>
      </div>
    </div>
  );
};
