import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserRole, User } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'educenter_super_secure_jwt_secret_2026_xyz';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Tizimga kirish talab etiladi (Token topilmadi)',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.type === 'PARENT_STUDENT' || decoded.role === 'PARENT') {
      const student = db.students.find((s) => s.studentId === decoded.studentId && !s.deletedAt);
      if (!student) {
        return res.status(401).json({
          success: false,
          error: 'O‘quvchi hisobi topilmadi',
        });
      }

      req.user = {
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        username: student.studentId,
        passwordHash: '',
        role: 'PARENT' as any,
        phone: student.phone || student.parentPhone || '',
        status: student.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };
      return next();
    }

    const user = db.users.find((u) => u.id === decoded.id && !u.deletedAt);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Foydalanuvchi hisobi topilmadi',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Ushbu hisob faolsizlantirilgan. Administratorga murojaat qiling.',
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: 'Token yaroqsiz yoki muddati o‘tgan. Qayta login qiling.',
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiyadan o‘tilmagan' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Ruxsat berilmagan. Ushbu amal faqat quyidagi rollar uchun ruxsat etilgan: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
