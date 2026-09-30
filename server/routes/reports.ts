import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { getStudentFinancials } from './students.js';

export const reportsRouter = Router();

reportsRouter.get('/summary', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const totalStudents = db.students.filter((s) => !s.deletedAt).length;
  const activeStudents = db.students.filter((s) => !s.deletedAt && s.status === 'ACTIVE').length;
  const frozenStudents = db.students.filter((s) => !s.deletedAt && s.status === 'FROZEN').length;
  const leftStudents = db.students.filter((s) => s.deletedAt || s.status === 'LEFT').length;

  const totalGroups = db.groups.filter((g) => !g.deletedAt).length;
  const activeGroups = db.groups.filter((g) => !g.deletedAt && g.status === 'ACTIVE').length;
  const totalTeachers = db.teachers.filter((t) => !t.deletedAt && t.status === 'ACTIVE').length;

  // Debtors report
  const debtorsList: any[] = [];
  let totalDebt = 0;

  db.students
    .filter((s) => !s.deletedAt && s.status === 'ACTIVE')
    .forEach((s) => {
      const fin = getStudentFinancials(s.id, currentMonth);
      if (fin.debtThisMonth > 0) {
        totalDebt += fin.debtThisMonth;
        const group = db.groups.find((g) => g.id === s.groupId);
        const course = db.courses.find((c) => c.id === s.courseId);
        debtorsList.push({
          studentId: s.id,
          studentCode: s.studentId,
          fullName: `${s.firstName} ${s.lastName}`,
          phone: s.phone,
          parentPhone: s.parentPhone,
          groupName: group?.name || 'Guruhsiz',
          courseName: course?.name || 'Kurs belgilanmagan',
          monthlyFee: fin.monthlyFee,
          paidThisMonth: fin.totalPaidThisMonth,
          debt: fin.debtThisMonth,
        });
      }
    });

  // Revenue breakdown by payment method this month
  const paymentsThisMonth = db.payments.filter((p) => p.forMonth === currentMonth);
  const totalRevenueThisMonth = paymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);

  const revenueByType = {
    CASH: paymentsThisMonth.filter((p) => p.paymentType === 'CASH').reduce((sum, p) => sum + p.amount, 0),
    CARD: paymentsThisMonth.filter((p) => p.paymentType === 'CARD').reduce((sum, p) => sum + p.amount, 0),
    BANK: paymentsThisMonth.filter((p) => p.paymentType === 'BANK').reduce((sum, p) => sum + p.amount, 0),
    OTHER: paymentsThisMonth.filter((p) => p.paymentType === 'OTHER').reduce((sum, p) => sum + p.amount, 0),
  };

  // Teacher performance report (groups count, students count, attendance avg)
  const teacherReport = db.teachers
    .filter((t) => !t.deletedAt)
    .map((teacher) => {
      const teacherGroups = db.groups.filter((g) => g.teacherId === teacher.id && !g.deletedAt);
      const groupIds = teacherGroups.map((g) => g.id);
      const students = db.students.filter(
        (s) => s.groupId && groupIds.includes(s.groupId) && !s.deletedAt && s.status === 'ACTIVE'
      );

      const attendanceRecords = db.attendance.filter((a) => groupIds.includes(a.groupId));
      const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      const attendanceRate =
        attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 100;

      return {
        id: teacher.id,
        fullName: teacher.fullName,
        specialty: teacher.specialty,
        groupsCount: teacherGroups.length,
        studentsCount: students.length,
        attendanceRate,
      };
    });

  // Course breakdown report
  const courseReport = db.courses
    .filter((c) => !c.deletedAt)
    .map((c) => {
      const students = db.students.filter((s) => s.courseId === c.id && !s.deletedAt && s.status === 'ACTIVE');
      const groups = db.groups.filter((g) => g.courseId === c.id && !g.deletedAt);
      return {
        id: c.id,
        name: c.name,
        monthlyFee: c.monthlyFee,
        groupsCount: groups.length,
        studentsCount: students.length,
        potentialMonthlyRevenue: students.length * c.monthlyFee,
      };
    });

  return res.json({
    success: true,
    data: {
      studentsOverview: {
        totalStudents,
        activeStudents,
        frozenStudents,
        leftStudents,
      },
      groupsOverview: {
        totalGroups,
        activeGroups,
        totalTeachers,
      },
      financialOverview: {
        currentMonth,
        totalRevenueThisMonth,
        revenueByType,
        totalDebt,
        debtorsCount: debtorsList.length,
      },
      debtorsList,
      teacherReport,
      courseReport,
    },
  });
});
