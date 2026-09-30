import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getStudentFinancials } from './students.js';

export const dashboardRouter = Router();

// Day names in Uzbek
const UZBEK_DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

dashboardRouter.get('/stats', requireAuth, (req: AuthRequest, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);
  const currentDayIndex = new Date().getDay();
  const currentDayName = UZBEK_DAYS[currentDayIndex];

  // If TEACHER, filter stats to their own scope
  let teacherProfile = null;
  let teacherGroupIds: string[] | null = null;
  if (req.user?.role === 'TEACHER') {
    teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile) {
      teacherGroupIds = db.groups
        .filter((g) => g.teacherId === teacherProfile!.id && !g.deletedAt)
        .map((g) => g.id);
    } else {
      teacherGroupIds = [];
    }
  }

  // 1. Students stats
  let allStudents = db.students.filter((s) => !s.deletedAt);
  if (teacherGroupIds !== null) {
    allStudents = allStudents.filter((s) => s.groupId && teacherGroupIds!.includes(s.groupId));
  }
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter((s) => s.status === 'ACTIVE').length;

  // 2. Groups stats
  let allGroups = db.groups.filter((g) => !g.deletedAt);
  if (teacherGroupIds !== null) {
    allGroups = allGroups.filter((g) => teacherGroupIds!.includes(g.id));
  }
  const totalGroups = allGroups.length;

  // 3. Teachers count
  const totalTeachers = db.teachers.filter((t) => !t.deletedAt && t.status === 'ACTIVE').length;

  // 4. Today's lessons
  const todaySchedules = db.schedules.filter((s) => {
    const isToday = s.dayOfWeek.toLowerCase() === currentDayName.toLowerCase();
    if (!isToday) return false;
    if (teacherGroupIds !== null) return teacherGroupIds.includes(s.groupId);
    return true;
  });
  const todayLessonsCount = todaySchedules.length;

  const todayLessons = todaySchedules.map((s) => {
    const group = db.groups.find((g) => g.id === s.groupId);
    const course = group ? db.courses.find((c) => c.id === group.courseId) : null;
    const teacher = s.teacherId ? db.teachers.find((t) => t.id === s.teacherId) : null;
    const hasAttendanceToday = db.attendance.some((a) => a.groupId === s.groupId && a.lessonDate === today);
    return {
      id: s.id,
      groupId: s.groupId,
      groupName: group?.name || 'Guruh',
      courseName: course?.name || 'Kurs',
      teacherName: teacher?.fullName || 'O‘qituvchi',
      room: s.room,
      startTime: s.startTime,
      endTime: s.endTime,
      hasAttendance: hasAttendanceToday,
    };
  });

  // 5. Today's attendance
  let todayAttendanceRecords = db.attendance.filter((a) => a.lessonDate === today);
  if (teacherGroupIds !== null) {
    todayAttendanceRecords = todayAttendanceRecords.filter((a) => teacherGroupIds!.includes(a.groupId));
  }
  const todayPresent = todayAttendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const todayTotalAttendance = todayAttendanceRecords.length;
  const todayAttendanceRate =
    todayTotalAttendance > 0 ? Math.round((todayPresent / todayTotalAttendance) * 100) : 100;

  // 6. Debtors and Monthly Revenue
  let debtorsCount = 0;
  let totalDebtAmount = 0;
  allStudents.forEach((student) => {
    if (student.status === 'ACTIVE') {
      const fin = getStudentFinancials(student.id, currentMonth);
      if (fin.debtThisMonth > 0) {
        debtorsCount++;
        totalDebtAmount += fin.debtThisMonth;
      }
    }
  });

  const monthlyPayments = db.payments.filter((p) => p.forMonth === currentMonth);
  const currentMonthRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // 7. Monthly Revenue Chart (Last 6 months)
  const monthlyRevenueChart: { month: string; monthName: string; revenue: number }[] = [];
  const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.toISOString().slice(0, 7);
    const rev = db.payments
      .filter((p) => p.forMonth === mStr)
      .reduce((acc, p) => acc + p.amount, 0);

    monthlyRevenueChart.push({
      month: mStr,
      monthName: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
      revenue: rev,
    });
  }

  // 8. New Students Growth Chart (Last 6 months)
  const studentGrowthChart: { month: string; monthName: string; newStudents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.toISOString().slice(0, 7);
    const count = db.students.filter((s) => s.createdAt.startsWith(mStr) && !s.deletedAt).length;

    studentGrowthChart.push({
      month: mStr,
      monthName: `${monthNames[d.getMonth()]}`,
      newStudents: count,
    });
  }

  // 9. Attendance breakdown (Present, Absent, Excused)
  const totalAttRecords = db.attendance.length;
  const overallPresent = db.attendance.filter((a) => a.status === 'PRESENT').length;
  const overallAbsent = db.attendance.filter((a) => a.status === 'ABSENT').length;
  const overallExcused = db.attendance.filter((a) => a.status === 'EXCUSED').length;

  const attendanceChart = [
    { name: 'Keldi', count: overallPresent, color: '#10B981' },
    { name: 'Kelmadi', count: overallAbsent, color: '#EF4444' },
    { name: 'Sababli', count: overallExcused, color: '#F59E0B' },
  ];

  // 10. Students by Group / Course
  const studentsByCourse = db.courses
    .filter((c) => !c.deletedAt)
    .map((c) => {
      const count = db.students.filter(
        (s) => s.courseId === c.id && !s.deletedAt && s.status === 'ACTIVE'
      ).length;
      return {
        courseName: c.name,
        count,
      };
    })
    .filter((c) => c.count > 0);

  // 11. Recent Activities
  const recentActivities = db.auditLogs.slice(0, 6);

  return res.json({
    success: true,
    data: {
      metrics: {
        totalStudents,
        activeStudents,
        totalGroups,
        totalTeachers,
        todayLessonsCount,
        todayAttendanceRate,
        todayAttendanceCount: todayTotalAttendance,
        debtorsCount,
        totalDebtAmount,
        currentMonthRevenue,
        currentMonth,
      },
      charts: {
        monthlyRevenue: monthlyRevenueChart,
        studentGrowth: studentGrowthChart,
        attendanceBreakdown: attendanceChart,
        studentsByCourse,
      },
      todayLessons,
      recentActivities,
    },
  });
});
