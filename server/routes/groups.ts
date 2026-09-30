import { Router } from 'express';
import { db, Group, Schedule } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { getStudentFinancials } from './students.js';

export const groupsRouter = Router();

// GET /api/groups
groupsRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  let groups = db.groups.filter((g) => !g.deletedAt);

  // If TEACHER, only show their own groups
  if (req.user?.role === 'TEACHER') {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile) {
      groups = groups.filter((g) => g.teacherId === teacherProfile.id);
    } else {
      groups = [];
    }
  }

  const enriched = groups.map((g) => {
    const course = db.courses.find((c) => c.id === g.courseId);
    const teacher = db.teachers.find((t) => t.id === g.teacherId);
    const studentsInGroup = db.students.filter(
      (s) => s.groupId === g.id && !s.deletedAt && s.status === 'ACTIVE'
    );

    return {
      ...g,
      courseName: course?.name || 'Kurs mavjud emas',
      teacherName: teacher?.fullName || 'O‘qituvchi tayinlanmagan',
      studentCount: studentsInGroup.length,
    };
  });

  return res.json({ success: true, data: enriched });
});

// GET /api/groups/:id
groupsRouter.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const id = req.params.id;
  const group = db.groups.find((g) => g.id === id && !g.deletedAt);

  if (!group) {
    return res.status(404).json({ success: false, error: 'Guruh topilmadi' });
  }

  const course = db.courses.find((c) => c.id === group.courseId);
  const teacher = db.teachers.find((t) => t.id === group.teacherId);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const enrolledStudents = db.students
    .filter((s) => s.groupId === group.id && !s.deletedAt)
    .map((s) => {
      const financials = getStudentFinancials(s.id, currentMonth);
      return {
        ...s,
        monthlyFee: financials.monthlyFee,
        paidThisMonth: financials.totalPaidThisMonth,
        debtThisMonth: financials.debtThisMonth,
      };
    });

  // Recent attendance dates for this group
  const groupAttendance = db.attendance
    .filter((a) => a.groupId === group.id)
    .sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());

  return res.json({
    success: true,
    group: {
      ...group,
      courseName: course?.name,
      teacherName: teacher?.fullName,
      students: enrolledStudents,
      recentAttendanceCount: groupAttendance.length,
    },
  });
});

// POST /api/groups
groupsRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const {
    name,
    courseId,
    teacherId,
    startDate,
    endDate,
    days,
    startTime,
    endTime,
    room,
    maxStudents,
    monthlyFee,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Guruh nomi kiritilishi shart' });
  }
  if (!courseId) {
    return res.status(400).json({ success: false, error: 'Kurs tanlanishi shart' });
  }

  const course = db.courses.find((c) => c.id === courseId && !c.deletedAt);
  const teacher = teacherId ? db.teachers.find((t) => t.id === teacherId && !t.deletedAt) : null;

  const fee = monthlyFee !== undefined && monthlyFee !== null ? Number(monthlyFee) : (course?.monthlyFee || 0);

  const now = new Date().toISOString();
  const newGroupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const dayList = Array.isArray(days) && days.length > 0 ? days : ['Dushanba', 'Chorshanba', 'Juma'];

  const newGroup: Group = {
    id: newGroupId,
    name: name.trim(),
    courseId,
    teacherId: teacherId || '',
    startDate: startDate || now.slice(0, 10),
    endDate: endDate || '',
    days: dayList,
    startTime: startTime || '18:00',
    endTime: endTime || '19:30',
    room: room || 'Asosiy xona',
    maxStudents: Number(maxStudents) || 16,
    monthlyFee: fee,
    status: 'ACTIVE',
    createdAt: now,
  };

  db.groups.push(newGroup);

  // Auto-generate schedules for the days
  dayList.forEach((day: string) => {
    const scheduleEntry: Schedule = {
      id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      groupId: newGroupId,
      courseId,
      teacherId,
      dayOfWeek: day,
      startTime: newGroup.startTime,
      endTime: newGroup.endTime,
      room: newGroup.room,
      createdAt: now,
    };
    db.schedules.push(scheduleEntry);
  });

  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Yangi guruh ochildi',
    entity: 'Group',
    entityId: newGroupId,
    details: { name: newGroup.name, course: course?.name, teacher: teacher?.fullName },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.status(201).json({ success: true, group: newGroup });
});

// PATCH /api/groups/:id
groupsRouter.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const group = db.groups.find((g) => g.id === id && !g.deletedAt);

  if (!group) {
    return res.status(404).json({ success: false, error: 'Guruh topilmadi' });
  }

  const {
    name,
    courseId,
    teacherId,
    startDate,
    days,
    startTime,
    endTime,
    room,
    maxStudents,
    monthlyFee,
    status,
  } = req.body;

  if (name !== undefined) group.name = name.trim();
  if (courseId !== undefined) group.courseId = courseId;
  if (teacherId !== undefined) group.teacherId = teacherId;
  if (startDate !== undefined) group.startDate = startDate;
  if (days !== undefined && Array.isArray(days)) group.days = days;
  if (startTime !== undefined) group.startTime = startTime;
  if (endTime !== undefined) group.endTime = endTime;
  if (room !== undefined) group.room = room;
  if (maxStudents !== undefined) group.maxStudents = Number(maxStudents);
  if (monthlyFee !== undefined) group.monthlyFee = Number(monthlyFee);
  if (status !== undefined) group.status = status;

  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Guruh tahrirlandi',
    entity: 'Group',
    entityId: group.id,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({ success: true, group });
});

// DELETE /api/groups/:id
groupsRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const group = db.groups.find((g) => g.id === id && !g.deletedAt);

  if (!group) {
    return res.status(404).json({ success: false, error: 'Guruh topilmadi' });
  }

  group.deletedAt = new Date().toISOString();
  group.status = 'COMPLETED';
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Guruh o‘chirildi',
    entity: 'Group',
    entityId: group.id,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({ success: true, message: 'Guruh muvaffaqiyatli arxivlandi' });
});
