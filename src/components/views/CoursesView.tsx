import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Users, School, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Course } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export const CoursesView: React.FC = () => {
  const { hasRole } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState(3);
  const [monthlyFee, setMonthlyFee] = useState<number | ''>(600000);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirm
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourses = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getCourses();
      if (res.success) setCourses(res.data);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();

    const handleFocus = () => fetchCourses(true);
    const interval = setInterval(() => fetchCourses(true), 6000);

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setName('');
    setDescription('');
    setDurationMonths(3);
    setMonthlyFee(600000);
    setStartMonth('');
    setEndMonth('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCourse(c);
    setName(c.name);
    setDescription(c.description || '');
    setDurationMonths(c.durationMonths || 3);
    setMonthlyFee(c.monthlyFee || 0);
    setStartMonth(c.startDate || c.startMonth || '');
    setEndMonth(c.endDate || c.endMonth || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Kurs nomi kiritilishi shart');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, {
          name: name.trim(),
          description: description.trim(),
          durationMonths: Number(durationMonths),
          monthlyFee: Number(monthlyFee) || 0,
          startDate: startMonth,
          endDate: endMonth,
        } as any);
      } else {
        await api.createCourse({
          name: name.trim(),
          description: description.trim(),
          durationMonths: Number(durationMonths),
          monthlyFee: Number(monthlyFee) || 0,
          startDate: startMonth,
          endDate: endMonth,
        } as any);
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteCourse(courseToDelete.id);
      if (res.success) {
        setCourseToDelete(null);
        fetchCourses();
      }
    } catch (err: any) {
      alert(err.message || 'Kursni o‘chirishda xatolik');
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Kurslar Katalogi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            O‘quv markazidagi barcha ta’lim yo‘nalishlari va narxlari
          </p>
        </div>

        {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi kurs yaratish</span>
          </button>
        )}
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {course.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-2">{course.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {course.description || 'Tavsif kiritilmagan'}
                </p>

                <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <School className="w-4 h-4 text-slate-400" />
                    <span>{course.groupsCount || 0} ta guruh</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{course.studentsCount || 0} ta o‘quvchi</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Oylik to‘lov:</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {formatCurrency(course.monthlyFee)}
                  </span>
                </div>

                {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(course)}
                      title="Tahrirlash"
                      className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCourseToDelete(course)}
                      title="O‘chirish"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Kursni Tahrirlash' : '+ Yangi Kurs Yaratish'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kurs nomi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: IELTS Intensive, Frontend Dasturlash"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tavsif</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurs haqida qisqacha ma’lumot..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Davomiyligi (oy)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Oylik to‘lov (so‘m)</label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value ? Number(e.target.value) : '')}
                placeholder="600000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>
          </div>

          {/* Boshlanish va Tugash oyi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Boshlanish oyi / sanasi <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tugash oyi / sanasi <span className="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={Boolean(courseToDelete)}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Kursni o‘chirish"
        message={`Haqiqatan ham bu kursni (${courseToDelete?.name}) arxivlamoqchimisiz?`}
        confirmText="Ha, o‘chirish"
        cancelText="Bekor qilish"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
