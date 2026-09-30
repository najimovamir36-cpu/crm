import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, User, UserRole } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

export const usersRouter = Router();

// GET /api/users - Super Admin & Admin
usersRouter.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const users = db.users
    .filter((u) => !u.deletedAt)
    .map((u) => ({
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      role: u.role,
      phone: u.phone,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

  return res.json({ success: true, data: users });
});

// POST /api/users - Create new staff user
usersRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const { fullName, username, password, role, phone } = req.body;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ success: false, error: 'Ism va familiya kiritilishi shart' });
  }
  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, error: 'Login kiritilishi shart' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Parol kamida 6 belgidan iborat bo‘lishi shart' });
  }
  if (!role || !['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'TEACHER'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Noto‘g‘ri rol tanlandi' });
  }

  // Check unique username
  const exists = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && !u.deletedAt
  );
  if (exists) {
    return res.status(400).json({ success: false, error: 'Ushbu login band. Boshqa login tanlang.' });
  }

  const now = new Date().toISOString();
  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fullName: fullName.trim(),
    username: username.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: role as UserRole,
    phone: phone ? phone.trim() : '',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(newUser);
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'SuperAdmin',
    userRole: req.user?.role || 'SUPER_ADMIN',
    action: 'Yangi foydalanuvchi/admin yaratildi',
    entity: 'User',
    entityId: newUser.id,
    details: { username: newUser.username, role: newUser.role, fullName: newUser.fullName },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      username: newUser.username,
      role: newUser.role,
      phone: newUser.phone,
      status: newUser.status,
    },
  });
});

// PATCH /api/users/:id
usersRouter.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const user = db.users.find((u) => u.id === id && !u.deletedAt);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
  }

  const { fullName, role, phone, status, password } = req.body;

  if (fullName !== undefined) user.fullName = fullName.trim();
  if (role !== undefined && ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'TEACHER'].includes(role)) {
    user.role = role as UserRole;
  }
  if (phone !== undefined) user.phone = phone.trim();
  if (status !== undefined && ['ACTIVE', 'INACTIVE'].includes(status)) {
    user.status = status;
  }
  if (password && password.trim().length >= 6) {
    user.passwordHash = bcrypt.hashSync(password.trim(), 10);
  }

  user.updatedAt = new Date().toISOString();
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'SuperAdmin',
    userRole: req.user?.role || 'SUPER_ADMIN',
    action: 'Foydalanuvchi tahrirlandi',
    entity: 'User',
    entityId: user.id,
    details: { username: user.username, role: user.role, status: user.status },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      phone: user.phone,
      status: user.status,
    },
  });
});

// DELETE /api/users/:id
usersRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  if (id === req.user?.id) {
    return res.status(400).json({ success: false, error: 'O‘z hisobingizni o‘chira olmaysiz' });
  }

  const user = db.users.find((u) => u.id === id && !u.deletedAt);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
  }

  user.deletedAt = new Date().toISOString();
  user.status = 'INACTIVE';
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'SuperAdmin',
    userRole: req.user?.role || 'SUPER_ADMIN',
    action: 'Foydalanuvchi o‘chirildi',
    entity: 'User',
    entityId: user.id,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({ success: true, message: 'Foydalanuvchi muvaffaqiyatli o‘chirildi' });
});
