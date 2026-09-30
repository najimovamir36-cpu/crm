import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

export const auditRouter = Router();

// GET /api/audit
auditRouter.get('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 30);
  const search = ((req.query.search as string) || '').trim().toLowerCase();

  let list = db.auditLogs;

  if (search) {
    list = list.filter(
      (log) =>
        log.userName.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.entity.toLowerCase().includes(search) ||
        (log.entityId && log.entityId.toLowerCase().includes(search))
    );
  }

  const total = list.length;
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return res.json({
    success: true,
    data: paginated,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});
