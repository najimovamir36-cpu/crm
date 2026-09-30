import React, { useEffect, useState } from 'react';
import {
  Users,
  School,
  CalendarCheck,
  CreditCard,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenAddStudent: () => void;
  onNavigateToAttendanceGroup?: (groupId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddStudent,
  onNavigateToAttendanceGroup,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleFocus = () => fetchStats(true);
    const interval = setInterval(() => fetchStats(true), 8000);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('crm:student-created', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('crm:student-created', handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const todayLessons = data?.todayLessons || [];
  const recentActivities = data?.recentActivities || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Umumiy Ko‘rsatkichlar</h1>
          <p className="text-xs text-slate-500 mt-0.5">O‘quv markazining bugungi holati va asosiy raqamlari</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('payments')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            To‘lovlar
          </button>
          <button
            onClick={onOpenAddStudent}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            O‘quvchi qo‘shish
          </button>
        </div>
      </div>

      {/* 2. Exactly 4 Minimal KPI Cards (Zero-pill, high typographic clarity) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* O'quvchilar */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">O‘quvchilar</span>
            <Users className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalStudents || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.activeStudents || 0} ta faol ta’lim oluvchi
          </p>
        </div>

        {/* Guruhlar */}
        <div
          onClick={() => onNavigate('groups')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Faol Guruhlar</span>
            <School className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalGroups || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Barcha yo‘nalishlar bo‘yicha</p>
        </div>

        {/* Bugungi Davomat */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Bugungi Davomat</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics.todayAttendanceRate !== undefined ? `${metrics.todayAttendanceRate}%` : '—'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todayLessons.length} ta rejalashtirilgan dars
          </p>
        </div>

        {/* Oylik Tushum */}
        <div
          onClick={() => onNavigate('payments')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-orange-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Oylik Tushum</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 truncate">
            {formatCurrency(metrics.monthlyRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Joriy oy davomida</p>
        </div>
      </div>

      {/* 3. Clean Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bugungi darslar va davomat */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bugungi Darslar</h2>
              <p className="text-[11px] text-slate-400">Guruhlar davomatini belgilash</p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Jurnalga o‘tish
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayLessons.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Bugun rejalashtirilgan darslar mavjud emas
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayLessons.slice(0, 6).map((lesson: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{lesson.groupName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{lesson.courseName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {lesson.startTime || '18:00'}
                      </span>
                      {lesson.room && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{lesson.room}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {lesson.attendanceTaken ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Belgilangan
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (onNavigateToAttendanceGroup && lesson.groupId) {
                            onNavigateToAttendanceGroup(lesson.groupId);
                          } else {
                            onNavigate('attendance');
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Davomat
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* So'nggi Harakatlar & To'lovlar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">So‘nggi To‘lovlar & Harakatlar</h2>
              <p className="text-[11px] text-slate-400">Markazdagi so‘nggi amallar</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              Barchasi
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Hozircha harakatlar mavjud emas
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivities.slice(0, 6).map((item: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{item.action || item.text}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.userName || item.studentName || 'Tizim'} · {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  {item.amount && (
                    <span className="font-semibold text-emerald-600 whitespace-nowrap">
                      +{new Intl.NumberFormat('uz-UZ').format(item.amount)} so‘m
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
