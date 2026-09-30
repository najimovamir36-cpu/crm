import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  CreditCard,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { Student, Course, Group } from '../../types';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

interface StudentsViewProps {
  onOpenAddStudent: () => void;
  onOpenStudentDetail: (studentId: string) => void;
  onOpenAddPaymentForStudent: (student: any) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onOpenAddStudent,
  onOpenStudentDetail,
  onOpenAddPaymentForStudent,
}) => {
  const { hasRole } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });

  // Delete modal state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFilters = async () => {
    try {
      const [cRes, gRes] = await Promise.all([api.getCourses(), api.getGroups()]);
      if (cRes.success) setCourses(cRes.data);
      if (gRes.success) setGroups(gRes.data);
    } catch (e) {
      console.error('Error fetching filters:', e);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({
        page,
        limit,
        search,
        courseId: selectedCourse,
        groupId: selectedGroup,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
      });

      if (res.success) {
        setStudents(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, limit, search, selectedCourse, selectedGroup, selectedStatus, selectedPaymentStatus]);

  // Real-time synchronization: Auto-refresh every 5 seconds, on window focus, and when a new student is added
  useEffect(() => {
    const handleStudentCreated = () => {
      fetchStudents();
    };

    const handleWindowFocus = () => {
      fetchStudents();
    };

    // Auto-polling interval: 5 seconds
    const intervalId = setInterval(() => {
      // Background silent refetch without turning on full loading spinner
      api.getStudents({
        page,
        limit,
        search,
        courseId: selectedCourse,
        groupId: selectedGroup,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
      }).then((res) => {
        if (res.success) {
          setStudents(res.data);
          setMeta(res.meta);
        }
      }).catch(() => {});
    }, 5000);

    window.addEventListener('crm:student-created', handleStudentCreated);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('crm:student-created', handleStudentCreated);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [page, limit, search, selectedCourse, selectedGroup, selectedStatus, selectedPaymentStatus]);

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteStudent(studentToDelete.id);
      if (res.success) {
        setStudentToDelete(null);
        fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'O‘chirishda xatolik yuz berdi');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            O‘quvchilar Ro‘yxati
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jami: <strong className="text-slate-800">{meta.total}</strong> nafar o‘quvchi ro‘yxatga olingan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStudents()}
            title="Ro‘yxatni darhol yangilash"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-200/80"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Yangilash</span>
          </button>

          {hasRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']) && (
            <button
              onClick={onOpenAddStudent}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:from-orange-700 active:to-amber-700 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ O‘quvchi qo‘shish</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-orange-100/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by Name, ID, Phone */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Ism, familiya, ID yoki telefon..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
            />
          </div>

          {/* Filter by Course */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedGroup('');
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
            >
              <option value="">Barcha kurslar</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Group */}
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
            >
              <option value="">Barcha guruhlar</option>
              {groups
                .filter((g) => !selectedCourse || g.courseId === selectedCourse)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Filter by Payment Status */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
            >
              <option value="ALL">Barcha to‘lovlar</option>
              <option value="DEBTOR">🔴 Faqat qarzdorlar</option>
              <option value="PAID">🟢 To‘laganlar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-orange-100/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF7F4] border-b border-orange-100/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">O‘quvchi</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">Kurs & Guruh</th>
                <th className="px-4 py-3">O‘qituvchi</th>
                <th className="px-4 py-3">To‘lov Holati</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-400">O‘quvchilar ma’lumotlari yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-orange-50/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenStudentDetail(student.id)}
                  >
                    {/* Unique Student ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200/80">
                        {student.studentId}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {student.firstName} {student.lastName}
                      </div>
                      {student.parentName && (
                        <div className="text-[11px] text-slate-400">Ota-ona: {student.parentName}</div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 font-mono text-slate-600">{student.phone}</td>

                    {/* Course & Group */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{student.courseName || '-'}</div>
                      <div className="text-[11px] text-blue-900 font-bold">{student.groupName || '-'}</div>
                    </td>

                    {/* Teacher */}
                    <td className="px-4 py-3 text-slate-600">{student.teacherName || '-'}</td>

                    {/* Payment Status & Debt */}
                    <td className="px-4 py-3">
                      {student.debtThisMonth && student.debtThisMonth > 0 ? (
                        <div>
                          <Badge variant="danger">Qarz: {formatCurrency(student.debtThisMonth)}</Badge>
                        </div>
                      ) : student.paymentStatus === 'PAID' ? (
                        <Badge variant="success">To‘langan</Badge>
                      ) : (
                        <Badge variant="neutral">Bepul / Belgilanmagan</Badge>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {student.status === 'ACTIVE' && <Badge variant="success">Faol</Badge>}
                      {student.status === 'FROZEN' && <Badge variant="warning">Muzlatilgan</Badge>}
                      {student.status === 'LEFT' && <Badge variant="danger">Ketgan</Badge>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenStudentDetail(student.id)}
                          title="Profilni ko‘rish"
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
                          <button
                            onClick={() => onOpenAddPaymentForStudent(student)}
                            title="To‘lov qabul qilish"
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
                          <button
                            onClick={() => setStudentToDelete(student)}
                            title="O‘quvchini o‘chirish"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">O‘quvchilar topilmadi</p>
                    <p className="text-xs mt-1">Qidiruv yoki filter shartlarini o‘zgartirib ko‘ring</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Har bir sahifada:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value={20}>20 ta</option>
              <option value={50}>50 ta</option>
              <option value={100}>100 ta</option>
            </select>
            <span>
              Jami: <strong>{meta.total}</strong> tadan {students.length} tasi ko‘rsatildi
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Oldingi
            </button>
            <span className="px-3 py-1.5 font-semibold text-slate-800">
              {page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="O‘quvchini o‘chirish"
        message={`Haqiqatan ham bu o‘quvchini (${studentToDelete?.firstName} ${studentToDelete?.lastName}, ID: ${studentToDelete?.studentId}) o‘chirmoqchimisiz? Ushbu amal audit loglarida qayd etiladi.`}
        confirmText="Ha, o‘chirish"
        cancelText="Bekor qilish"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
