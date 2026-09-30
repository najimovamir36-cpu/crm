import { Router } from 'express';
import { db, Teacher } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

export const teachersRouter = Router();

// GET /api/teachers
teachersRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const teachers = db.teachers.filter((t) => !t.deletedAt);

  const enriched = teachers.map((teacher) => {
    const activeGroups = db.groups.filter((g) => g.teacherId === teacher.id && !g.deletedAt);
    const groupIds = activeGroups.map((g) => g.id);
    const activeStudents = db.students.filter(
      (s) => s.groupId && groupIds.includes(s.groupId) && !s.deletedAt && s.status === 'ACTIVE'
    );

    return {
      ...teacher,
      groupsCount: activeGroups.length,
      studentsCount: activeStudents.length,
      groups: activeGroups.map((g) => ({ id: g.id, name: g.name })),
    };
  });

  return res.json({ success: true, data: enriched });
});

// POST /api/teachers
teachersRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const { fullName, phone, specialty, subject, bio, salaryRate } = req.body;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ success: false, error: 'O‘qituvchi ismi kiritilishi shart' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, error: 'Telefon raqam kiritilishi shart' });
  }

  const spec = (specialty || subject || 'Umumiy').trim();

  const newTeacher: Teacher = {
    id: `tch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fullName: fullName.trim(),
    phone: phone.trim(),
    specialty: spec,
    bio: bio ? bio.trim() : '',
    salaryRate: Number(salaryRate) || 50,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.teachers.push(newTeacher);
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Yangi o‘qituvchi qo‘shildi',
    entity: 'Teacher',
    entityId: newTeacher.id,
    details: { fullName: newTeacher.fullName, specialty: newTeacher.specialty },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.status(201).json({ success: true, teacher: newTeacher });
});

// PATCH /api/teachers/:id
teachersRouter.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const teacher = db.teachers.find((t) => t.id === id && !t.deletedAt);

  if (!teacher) {
    return res.status(404).json({ success: false, error: 'O‘qituvchi topilmadi' });
  }

  const { fullName, phone, specialty, bio, salaryRate, status } = req.body;
  if (fullName !== undefined) teacher.fullName = fullName.trim();
  if (phone !== undefined) teacher.phone = phone.trim();
  if (specialty !== undefined) teacher.specialty = specialty.trim();
  if (bio !== undefined) teacher.bio = bio.trim();
  if (salaryRate !== undefined) teacher.salaryRate = Number(salaryRate);
  if (status !== undefined) teacher.status = status;

  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'O‘qituvchi ma’lumotlari yangilandi',
    entity: 'Teacher',
    entityId: teacher.id,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({ success: true, teacher });
});

// DELETE /api/teachers/:id
teachersRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const teacher = db.teachers.find((t) => t.id === id && !t.deletedAt);

  if (!teacher) {
    return res.status(404).json({ success: false, error: 'O‘qituvchi topilmadi' });
  }

  teacher.deletedAt = new Date().toISOString();
  teacher.status = 'INACTIVE';
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'O‘qituvchi o‘chirildi',
    entity: 'Teacher',
    entityId: teacher.id,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({ success: true, message: 'O‘qituvchi muvaffaqiyatli arxivlandi' });
});
