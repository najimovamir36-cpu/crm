import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Phone, School, Users, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Teacher } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export const TeachersView: React.FC = () => {
  const { hasRole } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [salaryRate, setSalaryRate] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTeachers = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getTeachers();
      if (res.success) setTeachers(res.data);
    } catch (e) {
      console.error('Failed to load teachers:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();

    const handleFocus = () => fetchTeachers(true);
    const interval = setInterval(() => fetchTeachers(true), 6000);

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const openCreateModal = () => {
    setEditingTeacher(null);
    setFullName('');
    setPhone('');
    setSpecialty('');
    setBio('');
    setSalaryRate(50);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFullName(t.fullName);
    setPhone(t.phone);
    setSpecialty(t.specialty);
    setBio(t.bio || '');
    setSalaryRate(t.salaryRate || 50);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !specialty.trim()) {
      setError('Ism, telefon va mutaxassislik kiritilishi shart');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, {
          fullName: fullName.trim(),
          phone: phone.trim(),
          specialty: specialty.trim(),
          bio: bio.trim(),
          salaryRate: Number(salaryRate),
        });
      } else {
        await api.createTeacher({
          fullName: fullName.trim(),
          phone: phone.trim(),
          specialty: specialty.trim(),
          bio: bio.trim(),
          salaryRate: Number(salaryRate),
        });
      }
      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!teacherToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteTeacher(teacherToDelete.id);
      if (res.success) {
        setTeacherToDelete(null);
        fetchTeachers();
      }
    } catch (err: any) {
      alert(err.message || 'O‘qituvchini o‘chirishda xatolik');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">O‘qituvchilar Tarkibi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            O‘quv markazining pedagog xodimlari va ularning yuklamalari
          </p>
        </div>

        {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi o‘qituvchi qo‘shish</span>
          </button>
        )}
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center font-bold text-orange-700 text-base">
                      {teacher.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{teacher.fullName}</h3>
                      <span className="text-xs text-orange-600 font-semibold">{teacher.specialty}</span>
                    </div>
                  </div>
                  <Badge variant={teacher.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {teacher.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 my-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{teacher.phone}</span>
                  </div>
                  {teacher.bio && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 italic pt-1">{teacher.bio}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <School className="w-4 h-4 text-slate-400" />
                    <span>{teacher.groupsCount || 0} ta guruh</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{teacher.studentsCount || 0} ta talaba</span>
                  </div>
                </div>
              </div>

              {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditModal(teacher)}
                    title="Tahrirlash"
                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTeacherToDelete(teacher)}
                    title="O‘chirish"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'O‘qituvchini Tahrirlash' : '+ Yangi O‘qituvchi Qo‘shish'}
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
              Ism va familiya <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Sardor Raximov"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Telefon raqami <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mutaxassislik yo‘nalishi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Masalan: IELTS Instruktor, Senior Matematik"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Qisqacha bio / tajriba</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tajribasi, yutuqlari va sertifikatlari..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
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
        isOpen={Boolean(teacherToDelete)}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="O‘qituvchini o‘chirish"
        message={`Haqiqatan ham o‘qituvchi (${teacherToDelete?.fullName}) ma’lumotlarini arxivlamoqchimisiz?`}
        confirmText="Ha, o‘chirish"
        cancelText="Bekor qilish"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
