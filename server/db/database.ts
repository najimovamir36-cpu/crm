import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { generateUniqueStudentId } from '../services/studentIdGenerator.js';
import { generateStudentPassword } from '../services/passwordGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.resolve(__dirname, '../data');
const DB_FILE = isVercel ? path.join('/tmp', 'db.json') : path.join(DATA_DIR, 'db.json');
const SOURCE_DB_FILE = path.resolve(__dirname, '../data/db.json');

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'TEACHER';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Teacher {
  id: string;
  userId?: string | null;
  fullName: string;
  phone: string;
  specialty: string;
  bio?: string;
  salaryRate: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  durationMonths: number;
  monthlyFee: number;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Group {
  id: string;
  name: string;
  courseId: string;
  teacherId: string;
  startDate: string;
  endDate?: string;
  days: string[]; // e.g. ['Dushanba', 'Chorshanba', 'Juma']
  startTime: string; // '18:00'
  endTime: string; // '19:30'
  room: string;
  maxStudents: number;
  monthlyFee: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Student {
  id: string;
  studentId: string; // 5-7 digit high-entropy unique number
  firstName: string;
  lastName: string;
  phone: string;
  birthDate?: string;
  gender?: 'ERKAK' | 'AYOL' | 'BOSHQA';
  parentName?: string;
  parentPhone?: string;
  courseId?: string;
  groupId?: string;
  teacherId?: string;
  lessonTime?: string;
  notes?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'FROZEN' | 'LEFT';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface StudentCredential {
  studentId: string; // matches Student.studentId
  login: string; // matches studentId
  passwordHash: string;
  plainTempPasswordShownOnce?: string | null;
  isPasswordChanged: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface Attendance {
  id: string;
  groupId: string;
  studentId: string;
  lessonDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
  markedBy?: string; // userId
  createdAt: string;
}

export type PaymentType = 'CASH' | 'CARD' | 'BANK' | 'OTHER';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  forMonth: string; // YYYY-MM
  paymentType: PaymentType;
  receiptNumber?: string;
  notes?: string;
  recordedBy?: string; // userId or userName
  createdAt: string;
}

export interface Schedule {
  id: string;
  groupId: string;
  courseId: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  teachers: Teacher[];
  courses: Course[];
  groups: Group[];
  students: Student[];
  studentCredentials: StudentCredential[];
  attendance: Attendance[];
  payments: Payment[];
  schedules: Schedule[];
  auditLogs: AuditLog[];
  announcements?: Announcement[];
  telegramSettings: {
    botToken: string;
    adminChatId: string;
    enabled: boolean;
    sendPasswordInTelegram: boolean;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: 'ALL' | 'PARENTS' | 'STUDENTS' | 'TEACHERS';
  priority?: 'NORMAL' | 'URGENT';
  authorName?: string;
  createdAt: string;
}

class Database {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadOrSeed();
  }

  private ensureDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('ensureDirectory notice:', e);
    }
  }

  private loadOrSeed(): DatabaseSchema {
    if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(SOURCE_DB_FILE)) {
      try {
        fs.copyFileSync(SOURCE_DB_FILE, DB_FILE);
      } catch (e) {
        console.warn('Vercel copy db.json warning:', e);
      }
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.ensureParentData(parsed);
        return parsed;
      } catch (err) {
        console.error('Failed to parse db.json, generating default seed:', err);
      }
    }
    const seeded = this.generateSeedData();
    this.ensureParentData(seeded);
    try {
      this.saveDirect(seeded);
    } catch {}
    return seeded;
  }

  private ensureParentData(d: DatabaseSchema) {
    let hasChanges = false;

    // Ensure all array properties exist
    d.users = d.users || [];
    d.teachers = d.teachers || [];
    d.courses = d.courses || [];
    d.groups = d.groups || [];
    d.students = d.students || [];
    d.studentCredentials = d.studentCredentials || [];
    d.attendance = d.attendance || [];
    d.payments = d.payments || [];
    d.schedules = d.schedules || [];
    d.announcements = d.announcements || [];
    d.auditLogs = d.auditLogs || [];

    // Ensure superadmin exists with full email access
    let superAdmin = d.users.find((u) => u.role === 'SUPER_ADMIN');
    if (!superAdmin) {
      const superPass = bcrypt.hashSync('admin123', 10);
      d.users.unshift({
        id: 'usr_super_1',
        fullName: 'Amir Temur',
        username: 'superadmin',
        email: 'amirtemurnajimov@gmail.com',
        passwordHash: superPass,
        role: 'SUPER_ADMIN',
        phone: '+998 90 999 00 01',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      hasChanges = true;
    } else if (!superAdmin.email) {
      superAdmin.email = 'amirtemurnajimov@gmail.com';
      hasChanges = true;
    }

    // Ensure admin exists
    if (!d.users.some((u) => u.username === 'admin')) {
      const adminPass = bcrypt.hashSync('admin123', 10);
      d.users.push({
        id: 'usr_admin_1',
        fullName: 'Administrator',
        username: 'admin',
        passwordHash: adminPass,
        role: 'ADMIN',
        phone: '+998 90 888 11 22',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      hasChanges = true;
    }

    // Ensure operator exists
    if (!d.users.some((u) => u.username === 'operator')) {
      const operPass = bcrypt.hashSync('operator123', 10);
      d.users.push({
        id: 'usr_oper_1',
        fullName: 'Operator',
        username: 'operator',
        passwordHash: operPass,
        role: 'OPERATOR',
        phone: '+998 93 777 33 44',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      hasChanges = true;
    }

    // Ensure teacher_sardor exists in users
    if (!d.users.some((u) => u.username === 'teacher_sardor')) {
      const teacherPass = bcrypt.hashSync('teacher123', 10);
      d.users.push({
        id: 'usr_teach_1',
        fullName: 'Sardor Raximov',
        username: 'teacher_sardor',
        passwordHash: teacherPass,
        role: 'TEACHER',
        phone: '+998 90 123 45 67',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      hasChanges = true;
    }

    if (hasChanges) {
      this.saveDirect(d);
    }
  }

  public save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      this.ensureDirectory();
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Database save error:', err);
    } finally {
      this.isSaving = false;
    }
  }

  private saveDirect(data: DatabaseSchema) {
    this.ensureDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // Collections accessors
  public get users() { return this.data.users; }
  public get teachers() { return this.data.teachers; }
  public get courses() { return this.data.courses; }
  public get groups() { return this.data.groups; }
  public get students() { return this.data.students; }
  public get studentCredentials() { return this.data.studentCredentials; }
  public get attendance() { return this.data.attendance; }
  public get payments() { return this.data.payments; }
  public get schedules() { return this.data.schedules; }
  public get auditLogs() { return this.data.auditLogs; }
  public get announcements() {
    if (!this.data.announcements) this.data.announcements = [];
    return this.data.announcements;
  }
  public get telegramSettings() { return this.data.telegramSettings; }

  public logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>) {
    const entry: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...log,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 2000 audit logs in history
    if (this.data.auditLogs.length > 2000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 2000);
    }
    this.save();
    return entry;
  }

  // Backup & Restore
  public createBackup(): { jsonDump: string; timestamp: string } {
    return {
      jsonDump: JSON.stringify(this.data, null, 2),
      timestamp: new Date().toISOString(),
    };
  }

  public restoreBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseSchema;
      if (!parsed.users || !parsed.students || !parsed.courses) {
        throw new Error("Noto'g'ri zaxira nusxasi formati");
      }
      this.data = parsed;
      this.save();
      return true;
    } catch (e) {
      console.error('Backup restore failed:', e);
      return false;
    }
  }

  // Seed Data Generator
  private generateSeedData(): DatabaseSchema {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const superAdminPasswordHash = bcrypt.hashSync('admin123', 10);
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const operatorPasswordHash = bcrypt.hashSync('operator123', 10);
    const teacherPasswordHash = bcrypt.hashSync('teacher123', 10);

    const users: User[] = [
      {
        id: 'usr_super_1',
        fullName: 'Asliddin Temurov',
        username: 'superadmin',
        passwordHash: superAdminPasswordHash,
        role: 'SUPER_ADMIN',
        phone: '+998 90 999 00 01',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_admin_1',
        fullName: 'Shahzod Karimov',
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        phone: '+998 90 888 11 22',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_oper_1',
        fullName: 'Zarnigor Ahmedova',
        username: 'operator',
        passwordHash: operatorPasswordHash,
        role: 'OPERATOR',
        phone: '+998 93 777 33 44',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_teach_1',
        fullName: 'Sardor Raximov',
        username: 'teacher_sardor',
        passwordHash: teacherPasswordHash,
        role: 'TEACHER',
        phone: '+998 90 123 45 67',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const teachers: Teacher[] = [
      {
        id: 'tch_1',
        userId: 'usr_teach_1',
        fullName: 'Sardor Raximov',
        phone: '+998 90 123 45 67',
        specialty: 'IELTS & General English',
        bio: 'IELTS 8.5 sohibi, 6 yillik tajribaga ega xalqaro sertifikatli instruktor.',
        salaryRate: 50,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'tch_2',
        fullName: 'Jasur Alimov',
        phone: '+998 91 234 56 78',
        specialty: 'Oliy Matematika & SAT Math',
        bio: 'Xalqaro olimpiadalar sovrindori, 8 yillik matematika repetitori.',
        salaryRate: 50,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'tch_3',
        fullName: 'Madina Usmonova',
        phone: '+998 93 345 67 89',
        specialty: 'Frontend & Web Dasturlash',
        bio: 'Senior React Developer, 100 dan ortiq yosh dasturchilarni tayyorlagan.',
        salaryRate: 55,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'tch_4',
        fullName: 'Elena Kim',
        phone: '+998 94 456 78 90',
        specialty: 'Rus tili (so‘zlashuv & grammatika)',
        bio: 'Filologiya fanlari nomzodi, erkin so‘zlashuv bo‘yicha ekspert.',
        salaryRate: 45,
        status: 'ACTIVE',
        createdAt: now,
      },
    ];

    const courses: Course[] = [
      {
        id: 'crs_1',
        name: 'IELTS Intensive',
        description: 'Target 7.0+ bo‘lgan o‘quvchilar uchun intensiv xalqaro imtihon kursi.',
        durationMonths: 3,
        monthlyFee: 750000,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'crs_2',
        name: 'General English',
        description: 'Noldan boshlab erkin muloqot darajasigacha grammatika va speaking.',
        durationMonths: 6,
        monthlyFee: 550000,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'crs_3',
        name: 'Matematika & SAT',
        description: 'Prezident maktablari va xalqaro universitetlarga kirish uchun matematika.',
        durationMonths: 5,
        monthlyFee: 650000,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'crs_4',
        name: 'Frontend Dasturlash',
        description: 'HTML, CSS, JavaScript, React va zamonaviy web texnologiyalar.',
        durationMonths: 6,
        monthlyFee: 900000,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'crs_5',
        name: 'Rus tili (So‘zlashuv)',
        description: 'Qisqa vaqtda rus tilida bemalol va to‘g‘ri so‘zlashish amaliyoti.',
        durationMonths: 4,
        monthlyFee: 500000,
        status: 'ACTIVE',
        createdAt: now,
      },
    ];

    const groups: Group[] = [
      {
        id: 'grp_1',
        name: 'IELTS-12',
        courseId: 'crs_1',
        teacherId: 'tch_1',
        startDate: '2026-09-01',
        days: ['Dushanba', 'Chorshanba', 'Juma'],
        startTime: '18:00',
        endTime: '19:30',
        room: '301-xona (Audio Lab)',
        maxStudents: 14,
        monthlyFee: 750000,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'grp_2',
        name: 'ENG-BEGIN-04',
        courseId: 'crs_2',
        teacherId: 'tch_1',
        startDate: '2026-09-05',
        days: ['Seshanba', 'Payshanba', 'Shanba'],
        startTime: '16:30',
        endTime: '18:00',
        room: '204-xona',
        maxStudents: 16,
        monthlyFee: 550000,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'grp_3',
        name: 'MATH-SAT-02',
        courseId: 'crs_3',
        teacherId: 'tch_2',
        startDate: '2026-09-02',
        days: ['Dushanba', 'Chorshanba', 'Juma'],
        startTime: '15:00',
        endTime: '16:30',
        room: '105-xona',
        maxStudents: 15,
        monthlyFee: 650000,
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'grp_4',
        name: 'WEB-PRO-01',
        courseId: 'crs_4',
        teacherId: 'tch_3',
        startDate: '2026-08-20',
        days: ['Seshanba', 'Payshanba', 'Shanba'],
        startTime: '19:00',
        endTime: '20:30',
        room: 'IT Lab 1',
        maxStudents: 12,
        monthlyFee: 900000,
        status: 'ACTIVE',
        createdAt: now,
      },
    ];

    const schedules: Schedule[] = [
      { id: 'sch_1', groupId: 'grp_1', courseId: 'crs_1', teacherId: 'tch_1', dayOfWeek: 'Dushanba', startTime: '18:00', endTime: '19:30', room: '301-xona (Audio Lab)', createdAt: now },
      { id: 'sch_2', groupId: 'grp_1', courseId: 'crs_1', teacherId: 'tch_1', dayOfWeek: 'Chorshanba', startTime: '18:00', endTime: '19:30', room: '301-xona (Audio Lab)', createdAt: now },
      { id: 'sch_3', groupId: 'grp_1', courseId: 'crs_1', teacherId: 'tch_1', dayOfWeek: 'Juma', startTime: '18:00', endTime: '19:30', room: '301-xona (Audio Lab)', createdAt: now },
      { id: 'sch_4', groupId: 'grp_2', courseId: 'crs_2', teacherId: 'tch_1', dayOfWeek: 'Seshanba', startTime: '16:30', endTime: '18:00', room: '204-xona', createdAt: now },
      { id: 'sch_5', groupId: 'grp_2', courseId: 'crs_2', teacherId: 'tch_1', dayOfWeek: 'Payshanba', startTime: '16:30', endTime: '18:00', room: '204-xona', createdAt: now },
      { id: 'sch_6', groupId: 'grp_2', courseId: 'crs_2', teacherId: 'tch_1', dayOfWeek: 'Shanba', startTime: '16:30', endTime: '18:00', room: '204-xona', createdAt: now },
      { id: 'sch_7', groupId: 'grp_3', courseId: 'crs_3', teacherId: 'tch_2', dayOfWeek: 'Dushanba', startTime: '15:00', endTime: '16:30', room: '105-xona', createdAt: now },
      { id: 'sch_8', groupId: 'grp_4', courseId: 'crs_4', teacherId: 'tch_3', dayOfWeek: 'Seshanba', startTime: '19:00', endTime: '20:30', room: 'IT Lab 1', createdAt: now },
    ];

    const studentSeedList = [
      { firstName: 'Ali', lastName: 'Valiyev', phone: '+998 90 111 22 33', parentName: 'Vali Aliyev', parentPhone: '+998 90 999 88 77', courseId: 'crs_1', groupId: 'grp_1', teacherId: 'tch_1', lessonTime: '18:00 - 19:30', gender: 'ERKAK' as const, birthDate: '2008-04-12' },
      { firstName: 'Diyor', lastName: 'Najimov', phone: '+998 91 333 44 55', parentName: 'Dilshod Najimov', parentPhone: '+998 91 888 77 66', courseId: 'crs_1', groupId: 'grp_1', teacherId: 'tch_1', lessonTime: '18:00 - 19:30', gender: 'ERKAK' as const, birthDate: '2007-11-25' },
      { firstName: 'Sevara', lastName: 'Qosimova', phone: '+998 93 444 55 66', parentName: 'Gulbahor Qosimova', parentPhone: '+998 93 777 66 55', courseId: 'crs_2', groupId: 'grp_2', teacherId: 'tch_1', lessonTime: '16:30 - 18:00', gender: 'AYOL' as const, birthDate: '2009-02-18' },
      { firstName: 'Bekzod', lastName: 'Toshmatov', phone: '+998 94 555 66 77', parentName: 'Olim Toshmatov', parentPhone: '+998 94 666 55 44', courseId: 'crs_3', groupId: 'grp_3', teacherId: 'tch_2', lessonTime: '15:00 - 16:30', gender: 'ERKAK' as const, birthDate: '2008-08-30' },
      { firstName: 'Zilola', lastName: 'Narzullayeva', phone: '+998 97 666 77 88', parentName: 'Zarif Narzullayev', parentPhone: '+998 97 555 44 33', courseId: 'crs_4', groupId: 'grp_4', teacherId: 'tch_3', lessonTime: '19:00 - 20:30', gender: 'AYOL' as const, birthDate: '2006-05-14' },
      { firstName: 'Bobur', lastName: 'Ergashev', phone: '+998 99 777 88 99', parentName: 'Shuhrat Ergashev', parentPhone: '+998 99 444 33 22', courseId: 'crs_1', groupId: 'grp_1', teacherId: 'tch_1', lessonTime: '18:00 - 19:30', gender: 'ERKAK' as const, birthDate: '2007-09-08' },
      { firstName: 'Kamola', lastName: 'Azimova', phone: '+998 90 222 33 44', parentName: 'Nodira Azimova', parentPhone: '+998 90 333 22 11', courseId: 'crs_2', groupId: 'grp_2', teacherId: 'tch_1', lessonTime: '16:30 - 18:00', gender: 'AYOL' as const, birthDate: '2009-12-01' },
      { firstName: 'Jahongir', lastName: 'Karimov', phone: '+998 91 888 99 00', parentName: 'Botir Karimov', parentPhone: '+998 91 222 11 00', courseId: 'crs_4', groupId: 'grp_4', teacherId: 'tch_3', lessonTime: '19:00 - 20:30', gender: 'ERKAK' as const, birthDate: '2005-07-21' },
    ];

    const students: Student[] = [];
    const studentCredentials: StudentCredential[] = [];
    const existingIds = new Set<string>();

    studentSeedList.forEach((s, idx) => {
      // For Diyor Najimov, use deterministic ID 583217 and password Najimov5837
      const isNajimov = s.lastName === 'Najimov';
      const studentId = isNajimov ? '583217' : generateUniqueStudentId(existingIds);
      existingIds.add(studentId);

      const studentDbId = `std_${idx + 1}`;
      const cred = isNajimov
        ? { hash: bcrypt.hashSync('Najimov5837', 10), plainText: 'Najimov5837' }
        : generateStudentPassword(s.lastName);

      students.push({
        id: studentDbId,
        studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        birthDate: s.birthDate,
        gender: s.gender,
        parentName: isNajimov ? 'Amir Temur Najimov' : s.parentName,
        parentPhone: isNajimov ? '+998 90 999 00 01' : s.parentPhone,
        courseId: s.courseId,
        groupId: s.groupId,
        teacherId: s.teacherId,
        lessonTime: s.lessonTime,
        status: 'ACTIVE',
        notes: "Muvaffaqiyatli ro'yxatga olindi",
        createdAt: now,
        updatedAt: now,
      });

      studentCredentials.push({
        studentId,
        login: studentId,
        passwordHash: cred.hash,
        plainTempPasswordShownOnce: cred.plainText,
        isPasswordChanged: false,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Seed Attendance
    const attendance: Attendance[] = [
      { id: 'att_1', groupId: 'grp_1', studentId: 'std_1', lessonDate: today, status: 'PRESENT', markedBy: 'usr_teach_1', createdAt: now },
      { id: 'att_2', groupId: 'grp_1', studentId: 'std_2', lessonDate: today, status: 'PRESENT', markedBy: 'usr_teach_1', createdAt: now },
      { id: 'att_3', groupId: 'grp_1', studentId: 'std_6', lessonDate: today, status: 'EXCUSED', notes: 'Shaxsiy sabab bilan', markedBy: 'usr_teach_1', createdAt: now },
      { id: 'att_4', groupId: 'grp_2', studentId: 'std_3', lessonDate: today, status: 'PRESENT', markedBy: 'usr_teach_1', createdAt: now },
      { id: 'att_5', groupId: 'grp_2', studentId: 'std_7', lessonDate: today, status: 'ABSENT', markedBy: 'usr_teach_1', createdAt: now },
      { id: 'att_6', groupId: 'grp_4', studentId: 'std_5', lessonDate: today, status: 'PRESENT', markedBy: 'usr_admin_1', createdAt: now },
      { id: 'att_7', groupId: 'grp_4', studentId: 'std_8', lessonDate: today, status: 'PRESENT', markedBy: 'usr_admin_1', createdAt: now },
    ];

    // Seed Payments
    const currentMonth = today.slice(0, 7);
    const payments: Payment[] = [
      { id: 'pay_1', studentId: 'std_1', amount: 750000, paymentDate: today, forMonth: currentMonth, paymentType: 'CARD', receiptNumber: 'PAY-8921', recordedBy: 'Shahzod Karimov', notes: "To'liq to'landi", createdAt: now },
      { id: 'pay_2', studentId: 'std_2', amount: 400000, paymentDate: today, forMonth: currentMonth, paymentType: 'CASH', receiptNumber: 'PAY-8922', recordedBy: 'Shahzod Karimov', notes: "Qisman to'landi (Qarz: 350,000 so'm)", createdAt: now },
      { id: 'pay_3', studentId: 'std_3', amount: 550000, paymentDate: today, forMonth: currentMonth, paymentType: 'BANK', receiptNumber: 'PAY-8923', recordedBy: 'Shahzod Karimov', notes: "To'liq to'landi", createdAt: now },
      { id: 'pay_4', studentId: 'std_5', amount: 900000, paymentDate: today, forMonth: currentMonth, paymentType: 'CARD', receiptNumber: 'PAY-8924', recordedBy: 'Shahzod Karimov', notes: "To'liq to'landi", createdAt: now },
      { id: 'pay_5', studentId: 'std_7', amount: 300000, paymentDate: today, forMonth: currentMonth, paymentType: 'CASH', receiptNumber: 'PAY-8925', recordedBy: 'Shahzod Karimov', notes: "Qisman to'landi", createdAt: now },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud_1',
        userId: 'usr_super_1',
        userName: 'Asliddin Temurov',
        userRole: 'SUPER_ADMIN',
        action: 'Tizim ishga tushirildi',
        entity: 'System',
        entityId: 'init',
        details: { message: "EduCenter CRM bazasi va boshlang'ich ma'lumotlar yaratildi" },
        ipAddress: '127.0.0.1',
        createdAt: now,
      },
      {
        id: 'aud_2',
        userId: 'usr_admin_1',
        userName: 'Shahzod Karimov',
        userRole: 'ADMIN',
        action: 'Kurslar yaratildi',
        entity: 'Course',
        entityId: 'crs_1',
        details: { coursesCount: 5 },
        ipAddress: '127.0.0.1',
        createdAt: now,
      },
    ];

    return {
      users,
      teachers: [],
      courses: [],
      groups: [],
      students: [],
      studentCredentials: [],
      attendance: [],
      payments: [],
      schedules: [],
      announcements: [],
      auditLogs: [],
      telegramSettings: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
        enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID),
        sendPasswordInTelegram: false,
      },
    };
  }
}

export const db = new Database();
