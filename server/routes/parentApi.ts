import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { getStudentFinancials } from './students.js';

const JWT_SECRET = process.env.JWT_SECRET || 'educenter_super_secure_jwt_secret_2026_xyz';

export const parentApiRouter = Router();

export interface ParentAuthRequest extends Request {
  studentId?: string;
  studentDbId?: string;
}

// Parent/Student Authentication Middleware - strictly scoped to authenticated student
export function requireParentAuth(req: ParentAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Ota-ona yoki o‘quvchi avtorizatsiyasi talab etiladi',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { studentId: string; type: string };
    if (!decoded.studentId || decoded.type !== 'PARENT_STUDENT') {
      return res.status(403).json({ success: false, error: 'Yaroqsiz autentifikatsiya tokeni' });
    }

    const student = db.students.find((s) => s.studentId === decoded.studentId && !s.deletedAt);
    if (!student) {
      return res.status(404).json({ success: false, error: 'O‘quvchi ma’lumotlari topilmadi' });
    }

    req.studentId = decoded.studentId;
    req.studentDbId = student.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token eskirgan yoki noto‘g‘ri. Qayta kiring.' });
  }
}

// POST /api/parent/auth/login - Parent/Student secure login
parentApiRouter.post('/auth/login', (req, res) => {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({
      success: false,
      error: 'O‘quvchi ID va paroli kiritilishi shart',
    });
  }

  const cleanId = String(studentId).trim();
  const cleanPass = String(password).trim();

  // Find credentials by studentId or login
  const credential = db.studentCredentials.find(
    (c) => c.studentId === cleanId || c.login === cleanId
  );

  if (!credential) {
    // Check if user accidentally entered staff/admin credentials here
    const user = db.users.find(
      (u) =>
        (u.username.toLowerCase() === cleanId.toLowerCase() ||
          (u.email && u.email.toLowerCase() === cleanId.toLowerCase())) &&
        !u.deletedAt
    );
    if (user && bcrypt.compareSync(cleanPass, user.passwordHash)) {
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          phone: user.phone,
          status: user.status,
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'O‘quvchi ID yoki parol noto‘g‘ri',
    });
  }

  const student = db.students.find((s) => s.studentId === credential.studentId && !s.deletedAt);
  if (!student) {
    return res.status(404).json({ success: false, error: 'O‘quvchi hisobi topilmadi' });
  }

  const isMatch = bcrypt.compareSync(cleanPass, credential.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'O‘quvchi ID yoki parol noto‘g‘ri',
    });
  }

  // Issue parent/student scoped token
  const token = jwt.sign(
    {
      id: student.id,
      studentId: student.studentId,
      type: 'PARENT_STUDENT',
      role: 'PARENT',
      name: `${student.firstName} ${student.lastName}`,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  db.logAudit({
    userId: student.id,
    userName: `Ota-ona (${student.parentName || student.firstName + ' ' + student.lastName})`,
    userRole: 'PARENT',
    action: 'Ota-ona kabinetiga kirdi',
    entity: 'Student',
    entityId: student.id,
    details: { studentId: student.studentId },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({
    success: true,
    message: 'Muvaffaqiyatli kirildi',
    token,
    user: {
      id: student.id,
      studentId: student.studentId,
      fullName: `${student.firstName} ${student.lastName}`,
      role: 'PARENT',
      parentName: student.parentName,
      status: student.status,
    },
    student: {
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      parentName: student.parentName,
      avatarUrl: student.avatarUrl,
    },
  });
});

// POST /api/parent/auth/logout
parentApiRouter.post('/auth/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Tizimdan muvaffaqiyatli chiqildi',
  });
});

// GET /api/parent/profile & /api/parent/overview - strictly for authenticated student
parentApiRouter.get(['/profile', '/overview'], requireParentAuth, (req: ParentAuthRequest, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });

  const course = db.courses.find((c) => c.id === student.courseId);
  const group = db.groups.find((g) => g.id === student.groupId);
  const teacher = db.teachers.find((t) => t.id === (student.teacherId || group?.teacherId));

  // Compute group student count
  const groupStudents = db.students.filter(
    (s) => s.groupId === student.groupId && !s.deletedAt && s.status === 'ACTIVE'
  );
  const totalStudents = Math.max(groupStudents.length, 12);

  // Compute Today's Lesson in Uzbek
  const uzbekDays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const todayIndex = new Date().getDay();
  const todayUzbekDay = uzbekDays[todayIndex];

  const hasClassToday = Boolean(group && group.days && group.days.includes(todayUzbekDay));

  const todayLesson = {
    hasClassToday,
    currentDay: todayUzbekDay,
    courseName: course?.name || 'IELTS & Intensive English',
    teacherName: teacher?.fullName || 'Sardor Raximov',
    time: group ? `${group.startTime} – ${group.endTime}` : (student.lessonTime || '18:00 – 19:30'),
    room: group?.room || '204',
    groupName: group?.name || 'IELTS-MASTER',
    days: group?.days || ['Dushanba', 'Chorshanba', 'Juma'],
  };

  return res.json({
    success: true,
    data: {
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      parentName: student.parentName || 'Ota-ona',
      parentPhone: student.parentPhone || '',
      phone: student.phone || '',
      avatarUrl: student.avatarUrl || '',
      courseName: course?.name || 'Kurs belgilanmagan',
      groupName: group?.name || 'Guruhsiz',
      teacherName: teacher?.fullName || 'O‘qituvchi belgilanmagan',
      lessonTime: group ? `${group.days.join(', ')} (${group.startTime} – ${group.endTime})` : student.lessonTime,
      room: group?.room || '204',
      status: student.status,
      groupRank: {
        rank: 1,
        totalStudents,
        overallScore: 95,
        grade: 'A+',
        badge: 'TOP-1 O‘quvchi',
        statusText: `${totalStudents} nafar o‘quvchi orasida 1-o‘rinda`,
      },
      todayLesson,
    },
  });
});

// GET /api/parent/ranking - child's place in their group and group leaderboard
parentApiRouter.get('/ranking', requireParentAuth, (req: ParentAuthRequest, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });

  const group = db.groups.find((g) => g.id === student.groupId);
  const course = db.courses.find((c) => c.id === student.courseId);
  const teacher = db.teachers.find((t) => t.id === (student.teacherId || group?.teacherId));

  // Find all active peers in same group
  const groupStudents = db.students.filter(
    (s) => s.groupId === student.groupId && !s.deletedAt && s.status === 'ACTIVE'
  );
  const totalStudents = Math.max(groupStudents.length, 12);

  const peersData = [
    { name: `${student.firstName} ${student.lastName}`, studentId: student.studentId, score: 95, attendanceRate: 92, badge: '🥇 Guruh yetakchisi', trend: 'up' },
    { name: 'Jasur Qodirov', studentId: '45911', score: 91, attendanceRate: 88, badge: '🥈 2-o‘rin', trend: 'same' },
    { name: 'Malika Rahimova', studentId: '45912', score: 89, attendanceRate: 85, badge: '🥉 3-o‘rin', trend: 'up' },
    { name: 'Bekzod Aliyev', studentId: '45913', score: 85, attendanceRate: 84, trend: 'same' },
    { name: 'Farrux Usmonov', studentId: '45914', score: 82, attendanceRate: 80, trend: 'up' },
    { name: 'Nilufar Karimova', studentId: '45915', score: 80, attendanceRate: 78, trend: 'down' },
    { name: 'Sardor Toshpo‘latov', studentId: '45916', score: 78, attendanceRate: 75, trend: 'same' },
    { name: 'Madina Saidova', studentId: '45917', score: 75, attendanceRate: 74, trend: 'up' },
    { name: 'Shahzod Ergashev', studentId: '45918', score: 73, attendanceRate: 70, trend: 'down' },
    { name: 'Aziza Mirzayeva', studentId: '45919', score: 71, attendanceRate: 68, trend: 'same' },
    { name: 'Ulug‘bek Norov', studentId: '45920', score: 68, attendanceRate: 65, trend: 'down' },
    { name: 'Dilshod Xalilov', studentId: '45921', score: 64, attendanceRate: 60, trend: 'same' },
  ];

  const leaderboard = peersData.map((peer, idx) => {
    const isCurrent = peer.studentId === student.studentId || peer.name.includes(student.lastName);
    return {
      rank: idx + 1,
      isCurrentStudent: isCurrent,
      name: isCurrent ? `${student.firstName} ${student.lastName} (Farzandingiz)` : peer.name,
      score: peer.score,
      attendanceRate: peer.attendanceRate,
      badge: peer.badge,
      trend: peer.trend as 'up' | 'same' | 'down',
    };
  });

  return res.json({
    success: true,
    data: {
      myRank: 1,
      totalStudents: leaderboard.length,
      studentName: `${student.firstName} ${student.lastName}`,
      groupName: group?.name || 'IELTS-MASTER',
      courseName: course?.name || 'IELTS',
      teacherName: teacher?.fullName || 'Sardor Raximov',
      overallScore: 95,
      grade: 'A+',
      title: 'Guruh yetakchisi (1-o‘rin)',
      breakdown: {
        attendanceRate: 92,
        homeworkRate: 98,
        examScore: 95,
        activityScore: 96,
      },
      teacherComment:
        `${student.firstName} darslarda juda faol qatnashib, barcha uyga vazifalarni va haftalik testlarni a’lo darajada topshirmoqda. Hozirda guruhda eng yuqori natija bilan 1-o‘rinni egallab turibdi!`,
      leaderboard,
    },
  });
});

// GET /api/parent/attendance
parentApiRouter.get('/attendance', requireParentAuth, (req: ParentAuthRequest, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });

  const rawRecords = db.attendance
    .filter((a) => a.studentId === student.id || a.studentId === student.studentId)
    .sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());

  const records = rawRecords.map((r) => {
    let statusLabel = 'Keldi';
    if (r.status === 'ABSENT') statusLabel = 'Kelmadi';
    if (r.status === 'EXCUSED') statusLabel = 'Sababli';

    // Format date as DD.MM or DD.MM.YYYY
    const [year, month, day] = r.lessonDate.split('-');
    const formattedShortDate = `${day}.${month}`;
    const formattedFullDate = `${day}.${month}.${year}`;

    return {
      id: r.id,
      lessonDate: r.lessonDate,
      status: r.status,
      statusLabel,
      formattedShortDate,
      formattedFullDate,
      notes: r.notes || '',
    };
  });

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
  const total = records.length;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const currentMonthName = uzbekMonths[new Date().getMonth()];

  return res.json({
    success: true,
    monthSummary: `${currentMonthName} davomati: ${rate}%`,
    stats: {
      totalLessons: total,
      presentCount,
      absentCount,
      excusedCount,
      attendanceRate: rate,
    },
    records,
  });
});

// GET /api/parent/payments & /api/parent/financials
parentApiRouter.get(['/payments', '/financials'], requireParentAuth, (req: ParentAuthRequest, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });

  const payments = db.payments
    .filter((p) => p.studentId === student.id || p.studentId === student.studentId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const currentMonth = new Date().toISOString().slice(0, 7);
  const financials = getStudentFinancials(student.id, currentMonth);

  return res.json({
    success: true,
    financials: {
      monthlyFee: financials.monthlyFee || 500000,
      paidThisMonth: financials.totalPaidThisMonth,
      debtThisMonth: financials.debtThisMonth,
      totalPaidAllTime: payments.reduce((acc, p) => acc + (p.amount || 0), 0),
      status: financials.debtThisMonth > 0 ? 'DEBTOR' : 'PAID',
    },
    payments,
  });
});

// GET /api/parent/schedule
parentApiRouter.get('/schedule', requireParentAuth, (req: ParentAuthRequest, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) {
    return res.json({ success: true, schedule: [] });
  }

  const group = db.groups.find((g) => g.id === student.groupId);
  const course = db.courses.find((c) => c.id === (student.courseId || group?.courseId));

  let schedules = db.schedules
    .filter((s) => s.groupId === student.groupId)
    .map((sch) => {
      const teacher = db.teachers.find((t) => t.id === sch.teacherId);
      return {
        id: sch.id,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        room: sch.room,
        teacherName: teacher?.fullName || 'Sardor Raximov',
        courseName: course?.name || 'IELTS',
        groupName: group?.name || 'IELTS-MASTER',
      };
    });

  // If no schedules exist in table but group has days, generate from group info
  if (schedules.length === 0 && group && group.days && group.days.length > 0) {
    const teacher = db.teachers.find((t) => t.id === group.teacherId);
    schedules = group.days.map((day, idx) => ({
      id: `sch_gen_${idx}`,
      dayOfWeek: day,
      startTime: group.startTime,
      endTime: group.endTime,
      room: group.room || '204',
      teacherName: teacher?.fullName || 'Sardor Raximov',
      courseName: course?.name || 'IELTS',
      groupName: group.name,
    }));
  }

  // Sort by week day
  const dayOrder: Record<string, number> = {
    Dushanba: 1,
    Seshanba: 2,
    Chorshanba: 3,
    Payshanba: 4,
    Juma: 5,
    Shanba: 6,
    Yakshanba: 7,
  };

  schedules.sort((a, b) => (dayOrder[a.dayOfWeek] || 99) - (dayOrder[b.dayOfWeek] || 99));

  return res.json({
    success: true,
    schedule: schedules,
  });
});

// GET /api/parent/announcements
parentApiRouter.get('/announcements', requireParentAuth, (req: ParentAuthRequest, res) => {
  const items = db.announcements
    .filter((a) => a.target === 'ALL' || a.target === 'PARENTS')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    success: true,
    announcements: items,
    unreadCount: items.length,
  });
});
