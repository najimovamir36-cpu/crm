import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Printer,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

export const ReportsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getReports()
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  const students = data?.studentsOverview || {};
  const financial = data?.financialOverview || {};
  const teachers = data?.teacherReport || [];
  const courses = data?.courseReport || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tahliliy Hisobotlar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            O‘quv markazining to‘liq faoliyat, pedagogik yuklama va moliyaviy balansi
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Hisobotni chop etish</span>
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Faol Talabalar
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {students.activeStudents || 0} nafar
          </p>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Jami: {students.totalStudents || 0}</span>
            <span className="text-rose-600">Ketgan: {students.leftStudents || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Shu Oygi Tushum
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(financial.totalRevenueThisMonth || 0)}
          </p>
          <span className="text-xs text-slate-500 mt-2 block font-medium">
            Oy: {financial.currentMonth}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Qarzdorlik Balansi
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(financial.totalDebt || 0)}
          </p>
          <span className="text-xs text-rose-600 mt-2 block font-semibold">
            {financial.debtorsCount || 0} ta qarzdor talaba
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Mavjud Kurslar & Guruhlar
          </span>
          <p className="text-2xl font-black text-orange-700 mt-1">
            {courses.length} kurs / {data?.groupsOverview?.activeGroups || 0} guruh
          </p>
          <span className="text-xs text-slate-500 mt-2 block font-medium">
            O‘qituvchilar: {data?.groupsOverview?.totalTeachers || 0} nafar
          </span>
        </div>
      </div>

      {/* Payment methods breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          To‘lov Turlari Bo‘yicha Taqsimot (Shu Oy)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">Naqd Pul (Cash)</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(financial.revenueByType?.CASH || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">Plastik Karta (Card)</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(financial.revenueByType?.CARD || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">Bank O‘tkazmasi</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(financial.revenueByType?.BANK || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">Boshqa Turlar</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(financial.revenueByType?.OTHER || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Teachers Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">O‘qituvchilar Faoliyati va Yuklamasi</h3>
          <p className="text-xs text-slate-500 mt-0.5">O‘qituvchilar bo‘yicha guruhlar, talabalar va davomat foizi</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">O‘qituvchi</th>
                <th className="px-6 py-3">Mutaxassislik</th>
                <th className="px-6 py-3">Guruhlar soni</th>
                <th className="px-6 py-3">Faol o‘quvchilar</th>
                <th className="px-6 py-3">Davomat darajasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-semibold text-slate-900">{t.fullName}</td>
                  <td className="px-6 py-3 text-slate-600">{t.specialty}</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{t.groupsCount} ta guruh</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{t.studentsCount} nafar</td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {t.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courses Potential Revenue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Kurslar Bo‘yicha Potensial Tushum</h3>
          <p className="text-xs text-slate-500 mt-0.5">Har bir kurs bo‘yicha kutilayotgan oylik abonent to‘lovi</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Kurs Nomi</th>
                <th className="px-6 py-3">Oylik Narx</th>
                <th className="px-6 py-3">Guruhlar</th>
                <th className="px-6 py-3">Faol Talabalar</th>
                <th className="px-6 py-3 text-right">Potensial Oylik Tushum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="px-6 py-3 font-mono text-slate-700">{formatCurrency(c.monthlyFee)}</td>
                  <td className="px-6 py-3 text-slate-700">{c.groupsCount} ta</td>
                  <td className="px-6 py-3 font-medium text-slate-800">{c.studentsCount} nafar</td>
                  <td className="px-6 py-3 font-bold text-emerald-700 text-right font-mono">
                    {formatCurrency(c.potentialMonthlyRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
