import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  GraduationCap,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Group, Course, Teacher } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface GroupsViewProps {
  onOpenStudentDetail: (id: string) => void;
  onNavigateToAttendanceWithGroup: (groupId: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  onOpenStudentDetail,
  onNavigateToAttendanceWithGroup,
}) => {
  const { hasRole } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Group Details Modal
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add Group Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Dushanba', 'Chorshanba', 'Juma']);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [room, setRoom] = useState('301-xona');
  const [maxStudents, setMaxStudents] = useState(16);
  const [monthlyFee, setMonthlyFee] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Group
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const ALL_DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

  const loadData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [gRes, cRes, tRes] = await Promise.all([
        api.getGroups(),
        api.getCourses(),
        api.getTeachers(),
      ]);
      if (gRes.success) setGroups(gRes.data);
      if (cRes.success) setCourses(cRes.data);
      if (tRes.success) setTeachers(tRes.data);
    } catch (e) {
      console.error('Failed to load groups data:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleFocus = () => loadData(true);
    const interval = setInterval(() => loadData(true), 6000);

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleOpenDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await api.getGroup(id);
      if (res.success) {
        setSelectedGroupDetail(res.group);
      }
    } catch (e) {
      console.error('Failed to fetch group detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !courseId) {
      setFormError('Guruh nomi va kurs tanlanishi shart');
      return;
    }
    if (selectedDays.length === 0) {
      setFormError('Kamida 1 ta dars kuni tanlanishi shart');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await api.createGroup({
        name: groupName.trim(),
        courseId,
        teacherId: teacherId || undefined,
        startDate,
        endDate: endDate || undefined,
        days: selectedDays,
        startTime,
        endTime,
        room,
        maxStudents,
        monthlyFee: monthlyFee !== '' ? Number(monthlyFee) : undefined,
      });

      if (res.success) {
        setIsAddModalOpen(false);
        // reset form
        setGroupName('');
        setCourseId('');
        setTeacherId('');
        setEndDate('');
        setMonthlyFee('');
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Guruhni saqlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteGroup(groupToDelete.id);
      if (res.success) {
        setGroupToDelete(null);
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Guruhni o‘chirishda xatolik');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Guruhlar Boshqaruvi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Faol o‘quv guruhlari, o‘qituvchilar va dars vaqtlari jadvali
          </p>
        </div>

        {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:from-orange-700 active:to-amber-700 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi guruh ochish</span>
          </button>
        )}
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const isFull = (group.studentCount || 0) >= group.maxStudents;
            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-orange-100/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded">
                        {group.courseName}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{group.name}</h3>
                    </div>
                    <Badge variant={group.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {group.status === 'ACTIVE' ? 'Faol' : 'Yopilgan'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 my-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">O‘qituvchi:</span>
                      <span>{group.teacherName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">Dars kunlari:</span>
                      <span>{group.days.join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">Vaqti:</span>
                      <span>
                        {group.startTime} - {group.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-700">Xona:</span>
                      <span>{group.room}</span>
                    </div>
                  </div>

                  {/* Student capacity bar */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">O‘quvchilar sig‘imi:</span>
                      <span className={isFull ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                        {group.studentCount || 0} / {group.maxStudents} nafar
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, Math.round(((group.studentCount || 0) / group.maxStudents) * 100))}%`,
                        }}
                        className={`h-full rounded-full ${
                          isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-orange-600 to-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-5 py-3 bg-[#FAF7F4] border-t border-orange-100/80 flex items-center justify-between">
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {formatCurrency(group.monthlyFee)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDetail(group.id)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Batafsil</span>
                    </button>

                    <button
                      onClick={() => onNavigateToAttendanceWithGroup(group.id)}
                      title="Davomatga o‘tish"
                      className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Davomat</span>
                    </button>

                    {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
                      <button
                        onClick={() => setGroupToDelete(group)}
                        title="O‘chirish"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
          <School className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">Hozircha guruhlar mavjud emas</p>
          <p className="text-xs mt-1">Yangi kurs guruhi ochish uchun yuqoridagi tugmani bosing</p>
        </div>
      )}

      {/* Add Group Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="+ Yangi Guruh Ochish"
        subtitle="Guruh nomi, dars vaqtlari, o‘qituvchi va xonani belgilang"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Guruh nomi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Masalan: IELTS-14 yoki FRONTEND-02"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kurs <span className="text-rose-500">*</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  const crs = courses.find((c) => c.id === e.target.value);
                  if (crs && monthlyFee === '') setMonthlyFee(crs.monthlyFee);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                required
              >
                <option value="">Kursni tanlang...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                O‘qituvchi <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                <option value="">Tanlanmagan (Keyinroq biriktirish)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dars Kunlari */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dars kunlari</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guruh davomiyligi: Boshlanish va Tugash sanasi / oylari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Boshlanish sanasi / oyi <span className="text-orange-600">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tugash sanasi / oyi <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Boshlanish vaqti</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tugash vaqti</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Xona</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Masalan: 204-xona"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max o‘quvchilar</label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Oylik to‘lov (so‘m)</label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value ? Number(e.target.value) : '')}
                placeholder="600000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Guruhni ochish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Group Detail Modal */}
      {selectedGroupDetail && (
        <Modal
          isOpen={Boolean(selectedGroupDetail)}
          onClose={() => setSelectedGroupDetail(null)}
          title={`Guruh: ${selectedGroupDetail.name}`}
          subtitle={`${selectedGroupDetail.courseName} • ${selectedGroupDetail.teacherName}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Dars kunlari:</span>
                <span className="text-slate-900 font-bold">{selectedGroupDetail.days?.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Vaqti:</span>
                <span className="text-slate-900 font-bold">{selectedGroupDetail.startTime} - {selectedGroupDetail.endTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Xona:</span>
                <span className="text-slate-900 font-bold">{selectedGroupDetail.room}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Oylik to‘lov:</span>
                <span className="text-slate-900 font-bold">{formatCurrency(selectedGroupDetail.monthlyFee)}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Guruh O‘quvchilari ({selectedGroupDetail.students?.length || 0})
                </h4>
                <button
                  onClick={() => {
                    const gId = selectedGroupDetail.id;
                    setSelectedGroupDetail(null);
                    onNavigateToAttendanceWithGroup(gId);
                  }}
                  className="text-xs text-orange-600 font-bold hover:underline"
                >
                  Davomat belgilash →
                </button>
              </div>

              {selectedGroupDetail.students?.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">ID</th>
                        <th className="px-4 py-2.5">Ism Familiya</th>
                        <th className="px-4 py-2.5">Telefon</th>
                        <th className="px-4 py-2.5">Shu oy to‘lov</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedGroupDetail.students.map((s: any) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            setSelectedGroupDetail(null);
                            onOpenStudentDetail(s.id);
                          }}
                        >
                          <td className="px-4 py-2.5 font-mono text-sky-700 font-bold">{s.studentId}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">{s.firstName} {s.lastName}</td>
                          <td className="px-4 py-2.5 text-slate-600">{s.phone}</td>
                          <td className="px-4 py-2.5">
                            {s.debtThisMonth > 0 ? (
                              <Badge variant="danger">Qarz: {formatCurrency(s.debtThisMonth)}</Badge>
                            ) : (
                              <Badge variant="success">To‘langan</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-xl">
                  Guruhda hozircha o‘quvchilar yo‘q
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedGroupDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Yopish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(groupToDelete)}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Guruhni o‘chirish"
        message={`Haqiqatan ham bu guruhni (${groupToDelete?.name}) arxivlamoqchimisiz?`}
        confirmText="Ha, o‘chirish"
        cancelText="Bekor qilish"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
