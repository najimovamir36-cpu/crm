import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  School,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BarChart2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Group, AttendanceRecord } from '../../types';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface AttendanceViewProps {
  initialGroupId?: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialGroupId }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const [studentsAttendance, setStudentsAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Load available groups
  useEffect(() => {
    api.getGroups().then((res) => {
      if (res.success && res.data.length > 0) {
        setGroups(res.data);
        if (!selectedGroupId) {
          setSelectedGroupId(res.data[0].id);
        }
      }
    });

    api.getAttendanceStats().then((res) => {
      if (res.success) setStats(res.stats);
    });
  }, []);

  // Fetch attendance records for selected group and date
  const fetchGroupAttendance = async () => {
    if (!selectedGroupId) return;
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await api.getAttendance(selectedGroupId, selectedDate);
      if (res.success) {
        setStudentsAttendance(res.students);
      }
    } catch (e) {
      console.error('Failed to load attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupAttendance();
  }, [selectedGroupId, selectedDate]);

  const handleStatusChange = (
    studentId: string,
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED'
  ) => {
    setStudentsAttendance((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setStudentsAttendance((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s))
    );
  };

  const markAllPresent = () => {
    setStudentsAttendance((prev) =>
      prev.map((s) => ({ ...s, status: 'PRESENT' }))
    );
  };

  const handleSave = async () => {
    if (!selectedGroupId || !selectedDate) return;
    setSaving(true);
    try {
      const payload = {
        groupId: selectedGroupId,
        date: selectedDate,
        records: studentsAttendance.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          notes: s.notes,
        })),
      };

      const res = await api.saveAttendance(payload);
      if (res.success) {
        setSaveSuccess(true);
        // Refresh stats
        api.getAttendanceStats().then((sRes) => {
          if (sRes.success) setStats(sRes.stats);
        });
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Davomatni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = studentsAttendance.filter((s) => s.status === 'PRESENT').length;
  const absentCount = studentsAttendance.filter((s) => s.status === 'ABSENT').length;
  const excusedCount = studentsAttendance.filter((s) => s.status === 'EXCUSED').length;
  const markedCount = presentCount + absentCount + excusedCount;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isTeacher ? 'Davomat Jurnali' : 'Davomat Nazorati'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTeacher
              ? `Ustoz: ${user?.fullName} · Faqat biriktirilgan guruhlaringiz`
              : 'Guruhlar bo‘yicha talabalar dars qatnashuvini belgilash'}
          </p>
        </div>

        {stats && (
          <div className="text-xs text-slate-600 font-medium">
            Bugungi umumiy qatnashuv: <strong className="text-emerald-700 font-bold">{stats.todayRate}%</strong>
          </div>
        )}
      </div>

      {/* Empty State when no groups exist or Teacher has no assigned groups */}
      {groups.length === 0 && !loading && (
        <div className="p-10 bg-white rounded-3xl border border-orange-100 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <School className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {isTeacher ? 'Sizga hali guruh biriktirilmagan' : 'Tizimda hali guruhlar mavjud emas'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            {isTeacher
              ? 'Hozircha tizimda sizning nomingizga faol guruh biriktirilmagan. Iltimos, o‘quv markazi ma’muriyatiga (administratorga) murojaat qiling.'
              : 'Davomat olish uchun avval «Guruhlar» bo‘limida yangi guruh yarating va unga o‘quvchilarni biriktiring.'}
          </p>
        </div>
      )}

      {/* Selector Toolbar */}
      {groups.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Group Selector */}
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-orange-600" />
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.courseName})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {selectedDate !== new Date().toISOString().slice(0, 10) && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                  className="px-2.5 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200/80 cursor-pointer"
                >
                  Bugun
                </button>
              )}
            </div>
          </div>

          {/* Bulk Action: Barchasini "Keldi" deb belgilash */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllPresent}
              disabled={studentsAttendance.length === 0}
              className="px-3.5 py-2 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50 border border-orange-200/80"
            >
              ✓ Hammasini "Keldi" belgilash
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || studentsAttendance.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : 'Davomatni Saqlash'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm animate-fade-in">
          <span className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Davomat ma’lumotlari muvaffaqiyatli saqlandi!
          </span>
          <span className="text-xs text-emerald-700">
            {presentCount} keldi • {absentCount} kelmadi • {excusedCount} sababli
          </span>
        </div>
      )}

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Jami o‘quvchilar: <strong>{studentsAttendance.length}</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Keldi: {presentCount}</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">Kelmadi: {absentCount}</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">Sababli: {excusedCount}</span>
          </div>

          <span className="font-mono text-slate-400">Sana: {selectedDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">O‘quvchi</th>
                <th className="px-4 py-3 text-center">Davomat Holati</th>
                <th className="px-4 py-3">Izoh (Sabab)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-400">Davomat ma’lumotlari olinmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : studentsAttendance.length > 0 ? (
                studentsAttendance.map((student, idx) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 text-xs">
                        {student.studentCode}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-900">{student.fullName}</td>

                    {/* 3 Explicit State Buttons: Keldi, Kelmadi, Sababli */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Keldi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            student.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Kelmadi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'EXCUSED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                            student.status === 'EXCUSED'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Sababli</span>
                        </button>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3.5">
                      <input
                        type="text"
                        value={student.notes || ''}
                        onChange={(e) => handleNotesChange(student.studentId, e.target.value)}
                        placeholder="Izoh yozing..."
                        className="w-full px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Ushbu guruhda o‘quvchilar yo‘q</p>
                    <p className="text-xs mt-1">Guruhga o‘quvchilar qo‘shilgandan keyin davomat yuritish mumkin</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
