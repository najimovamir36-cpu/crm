import { Router } from 'express';
import { db, Payment, PaymentType } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { getStudentFinancials } from './students.js';

export const paymentsRouter = Router();

// GET /api/payments
paymentsRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const { studentId, month, paymentType, search } = req.query;

  let list = [...db.payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  if (studentId) {
    list = list.filter((p) => p.studentId === studentId);
  }
  if (month) {
    list = list.filter((p) => p.forMonth === month);
  }
  if (paymentType && paymentType !== 'ALL') {
    list = list.filter((p) => p.paymentType === paymentType);
  }

  const enriched = list.map((payment) => {
    const student = db.students.find(
      (s) => s.id === payment.studentId || s.studentId === payment.studentId
    );
    const group = student?.groupId ? db.groups.find((g) => g.id === student.groupId) : null;
    const course = student?.courseId ? db.courses.find((c) => c.id === student.courseId) : null;

    return {
      ...payment,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Noma’lum o‘quvchi',
      studentCode: student?.studentId || '-',
      groupName: group?.name || 'Guruhsiz',
      courseName: course?.name || 'Kurs belgilanmagan',
      studentPhone: student?.phone || '-',
    };
  });

  let filtered = enriched;
  if (search) {
    const q = (search as string).toLowerCase().trim();
    filtered = enriched.filter(
      (p) =>
        p.studentName.toLowerCase().includes(q) ||
        p.studentCode.includes(q) ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        p.studentPhone.includes(q)
    );
  }

  // Summary financials
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalRevenueAllTime = db.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalRevenueThisMonth = db.payments
    .filter((p) => p.forMonth === currentMonth)
    .reduce((sum, p) => sum + p.amount, 0);

  // Total debt in system for active students this month
  let totalDebtInSystem = 0;
  let debtorsCount = 0;
  db.students
    .filter((s) => !s.deletedAt && s.status === 'ACTIVE')
    .forEach((s) => {
      const fin = getStudentFinancials(s.id, currentMonth);
      if (fin.debtThisMonth > 0) {
        totalDebtInSystem += fin.debtThisMonth;
        debtorsCount++;
      }
    });

  return res.json({
    success: true,
    data: filtered,
    stats: {
      totalRevenueAllTime,
      totalRevenueThisMonth,
      totalDebtInSystem,
      debtorsCount,
      currentMonth,
    },
  });
});

// POST /api/payments
paymentsRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const { studentId, amount, paymentDate, forMonth, paymentType, notes } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'O‘quvchi tanlanishi shart' });
  }

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: 'To‘lov summasi 0 dan katta bo‘lishi shart' });
  }

  const student = db.students.find((s) => s.id === studentId || s.studentId === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });
  }

  const now = new Date().toISOString();
  const dateStr = paymentDate || now.slice(0, 10);
  const monthStr = forMonth || dateStr.slice(0, 7);
  const receiptNumber = `PAY-${Date.now().toString().slice(-6)}`;

  const newPayment: Payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    studentId: student.id,
    amount: numericAmount,
    paymentDate: dateStr,
    forMonth: monthStr,
    paymentType: (paymentType as PaymentType) || 'CASH',
    receiptNumber,
    notes: notes ? notes.trim() : '',
    recordedBy: req.user?.fullName || 'Admin',
    createdAt: now,
  };

  db.payments.unshift(newPayment);
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'To‘lov qabul qilindi',
    entity: 'Payment',
    entityId: newPayment.id,
    details: {
      student: `${student.firstName} ${student.lastName}`,
      studentCode: student.studentId,
      amount: numericAmount,
      receiptNumber,
      forMonth: monthStr,
    },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.status(201).json({
    success: true,
    message: 'To‘lov muvaffaqiyatli qabul qilindi',
    payment: newPayment,
  });
});
