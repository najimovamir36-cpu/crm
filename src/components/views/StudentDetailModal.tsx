import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Calendar,
  School,
  BookOpen,
  GraduationCap,
  KeyRound,
  CreditCard,
  UserCheck,
  RefreshCw,
  Copy,
  Check,
  Clock,
  MapPin,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface StudentDetailModalProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshList: () => void;
  onOpenAddPaymentForStudent: (student: any) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  isOpen,
  onClose,
  onRefreshList,
  onOpenAddPaymentForStudent,
}) => {
  const { hasRole } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payments'>('overview');

  // Regenerated password state
  const [newlyRegeneratedPassword, setNewlyRegeneratedPassword] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      setNewlyRegeneratedPassword(null);
      api
        .getStudent(studentId)
        .then((res) => {
          if (res.success) setData(res.student);
        })
        .catch((err) => console.error('Failed to load student detail:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, studentId]);

  if (!isOpen || !studentId) return null;

  const handleRegeneratePassword = async () => {
    if (!window.confirm('Haqiqatan ham bu o‘quvchining parolini qayta yaratmoqchimisiz?')) {
      return;
    }

    setIsRegenerating(true);
    try {
      const res = await api.regenerateStudentPassword(studentId);
      if (res.success && res.newPassword) {
        setNewlyRegeneratedPassword(res.newPassword);
        onRefreshList();
      }
    } catch (err: any) {
      alert(err.message || 'Parolni yangilashda xatolik yuz berdi');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyCreds = (passwordToCopy: string) => {
    if (!data) return;
    const text = `EduCenter CRM — O‘quvchi Kirish Ma’lumotlari:\n👤 O‘quvchi: ${data.firstName} ${data.lastName}\n🆔 Student ID: ${data.studentId}\n🔑 Login: ${data.studentId}\n🔐 Yangi Parol: ${passwordToCopy}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val || 0) + " so'm";
  };

  const financials = data?.financials || {};
  const attStats = data?.attendance?.stats || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${data?.firstName || ''} ${data?.lastName || ''} — O‘quvchi Profili`}
      subtitle={`Student ID: ${data?.studentId || '-'}`}
      maxWidth="3xl"
    >
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-3 border-orange-600/30 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Umumiy Ma’lumotlar
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Davomat Tarixi ({data.attendance?.records?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'payments'
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              To‘lovlar & Qarz ({data.payments?.length || 0})
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial & Attendance Quick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Oylik To‘lov Miqdori
                  </span>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {formatCurrency(financials.monthlyFee)}
                  </p>
                  <span className="text-[11px] text-slate-500">Shu oy to‘landi: {formatCurrency(financials.totalPaidThisMonth)}</span>
                </div>

                <div className={`p-4 rounded-xl border ${financials.debtThisMonth > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Shu Oygi Qarzdorlik
                  </span>
                  <p className={`text-lg font-bold mt-1 ${financials.debtThisMonth > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {financials.debtThisMonth > 0 ? formatCurrency(financials.debtThisMonth) : "Qarz yo'q (To'langan)"}
                  </p>
                  {financials.debtThisMonth > 0 && (
                    <button
                      onClick={() => onOpenAddPaymentForStudent(data)}
                      className="mt-2 text-xs font-semibold text-rose-700 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> To‘lov qabul qilish
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Davomat Ko‘rsatkichi
                  </span>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    {attStats.attendanceRate || 100}%
                  </p>
                  <span className="text-[11px] text-slate-500">
                    {attStats.presentCount || 0} keldi / {attStats.totalLessons || 0} dars
                  </span>
                </div>
              </div>

              {/* Login & Security Credentials Box */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-orange-400" />
                    Kelajakdagi Mobil Ilova Kirish Ma’lumotlari (Credentials)
                  </span>
                  <Badge variant="purple">Himoyalangan</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Student ID:</span>
                    <span className="font-mono font-bold text-sky-400 text-base">{data.studentId}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Login:</span>
                    <span className="font-mono font-bold text-white text-base">{data.studentId}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Parol:</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {newlyRegeneratedPassword ? (
                        <span className="text-emerald-400 font-bold">{newlyRegeneratedPassword}</span>
                      ) : (
                        '••••••••••••'
                      )}
                    </span>
                  </div>
                </div>

                {/* If newly regenerated, show copy banner */}
                {newlyRegeneratedPassword && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-600/50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-300 font-medium">
                        Yangi parol yaratildi: <code className="text-emerald-200 font-bold text-sm">{newlyRegeneratedPassword}</code>
                      </p>
                      <p className="text-[11px] text-emerald-400/80">Ota-onaga taqdim etish uchun nusxa oling.</p>
                    </div>
                    <button
                      onClick={() => copyCreds(newlyRegeneratedPassword)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Nusxalandi' : 'Nusxa olish'}</span>
                    </button>
                  </div>
                )}

                {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleRegeneratePassword}
                      disabled={isRegenerating}
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>Parolni yangilash (Regenerate Password)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Personal & Academic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Shaxsiy Ma’lumotlar
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">Telefon:</span>
                    <span>{data.phone}</span>
                  </div>
                  {data.birthDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-800">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">Tug‘ilgan sana:</span>
                      <span>{data.birthDate}</span>
                    </div>
                  )}
                  {data.gender && (
                    <div className="flex items-center gap-2 text-sm text-slate-800">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">Jinsi:</span>
                      <span className="capitalize">{data.gender.toLowerCase()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500 block font-semibold">Ota-ona ma’lumotlari:</span>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      {data.parentName || 'Kiritilmagan'} {data.parentPhone ? `(${data.parentPhone})` : ''}
                    </p>
                  </div>
                  {data.notes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500 block font-semibold">Izoh:</span>
                      <p className="text-xs text-slate-600 mt-0.5">{data.notes}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Kurs & Guruh Ma’lumotlari
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <BookOpen className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">Kurs:</span>
                    <span>{data.courseName || 'Biriktirilmagan'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <School className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">Guruh:</span>
                    <span>{data.groupName || 'Guruhsiz'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <GraduationCap className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">O‘qituvchi:</span>
                    <span>{data.teacherName || 'Tayinlanmagan'}</span>
                  </div>
                  {data.groupTime && (
                    <div className="flex items-center gap-2 text-sm text-slate-800">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Dars vaqti:</span>
                      <span>{data.groupTime}</span>
                    </div>
                  )}
                  {data.room && (
                    <div className="flex items-center gap-2 text-sm text-slate-800">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">Xona:</span>
                      <span>{data.room}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Darslarga qatnashuv jurnali
                </span>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                  Qatnashuv foizi: {attStats.attendanceRate || 100}%
                </span>
              </div>

              {data.attendance?.records?.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Sana</th>
                        <th className="px-4 py-2.5">Holat</th>
                        <th className="px-4 py-2.5">Izoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.attendance.records.map((rec: any) => (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-900">{rec.lessonDate}</td>
                          <td className="px-4 py-2.5">
                            {rec.status === 'PRESENT' && <Badge variant="success">Keldi</Badge>}
                            {rec.status === 'ABSENT' && <Badge variant="danger">Kelmadi</Badge>}
                            {rec.status === 'EXCUSED' && <Badge variant="warning">Sababli</Badge>}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{rec.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Ushbu o‘quvchi bo‘yicha hozircha davomat qaydlari mavjud emas
                </p>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    To‘lovlar Tarixi
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jami to‘langan: {formatCurrency(financials.totalPaidAllTime)}
                  </p>
                </div>
                <button
                  onClick={() => onOpenAddPaymentForStudent(data)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yangi To‘lov</span>
                </button>
              </div>

              {data.payments?.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Kvitansiya</th>
                        <th className="px-4 py-2.5">Sana</th>
                        <th className="px-4 py-2.5">Oy</th>
                        <th className="px-4 py-2.5">Summa</th>
                        <th className="px-4 py-2.5">To‘lov turi</th>
                        <th className="px-4 py-2.5">Qabul qildi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.payments.map((pay: any) => (
                        <tr key={pay.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-mono font-medium text-slate-800">{pay.receiptNumber || '-'}</td>
                          <td className="px-4 py-2.5 text-slate-700">{pay.paymentDate}</td>
                          <td className="px-4 py-2.5 text-slate-700 font-mono">{pay.forMonth}</td>
                          <td className="px-4 py-2.5 font-bold text-emerald-700">{formatCurrency(pay.amount)}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="info">{pay.paymentType}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{pay.recordedBy || 'Admin'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Ushbu o‘quvchi bo‘yicha to‘lovlar amalga oshirilmagan
                </p>
              )}
            </div>
          )}

          {/* Footer Close */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-slate-500">O‘quvchi topilmadi</div>
      )}
    </Modal>
  );
};
