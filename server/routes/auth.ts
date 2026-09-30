import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'educenter_super_secure_jwt_secret_2026_xyz';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Login va parol kiritilishi shart',
    });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  // Find user by username, email or alias
  let user = db.users.find(
    (u) =>
      (u.username.toLowerCase() === cleanUsername ||
        (u.email && u.email.toLowerCase() === cleanUsername)) &&
      !u.deletedAt
  );

  // If user entered user's email or common variations of Amir Temur / superadmin
  if (
    !user &&
    (cleanUsername === 'amirtemurnajimov@gmail.com' ||
      cleanUsername === 'najimovamir36@gmail.com' ||
      cleanUsername === 'najimovamir36-cpu' ||
      cleanUsername === 'amir temur' ||
      cleanUsername === 'amirtemur')
  ) {
    user = db.users.find((u) => u.role === 'SUPER_ADMIN' && !u.deletedAt);
  }

  if (user) {
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Ushbu profil faolsizlantirilgan. Administrator bilan bog‘laning.',
      });
    }

    const isMatch = bcrypt.compareSync(cleanPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Login yoki parol noto‘g‘ri',
      });
    }

    const token = generateToken(user);

    db.logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'Tizimga kirdi (Login)',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
    });

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

  // Fallback: If user entered student ID or parent login in the general login form
  const credential = db.studentCredentials.find(
    (c) => c.studentId.toLowerCase() === cleanUsername || c.login.toLowerCase() === cleanUsername
  );

  if (credential) {
    const isMatch = bcrypt.compareSync(cleanPassword, credential.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Login yoki parol noto‘g‘ri',
      });
    }

    const student = db.students.find((s) => s.studentId === credential.studentId && !s.deletedAt);
    if (student) {
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
        action: 'Ota-ona kabinetiga kirdi (Login)',
        entity: 'Student',
        entityId: student.id,
        ipAddress: req.ip || req.socket.remoteAddress,
      });

      return res.json({
        success: true,
        token,
        user: {
          id: student.id,
          fullName: `${student.firstName} ${student.lastName} (Ota-ona)`,
          username: student.studentId,
          role: 'PARENT',
          phone: student.parentPhone || student.phone || '',
          status: 'ACTIVE',
        },
        isParent: true,
      });
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Login yoki parol noto‘g‘ri. Iltimos tekshirib qaytadan kiriting.',
  });
});

// POST /api/auth/google - Authenticate or link Google Firebase user
authRouter.post('/google', async (req, res) => {
  const { email, displayName, uid } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Google email kiritilishi shart' });
  }

  // Find existing user by username or email
  let user = db.users.find((u) => u.username.toLowerCase() === email.toLowerCase() && !u.deletedAt);

  if (!user) {
    // Check if it's the owner/admin
    const isOwner = ['najimovamir36@gmail.com', 'amirtemurnajimov@gmail.com'].includes(email.toLowerCase());
    const role = isOwner ? 'SUPER_ADMIN' : 'ADMIN';

    // Check if superadmin exists to associate
    const superadmin = db.users.find((u) => u.role === 'SUPER_ADMIN' && !u.deletedAt);
    if (isOwner && superadmin) {
      user = superadmin;
    } else {
      user = {
        id: `usr_g_${uid || Date.now()}`,
        fullName: displayName || email.split('@')[0],
        username: email,
        passwordHash: '',
        role: role as any,
        phone: '',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(user);
      db.save();
    }
  }

  const token = generateToken(user);

  db.logAudit({
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    action: 'Google orqali kirdi (Google Firebase Auth)',
    entity: 'User',
    entityId: user.id,
    details: { email },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

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
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Avtorizatsiya talab etiladi' });
  }

  return res.json({
    success: true,
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      username: req.user.username,
      role: req.user.role,
      phone: req.user.phone,
      status: req.user.status,
    },
  });
});
