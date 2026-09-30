import { Router } from 'express';
import { db, Announcement } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';

export const announcementsRouter = Router();

// GET /api/announcements - get announcements
announcementsRouter.get('/', (req, res) => {
  const target = req.query.target as string;
  let items = [...db.announcements];

  if (target) {
    items = items.filter((a) => a.target === 'ALL' || a.target === target);
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    success: true,
    data: items,
  });
});

// POST /api/announcements - create announcement
announcementsRouter.post(
  '/',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  (req: AuthRequest, res) => {
    const { title, content, target = 'ALL', priority = 'NORMAL' } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Sarlavha va matn kiritilishi shart',
      });
    }

    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      content: content.trim(),
      target,
      priority,
      authorName: req.user?.fullName || 'Administrator',
      createdAt: new Date().toISOString(),
    };

    db.announcements.unshift(newAnnouncement);
    db.save();

    db.logAudit({
      userId: req.user?.id,
      userName: req.user?.fullName || 'Admin',
      userRole: req.user?.role || 'ADMIN',
      action: 'Yangi e’lon yaratdi',
      entity: 'Announcement',
      entityId: newAnnouncement.id,
      details: { title: newAnnouncement.title, target: newAnnouncement.target },
    });

    return res.status(201).json({
      success: true,
      message: 'E’lon muvaffaqiyatli chop etildi',
      announcement: newAnnouncement,
    });
  }
);

// DELETE /api/announcements/:id - delete announcement
announcementsRouter.delete(
  '/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  (req: AuthRequest, res) => {
    const { id } = req.params;
    const index = db.announcements.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'E’lon topilmadi',
      });
    }

    const removed = db.announcements.splice(index, 1)[0];
    db.save();

    db.logAudit({
      userId: req.user?.id,
      userName: req.user?.fullName || 'Admin',
      userRole: req.user?.role || 'ADMIN',
      action: 'E’lonni o‘chirdi',
      entity: 'Announcement',
      entityId: id,
      details: { title: removed.title },
    });

    return res.json({
      success: true,
      message: 'E’lon o‘chirildi',
    });
  }
);
