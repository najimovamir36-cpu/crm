import { Router } from 'express';
import { db, Attendance, AttendanceStatus } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

export const attendanceRouter = Router();

// GET /api/attendance - get attendance for a group and date
attendanceRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const { groupId, date } = req.query;

  if (!groupId) {
    return res.status(400).json({ success: false, error: 'Guruh ID kiritilishi shart' });
  }

  const lessonDate = (date as string) || new Date().toISOString().slice(0, 10);

  const group = db.groups.find((g) => g.id === groupId && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: 'Guruh topilmadi' });
  }

  // If teacher, check access
  if (req.user?.role === 'TEACHER') {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile && group.teacherId !== teacherProfile.id) {
      return res.status(403).json({ success: false, error: 'Siz faqat o‘z guruhlaringiz davomatini ko‘ra olasiz' });
    }
  }

  const students = db.students.filter(
    (s) => s.groupId === groupId && !s.deletedAt && s.status === 'ACTIVE'
  );

  const existingAttendance = db.attendance.filter(
    (a) => a.groupId === groupId && a.lessonDate === lessonDate
  );

  const attendanceMap = new Map<string, Attendance>();
  existingAttendance.forEach((a) => attendanceMap.set(a.studentId, a));

  const records = students.map((s) => {
    const existing = attendanceMap.get(s.id) || attendanceMap.get(s.studentId);
    return {
      studentId: s.id,
      studentCode: s.studentId,
      fullName: `${s.firstName} ${s.lastName}`,
      status: (existing?.status as AttendanceStatus) || null,
      notes: existing?.notes || '',
    };
  });

  return res.json({
    success: true,
    groupId,
    groupName: group.name,
    date: lessonDate,
    students: records,
  });
});

// POST /api/attendance & POST /api/attendance/batch - mark attendance for group
const handleMarkAttendance = (req: AuthRequest, res: any) => {
  const { groupId, date, records } = req.body;

  if (!groupId || !date || !Array.isArray(records)) {
    return res.status(400).json({ success: false, error: 'Noto‘g‘ri ma’lumot formati' });
  }

  const group = db.groups.find((g) => g.id === groupId && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: 'Guruh topilmadi' });
  }

  // Teacher check
  if (req.user?.role === 'TEACHER') {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile && group.teacherId !== teacherProfile.id) {
      return res.status(403).json({ success: false, error: 'Faqat o‘z guruhingiz davomatini belgilay olasiz' });
    }
  }

  const now = new Date().toISOString();

  records.forEach((rec: { studentId: string; status: AttendanceStatus; notes?: string }) => {
    if (!rec.status) return;

    // Check if record exists for this student, group, date
    const existingIndex = db.attendance.findIndex(
      (a) => a.groupId === groupId && a.lessonDate === date && (a.studentId === rec.studentId)
    );

    if (existingIndex >= 0) {
      db.attendance[existingIndex].status = rec.status;
      db.attendance[existingIndex].notes = rec.notes || '';
      db.attendance[existingIndex].markedBy = req.user?.id;
    } else {
      db.attendance.push({
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId,
        studentId: rec.studentId,
        lessonDate: date,
        status: rec.status,
        notes: rec.notes || '',
        markedBy: req.user?.id,
        createdAt: now,
      });
    }
  });

  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'User',
    userRole: req.user?.role || 'TEACHER',
    action: 'Davomat belgilandi',
    entity: 'Attendance',
    entityId: groupId,
    details: { group: group.name, date, markedCount: records.length },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({
    success: true,
    message: 'Davomat muvaffaqiyatli saqlandi',
  });
};

attendanceRouter.post('/', requireAuth, handleMarkAttendance);
attendanceRouter.post('/batch', requireAuth, handleMarkAttendance);

// GET /api/attendance/stats - attendance overview
attendanceRouter.get('/stats', requireAuth, (req: AuthRequest, res) => {
  const today = new Date().toISOString().slice(0, 10);

  let groups = db.groups.filter((g) => !g.deletedAt);
  if (req.user?.role === 'TEACHER') {
    const teacherProfile = db.teachers.find(
      (t) => t.userId === req.user?.id || t.fullName === req.user?.fullName
    );
    if (teacherProfile) {
      groups = groups.filter((g) => g.teacherId === teacherProfile.id);
    } else {
      groups = [];
    }
  }

  const teacherGroupIds = new Set(groups.map((g) => g.id));
  const todayRecords = db.attendance.filter(
    (a) => a.lessonDate === today && (req.user?.role !== 'TEACHER' || teacherGroupIds.has(a.groupId))
  );

  const todayPresent = todayRecords.filter((a) => a.status === 'PRESENT').length;
  const todayAbsent = todayRecords.filter((a) => a.status === 'ABSENT').length;
  const todayExcused = todayRecords.filter((a) => a.status === 'EXCUSED').length;

  const totalMarkedToday = todayRecords.length;
  const todayRate = totalMarkedToday > 0 ? Math.round((todayPresent / totalMarkedToday) * 100) : 100;

  // Group by group breakdown
  const groupsStats = groups.map((g) => {
    const groupAttendance = db.attendance.filter((a) => a.groupId === g.id);
    const groupPresent = groupAttendance.filter((a) => a.status === 'PRESENT').length;
    const rate = groupAttendance.length > 0 ? Math.round((groupPresent / groupAttendance.length) * 100) : 100;
    return {
      groupId: g.id,
      groupName: g.name,
      totalChecked: groupAttendance.length,
      presentCount: groupPresent,
      attendanceRate: rate,
    };
  });

  return res.json({
    success: true,
    stats: {
      todayDate: today,
      todayMarked: totalMarkedToday,
      todayPresent,
      todayAbsent,
      todayExcused,
      todayRate,
      groups: groupsStats,
    },
  });
});
