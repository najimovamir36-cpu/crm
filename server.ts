import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import { authRouter } from './server/routes/auth.js';
import { studentsRouter } from './server/routes/students.js';
import { coursesRouter } from './server/routes/courses.js';
import { groupsRouter } from './server/routes/groups.js';
import { teachersRouter } from './server/routes/teachers.js';
import { attendanceRouter } from './server/routes/attendance.js';
import { paymentsRouter } from './server/routes/payments.js';
import { schedulesRouter } from './server/routes/schedules.js';
import { dashboardRouter } from './server/routes/dashboard.js';
import { reportsRouter } from './server/routes/reports.js';
import { usersRouter } from './server/routes/users.js';
import { auditRouter } from './server/routes/audit.js';
import { settingsRouter } from './server/routes/settings.js';
import { parentApiRouter } from './server/routes/parentApi.js';
import { announcementsRouter } from './server/routes/announcements.js';
import { db } from './server/db/database.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'educenter_super_secure_jwt_secret_2026_xyz';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Basic middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Strict Authorization: Block Parent/Student tokens from accessing internal CRM datasets
const forbidParentFromCrm = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type === 'PARENT_STUDENT' || decoded.role === 'PARENT') {
        return res.status(403).json({
          success: false,
          error: 'Ruxsat etilmagan: Ota-onalar faqat o‘z farzandining /api/parent kabinetidan foydalanishi mumkin.',
        });
      }
    } catch {
      // Let route's own auth middleware handle invalid/expired tokens
    }
  }
  next();
};

// API Routes (Mounted both with /api and without /api in case Vercel rewrites strip /api prefix)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/parent', parentApiRouter); // Dedicated Parent Portal API
app.use('/parent', parentApiRouter);

app.use('/api/students', forbidParentFromCrm, studentsRouter);
app.use('/students', forbidParentFromCrm, studentsRouter);

app.use('/api/courses', forbidParentFromCrm, coursesRouter);
app.use('/courses', forbidParentFromCrm, coursesRouter);

app.use('/api/groups', forbidParentFromCrm, groupsRouter);
app.use('/groups', forbidParentFromCrm, groupsRouter);

app.use('/api/teachers', forbidParentFromCrm, teachersRouter);
app.use('/teachers', forbidParentFromCrm, teachersRouter);

app.use('/api/attendance', forbidParentFromCrm, attendanceRouter);
app.use('/attendance', forbidParentFromCrm, attendanceRouter);

app.use('/api/payments', forbidParentFromCrm, paymentsRouter);
app.use('/payments', forbidParentFromCrm, paymentsRouter);

app.use('/api/schedules', forbidParentFromCrm, schedulesRouter);
app.use('/schedules', forbidParentFromCrm, schedulesRouter);

app.use('/api/dashboard', forbidParentFromCrm, dashboardRouter);
app.use('/dashboard', forbidParentFromCrm, dashboardRouter);

app.use('/api/reports', forbidParentFromCrm, reportsRouter);
app.use('/reports', forbidParentFromCrm, reportsRouter);

app.use('/api/users', forbidParentFromCrm, usersRouter);
app.use('/users', forbidParentFromCrm, usersRouter);

app.use('/api/audit', forbidParentFromCrm, auditRouter);
app.use('/audit', forbidParentFromCrm, auditRouter);

app.use('/api/settings', forbidParentFromCrm, settingsRouter);
app.use('/settings', forbidParentFromCrm, settingsRouter);

app.use('/api/announcements', announcementsRouter);
app.use('/announcements', announcementsRouter);

// System Reset endpoint: Clears all dummy records and resets to clean state
app.post(['/api/system/reset', '/system/reset'], (req, res) => {
  const seed = (db as any).generateSeedData();
  (db as any).data = seed;
  (db as any).save();
  res.json({ success: true, message: 'Barcha ma’lumotlar tozalandi' });
});

// Health check endpoint
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    system: 'EduCenter CRM Backend',
    timestamp: new Date().toISOString(),
  });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Global API error handler
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Serverda ichki xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.',
  });
});

// Mount Vite or serve static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduCenter CRM Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone server process when not running as a Vercel Serverless Function
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
export { app };
