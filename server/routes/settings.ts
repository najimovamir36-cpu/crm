import { Router } from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { telegramService } from '../services/telegramService.js';

export const settingsRouter = Router();

// GET /api/settings/telegram
settingsRouter.get('/telegram', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const config = telegramService.getConfig();
  return res.json({ success: true, config });
});

// POST /api/settings/telegram
settingsRouter.post('/telegram', requireAuth, requireRole(['SUPER_ADMIN']), (req: AuthRequest, res) => {
  const { botToken, adminChatId, enabled, sendPasswordInTelegram } = req.body;

  telegramService.updateConfig({
    botToken: botToken !== undefined ? botToken.trim() : undefined,
    adminChatId: adminChatId !== undefined ? adminChatId.trim() : undefined,
    enabled: enabled !== undefined ? Boolean(enabled) : undefined,
    sendPasswordInTelegram: sendPasswordInTelegram !== undefined ? Boolean(sendPasswordInTelegram) : undefined,
  });

  const updatedRaw = telegramService.getRawConfig();
  db.telegramSettings.botToken = updatedRaw.botToken;
  db.telegramSettings.adminChatId = updatedRaw.adminChatId;
  db.telegramSettings.enabled = updatedRaw.enabled;
  db.telegramSettings.sendPasswordInTelegram = updatedRaw.sendPasswordInTelegram;
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'SuperAdmin',
    userRole: req.user?.role || 'SUPER_ADMIN',
    action: 'Telegram Bot sozlamalari yangilandi',
    entity: 'TelegramSettings',
    details: { enabled: updatedRaw.enabled, sendPassword: updatedRaw.sendPasswordInTelegram },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({
    success: true,
    message: 'Telegram sozlamalari muvaffaqiyatli saqlandi',
    config: telegramService.getConfig(),
  });
});

// POST /api/settings/telegram/test-ping
settingsRouter.post('/telegram/test-ping', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res) => {
  const { chatId } = req.body;
  const result = await telegramService.sendTestPing(chatId);

  if (result.success) {
    return res.json({ success: true, message: 'Test xabari Telegramga muvaffaqiyatli yuborildi!' });
  } else {
    return res.status(400).json({ success: false, error: result.error || 'Telegram xabarini yuborishda xatolik yuz berdi' });
  }
});

// GET /api/settings/backup/download - Download database backup JSON
settingsRouter.get('/backup/download', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const backup = db.createBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="educenter_crm_backup_${new Date().toISOString().slice(0, 10)}.json"`);
  return res.send(backup.jsonDump);
});

// POST /api/settings/backup/restore - Restore database from JSON
settingsRouter.post('/backup/restore', requireAuth, requireRole(['SUPER_ADMIN']), (req: AuthRequest, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ success: false, error: 'Zaxira ma’lumotlari yuborilmadi' });
  }

  const success = db.restoreBackup(typeof data === 'string' ? data : JSON.stringify(data));
  if (success) {
    db.logAudit({
      userId: req.user?.id,
      userName: req.user?.fullName || 'SuperAdmin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'Baza zaxira nusxadan tiklandi (Database Restored)',
      entity: 'Database',
      ipAddress: req.ip || req.socket.remoteAddress,
    });
    return res.json({ success: true, message: 'Ma’lumotlar bazasi zaxira nusxadan muvaffaqiyatli tiklandi' });
  } else {
    return res.status(400).json({ success: false, error: 'Zaxira nusxani tiklashda xatolik yuz berdi' });
  }
});
