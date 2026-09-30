import { Router } from 'express';
import { db, Course } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

export const coursesRouter = Router();

// GET /api/courses
coursesRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const courses = db.courses.filter((c) => !c.deletedAt);

  const enriched = courses.map((course) => {
    const groupsCount = db.groups.filter((g) => g.courseId === course.id && !g.deletedAt).length;
    const studentsCount = db.students.filter((s) => s.courseId === course.id && !s.deletedAt && s.status === 'ACTIVE').length;
    return {
      ...course,
      groupsCount,
      studentsCount,
    };
  });

  return res.json({ success: true, data: enriched });
});

// POST /api/courses
coursesRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const { name, description, durationMonths, monthlyFee, price, startDate, endDate, startMonth, endMonth } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Kurs nomi kiritilishi shart' });
  }

  const fee = Number(monthlyFee !== undefined ? monthlyFee : price) || 0;
  const duration = Number(durationMonths) || 1;

  const newCourse: any = {
    id: `crs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    description: description ? description.trim() : '',
    durationMonths: duration,
    monthlyFee: fee,
    startDate: startDate || startMonth || '',
    endDate: endDate || endMonth || '',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.courses.push(newCourse);
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Yangi kurs yaratildi',
    entity: 'Course',
    entityId: newCourse.id,
    details: { name: newCourse.name, fee: newCourse.monthlyFee },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.status(201).json({ success: true, course: newCourse });
});

// PATCH /api/courses/:id
coursesRouter.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const course = db.courses.find((c) => c.id === id && !c.deletedAt);

  if (!course) {
    return res.status(404).json({ success: false, error: 'Kurs topilmadi' });
  }

  const { name, description, durationMonths, monthlyFee, status } = req.body;
  if (name !== undefined) course.name = name.trim();
  if (description !== undefined) course.description = description.trim();
  if (durationMonths !== undefined) course.durationMonths = Number(durationMonths);
  if (monthlyFee !== undefined) course.monthlyFee = Number(monthlyFee);
  if (status !== undefined) course.status = status;

  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Kurs tahrirlandi',
    entity: 'Course',
    entityId: course.id,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({ success: true, course });
});

// DELETE /api/courses/:id
coursesRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const course = db.courses.find((c) => c.id === id && !c.deletedAt);

  if (!course) {
    return res.status(404).json({ success: false, error: 'Kurs topilmadi' });
  }

  course.deletedAt = new Date().toISOString();
  course.status = 'INACTIVE';
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Kurs o‘chirildi',
    entity: 'Course',
    entityId: course.id,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({ success: true, message: 'Kurs muvaffaqiyatli o‘chirildi' });
});
