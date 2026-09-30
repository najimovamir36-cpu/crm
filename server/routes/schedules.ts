import { Router } from 'express';
import { db, Schedule } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

export const schedulesRouter = Router();

// GET /api/schedules
schedulesRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const { teacherId, day } = req.query;

  let list = db.schedules;
  if (teacherId) {
    list = list.filter((s) => s.teacherId === teacherId);
  }
  if (day) {
    list = list.filter((s) => s.dayOfWeek.toLowerCase() === (day as string).toLowerCase());
  }

  const enriched = list.map((sch) => {
    const group = db.groups.find((g) => g.id === sch.groupId);
    const course = db.courses.find((c) => c.id === sch.courseId);
    const teacher = db.teachers.find((t) => t.id === sch.teacherId);
    const studentCount = group ? db.students.filter((s) => s.groupId === group.id && !s.deletedAt).length : 0;

    return {
      ...sch,
      groupName: group?.name || 'Guruhsiz',
      courseName: course?.name || 'Kurs nomi',
      teacherName: teacher?.fullName || 'O‘qituvchi',
      studentCount,
    };
  });

  return res.json({ success: true, data: enriched });
});

// POST /api/schedules
schedulesRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const { groupId, dayOfWeek, startTime, endTime, room } = req.body;

  const group = db.groups.find((g) => g.id === groupId && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: 'Guruh topilmadi' });
  }

  const newSchedule: Schedule = {
    id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    groupId,
    courseId: group.courseId,
    teacherId: group.teacherId,
    dayOfWeek: dayOfWeek || 'Dushanba',
    startTime: startTime || group.startTime,
    endTime: endTime || group.endTime,
    room: room || group.room,
    createdAt: new Date().toISOString(),
  };

  db.schedules.push(newSchedule);
  db.save();

  return res.status(201).json({ success: true, schedule: newSchedule });
});

// DELETE /api/schedules/:id
schedulesRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const index = db.schedules.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Dars jadvali bandi topilmadi' });
  }

  db.schedules.splice(index, 1);
  db.save();

  return res.json({ success: true, message: 'Dars jadvali bandi o‘chirildi' });
});
