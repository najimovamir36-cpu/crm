import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { Payment, Student } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

interface PaymentsViewProps {
  initialStudentForPayment?: any;
  onOpenStudentDetail: (id: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  initialStudentForPayment,
  onOpenStudentDetail,
}) => {
  const { hasRole, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentType, setPaymentType] = useState('ALL');
  const [month, setMonth] = useState('');

  // Add Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [forMonth, setForMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedType, setSelectedType] = useState<'CASH' | 'CARD' | 'BANK' | 'OTHER'>('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Debtors Modal View
  const [showDebtorsModal, setShowDebtorsModal] = useState(false);
  const [debtorsList, setDebtorsList] = useState<any[]>([]);

  const fetchPayments = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getPayments({
        search,
        paymentType,
        month,
      });
      if (res.success) {
        setPayments(res.data);
        setStats(res.stats);
      }
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    const handleFocus = () => fetchPayments(true);
    const interval = setInterval(() => fetchPayments(true), 6000);

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [search, paymentType, month]);

  // Load students for payment selection dropdown
  const loadStudentsForModal = async () => {
    try {
      const res = await api.getStudents({ limit: 100 });
      if (res.success) {
        setAllStudents(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (initialStudentForPayment) {
      setSelectedStudentId(initialStudentForPayment.id || initialStudentForPayment.studentId);
      if (initialStudentForPayment.financials?.debtThisMonth) {
        setAmount(initialStudentForPayment.financials.debtThisMonth);
      } else if (initialStudentForPayment.debtThisMonth) {
        setAmount(initialStudentForPayment.debtThisMonth);
      }
      loadStudentsForModal();
      setIsModalOpen(true);
    }
  }, [initialStudentForPayment]);

  const handleOpenAddModal = () => {
    loadStudentsForModal();
    setSelectedStudentId('');
    setAmount('');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleStudentSelect = (sId: string) => {
    setSelectedStudentId(sId);
    const st = allStudents.find((s) => s.id === sId || s.studentId === sId);
    if (st && st.debtThisMonth && st.debtThisMonth > 0) {
      setAmount(st.debtThisMonth);
    } else if (st && st.monthlyFee) {
      setAmount(st.monthlyFee);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('O‘quvchi tanlanishi shart');
      return;
    }
    const num = Number(amount);
    if (!num || num <= 0) {
      setError('To‘lov summasi 0 dan katta bo‘lishi kerak');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.createPayment({
        studentId: selectedStudentId,
        amount: num,
        paymentDate,
        forMonth,
        paymentType: selectedType,
        notes: notes.trim(),
      });

      if (res.success) {
        setIsModalOpen(false);
        fetchPayments();
      }
    } catch (err: any) {
      setError(err.message || 'To‘lovni qabul qilishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open debtors list
  const handleOpenDebtors = async () => {
    try {
      const res = await api.getReports();
      if (res.success && res.data?.debtorsList) {
        setDebtorsList(res.data.debtorsList);
        setShowDebtorsModal(true);
      }
    } catch (e) {
      console.error(e);
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">To‘lovlar va Moliya</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            O‘quvchilar to‘lovlari, kvitansiyalar va qarzdorlik hisob-kitobi
          </p>
        </div>

        {hasRole(['SUPER_ADMIN', 'ADMIN']) && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenDebtors}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Qarzdorlar ({stats?.debtorsCount || 0})</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:from-orange-700 active:to-amber-700 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ To‘lov qabul qilish</span>
            </button>
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Shu oygi tushum
          </span>
          <p className="text-xl font-black text-orange-600 mt-1">
            {formatCurrency(stats?.totalRevenueThisMonth || 0)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Oy: {stats?.currentMonth}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Jami tushum (All-Time)
          </span>
          <p className="text-xl font-black text-orange-700 mt-1">
            {formatCurrency(stats?.totalRevenueAllTime || 0)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Barcha to‘lovlar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tizimdagi Umumiy Qarz
          </span>
          <p className="text-xl font-black text-rose-600 mt-1">
            {formatCurrency(stats?.totalDebtInSystem || 0)}
          </p>
          <span className="text-[11px] text-rose-600 font-medium">
            Shu oy to‘lamaganlar
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Qarzdor Talabalar
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {stats?.debtorsCount || 0} nafar
          </p>
          <span className="text-[11px] text-slate-500 font-medium">Eslatma yuborish lozim</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="O‘quvchi ismi, ID yoki kvitansiya raqami..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          />
        </div>

        <div>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          >
            <option value="ALL">Barcha to‘lov turlari</option>
            <option value="CASH">Naqd pul</option>
            <option value="CARD">Plastik karta</option>
            <option value="BANK">Bank o‘tkazmasi</option>
            <option value="OTHER">Boshqa</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Kvitansiya #</th>
                <th className="px-4 py-3">O‘quvchi</th>
                <th className="px-4 py-3">Kurs & Guruh</th>
                <th className="px-4 py-3">To‘lov Sanasi</th>
                <th className="px-4 py-3">Qaysi oy uchun</th>
                <th className="px-4 py-3">To‘lov Turi</th>
                <th className="px-4 py-3">Summa</th>
                <th className="px-4 py-3">Qabul qildi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-400">To‘lovlar yuklanmoqda...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" />
                      {p.receiptNumber || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        onClick={() => onOpenStudentDetail(p.studentId)}
                        className="font-semibold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {p.studentName}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">ID: {p.studentCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.courseName}</div>
                      <div className="text-[11px] text-slate-500">{p.groupName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.paymentDate}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{p.forMonth}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{p.paymentType}</Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.recordedBy || 'Admin'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    To‘lovlar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="+ To‘lov Qabul Qilish"
        subtitle="O‘quvchi to‘lovini qabul qilib, kvitansiya generatsiya qilish"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              O‘quvchini tanlang <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required
            >
              <option value="">O‘quvchini qidiring va tanlang...</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} (ID: {s.studentId}) — {s.groupName || 'Guruhsiz'}
                  {s.debtThisMonth && s.debtThisMonth > 0 ? ` [Qarz: ${formatCurrency(s.debtThisMonth)}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To‘lov summasi (so‘m) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="500000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To‘lov turi</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                <option value="CASH">Naqd pul</option>
                <option value="CARD">Plastik karta (UzCard / Humo)</option>
                <option value="BANK">Bank o‘tkazmasi</option>
                <option value="OTHER">Boshqa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To‘lov sanasi</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qaysi oy uchun</label>
              <input
                type="month"
                value={forMonth}
                onChange={(e) => setForMonth(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Izoh</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: To‘liq to‘landi yoki Chek raqami..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Qabul qilinmoqda...' : 'To‘lovni qabul qilish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Debtors Modal */}
      {showDebtorsModal && (
        <Modal
          isOpen={showDebtorsModal}
          onClose={() => setShowDebtorsModal(false)}
          title="Qarzdor O‘quvchilar Ro‘yxati"
          subtitle={`Jami ${debtorsList.length} nafar o‘quvchining joriy oy bo‘yicha qarzdorligi bor`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {debtorsList.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">O‘quvchi</th>
                      <th className="px-4 py-2.5">Telefon</th>
                      <th className="px-4 py-2.5">Guruh</th>
                      <th className="px-4 py-2.5 text-right">Qarz Miqdori</th>
                      <th className="px-4 py-2.5 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {debtorsList.map((d) => (
                      <tr key={d.studentId} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">
                          {d.fullName}
                          <span className="block text-[10px] text-slate-400 font-mono">ID: {d.studentCode}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">{d.phone}</td>
                        <td className="px-4 py-2.5 text-slate-700">{d.groupName}</td>
                        <td className="px-4 py-2.5 font-bold text-rose-600 text-right">
                          {formatCurrency(d.debt)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => {
                              setShowDebtorsModal(false);
                              handleStudentSelect(d.studentId);
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded text-[11px] cursor-pointer"
                          >
                            To‘lash
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-6 text-sm text-slate-400">
                Ayni paytda hech qanday qarzdorlik mavjud emas!
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDebtorsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Yopish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
