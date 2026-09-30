// server.ts
import express from "express";
import dotenv from "dotenv";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// server/routes/auth.ts
import { Router } from "express";
import bcrypt3 from "bcryptjs";
import jwt2 from "jsonwebtoken";

// server/db/database.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt2 from "bcryptjs";

// server/services/studentIdGenerator.ts
function isTrivialSequence(str) {
  if (/^(\d)\1+$/.test(str)) return true;
  let isAscending = true;
  for (let i = 1; i < str.length; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) + 1) {
      isAscending = false;
      break;
    }
  }
  if (isAscending) return true;
  let isDescending = true;
  for (let i = 1; i < str.length; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) - 1) {
      isDescending = false;
      break;
    }
  }
  if (isDescending) return true;
  if (str.length % 2 === 0) {
    const pair = str.slice(0, 2);
    if (pair.repeat(str.length / 2) === str) return true;
  }
  if (/^[1-9]0{4,}$/.test(str)) return true;
  return false;
}
function generateCandidateStudentId() {
  const lengths = [6, 6, 6, 5, 7];
  const length = lengths[Math.floor(Math.random() * lengths.length)];
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  const digits = [firstDigit];
  for (let i = 1; i < length; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  const idStr = digits.join("");
  if (isTrivialSequence(idStr)) {
    return generateCandidateStudentId();
  }
  return idStr;
}
function generateUniqueStudentId(existingIds) {
  const set = existingIds instanceof Set ? existingIds : new Set(existingIds);
  let attempts = 0;
  while (attempts < 1e3) {
    const candidate = generateCandidateStudentId();
    if (!set.has(candidate)) {
      return candidate;
    }
    attempts++;
  }
  const timestampPart = Date.now().toString().slice(-6);
  return timestampPart;
}

// server/services/passwordGenerator.ts
import bcrypt from "bcryptjs";
function isTrivial4Digit(str) {
  if (str.length !== 4) return true;
  if (/^(\d)\1{3}$/.test(str)) return true;
  let asc = true;
  for (let i = 1; i < 4; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) + 1) {
      asc = false;
      break;
    }
  }
  if (asc) return true;
  let desc = true;
  for (let i = 1; i < 4; i++) {
    if (parseInt(str[i], 10) !== parseInt(str[i - 1], 10) - 1) {
      desc = false;
      break;
    }
  }
  if (desc) return true;
  if (str.slice(0, 2) === str.slice(2, 4)) return true;
  if (/^[1-9]000$/.test(str)) return true;
  return false;
}
function generateRandom4Digits() {
  while (true) {
    const d1 = Math.floor(Math.random() * 9) + 1;
    const d2 = Math.floor(Math.random() * 10);
    const d3 = Math.floor(Math.random() * 10);
    const d4 = Math.floor(Math.random() * 10);
    const candidate = `${d1}${d2}${d3}${d4}`;
    if (!isTrivial4Digit(candidate)) {
      return candidate;
    }
  }
}
function sanitizeLastName(lastName) {
  const cleaned = lastName.trim().replace(/[^a-zA-Z0-9]/g, "");
  if (!cleaned) return "Student";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}
function generateStudentPassword(lastName) {
  const prefix = sanitizeLastName(lastName);
  const digits = generateRandom4Digits();
  const plainText = `${prefix}${digits}`;
  const hash = bcrypt.hashSync(plainText, 10);
  return {
    plainText,
    hash
  };
}

// server/db/database.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isVercel = Boolean(process.env.VERCEL);
var DATA_DIR = isVercel ? "/tmp" : path.resolve(__dirname, "../data");
var DB_FILE = isVercel ? path.join("/tmp", "db.json") : path.join(DATA_DIR, "db.json");
var SOURCE_DB_FILE = path.resolve(__dirname, "../data/db.json");
var Database = class {
  constructor() {
    this.isSaving = false;
    this.ensureDirectory();
    this.data = this.loadOrSeed();
  }
  ensureDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn("ensureDirectory notice:", e);
    }
  }
  loadOrSeed() {
    if (isVercel && !fs.existsSync(DB_FILE) && fs.existsSync(SOURCE_DB_FILE)) {
      try {
        fs.copyFileSync(SOURCE_DB_FILE, DB_FILE);
      } catch (e) {
        console.warn("Vercel copy db.json warning:", e);
      }
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.ensureParentData(parsed);
        return parsed;
      } catch (err) {
        console.error("Failed to parse db.json, generating default seed:", err);
      }
    }
    const seeded = this.generateSeedData();
    this.ensureParentData(seeded);
    try {
      this.saveDirect(seeded);
    } catch {
    }
    return seeded;
  }
  ensureParentData(d) {
    let hasChanges = false;
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
    let superAdmin = d.users.find((u) => u.role === "SUPER_ADMIN");
    if (!superAdmin) {
      const superPass = bcrypt2.hashSync("admin123", 10);
      d.users.unshift({
        id: "usr_super_1",
        fullName: "Amir Temur",
        username: "superadmin",
        email: "amirtemurnajimov@gmail.com",
        passwordHash: superPass,
        role: "SUPER_ADMIN",
        phone: "+998 90 999 00 01",
        status: "ACTIVE",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      hasChanges = true;
    } else if (!superAdmin.email) {
      superAdmin.email = "amirtemurnajimov@gmail.com";
      hasChanges = true;
    }
    if (!d.users.some((u) => u.username === "admin")) {
      const adminPass = bcrypt2.hashSync("admin123", 10);
      d.users.push({
        id: "usr_admin_1",
        fullName: "Administrator",
        username: "admin",
        passwordHash: adminPass,
        role: "ADMIN",
        phone: "+998 90 888 11 22",
        status: "ACTIVE",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      hasChanges = true;
    }
    if (!d.users.some((u) => u.username === "operator")) {
      const operPass = bcrypt2.hashSync("operator123", 10);
      d.users.push({
        id: "usr_oper_1",
        fullName: "Operator",
        username: "operator",
        passwordHash: operPass,
        role: "OPERATOR",
        phone: "+998 93 777 33 44",
        status: "ACTIVE",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      hasChanges = true;
    }
    if (!d.users.some((u) => u.username === "teacher_sardor")) {
      const teacherPass = bcrypt2.hashSync("teacher123", 10);
      d.users.push({
        id: "usr_teach_1",
        fullName: "Sardor Raximov",
        username: "teacher_sardor",
        passwordHash: teacherPass,
        role: "TEACHER",
        phone: "+998 90 123 45 67",
        status: "ACTIVE",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      hasChanges = true;
    }
    if (hasChanges) {
      this.saveDirect(d);
    }
  }
  save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      this.ensureDirectory();
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error("Database save error:", err);
    } finally {
      this.isSaving = false;
    }
  }
  saveDirect(data) {
    this.ensureDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  }
  getRawData() {
    return this.data;
  }
  // Collections accessors
  get users() {
    return this.data.users;
  }
  get teachers() {
    return this.data.teachers;
  }
  get courses() {
    return this.data.courses;
  }
  get groups() {
    return this.data.groups;
  }
  get students() {
    return this.data.students;
  }
  get studentCredentials() {
    return this.data.studentCredentials;
  }
  get attendance() {
    return this.data.attendance;
  }
  get payments() {
    return this.data.payments;
  }
  get schedules() {
    return this.data.schedules;
  }
  get auditLogs() {
    return this.data.auditLogs;
  }
  get announcements() {
    if (!this.data.announcements) this.data.announcements = [];
    return this.data.announcements;
  }
  get telegramSettings() {
    return this.data.telegramSettings;
  }
  logAudit(log) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...log,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 2e3) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 2e3);
    }
    this.save();
    return entry;
  }
  // Backup & Restore
  createBackup() {
    return {
      jsonDump: JSON.stringify(this.data, null, 2),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  restoreBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.users || !parsed.students || !parsed.courses) {
        throw new Error("Noto'g'ri zaxira nusxasi formati");
      }
      this.data = parsed;
      this.save();
      return true;
    } catch (e) {
      console.error("Backup restore failed:", e);
      return false;
    }
  }
  // Seed Data Generator
  generateSeedData() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const today = now.slice(0, 10);
    const superAdminPasswordHash = bcrypt2.hashSync("admin123", 10);
    const adminPasswordHash = bcrypt2.hashSync("admin123", 10);
    const operatorPasswordHash = bcrypt2.hashSync("operator123", 10);
    const teacherPasswordHash = bcrypt2.hashSync("teacher123", 10);
    const users = [
      {
        id: "usr_super_1",
        fullName: "Asliddin Temurov",
        username: "superadmin",
        passwordHash: superAdminPasswordHash,
        role: "SUPER_ADMIN",
        phone: "+998 90 999 00 01",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "usr_admin_1",
        fullName: "Shahzod Karimov",
        username: "admin",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        phone: "+998 90 888 11 22",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "usr_oper_1",
        fullName: "Zarnigor Ahmedova",
        username: "operator",
        passwordHash: operatorPasswordHash,
        role: "OPERATOR",
        phone: "+998 93 777 33 44",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "usr_teach_1",
        fullName: "Sardor Raximov",
        username: "teacher_sardor",
        passwordHash: teacherPasswordHash,
        role: "TEACHER",
        phone: "+998 90 123 45 67",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now
      }
    ];
    const teachers = [
      {
        id: "tch_1",
        userId: "usr_teach_1",
        fullName: "Sardor Raximov",
        phone: "+998 90 123 45 67",
        specialty: "IELTS & General English",
        bio: "IELTS 8.5 sohibi, 6 yillik tajribaga ega xalqaro sertifikatli instruktor.",
        salaryRate: 50,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "tch_2",
        fullName: "Jasur Alimov",
        phone: "+998 91 234 56 78",
        specialty: "Oliy Matematika & SAT Math",
        bio: "Xalqaro olimpiadalar sovrindori, 8 yillik matematika repetitori.",
        salaryRate: 50,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "tch_3",
        fullName: "Madina Usmonova",
        phone: "+998 93 345 67 89",
        specialty: "Frontend & Web Dasturlash",
        bio: "Senior React Developer, 100 dan ortiq yosh dasturchilarni tayyorlagan.",
        salaryRate: 55,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "tch_4",
        fullName: "Elena Kim",
        phone: "+998 94 456 78 90",
        specialty: "Rus tili (so\u2018zlashuv & grammatika)",
        bio: "Filologiya fanlari nomzodi, erkin so\u2018zlashuv bo\u2018yicha ekspert.",
        salaryRate: 45,
        status: "ACTIVE",
        createdAt: now
      }
    ];
    const courses = [
      {
        id: "crs_1",
        name: "IELTS Intensive",
        description: "Target 7.0+ bo\u2018lgan o\u2018quvchilar uchun intensiv xalqaro imtihon kursi.",
        durationMonths: 3,
        monthlyFee: 75e4,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "crs_2",
        name: "General English",
        description: "Noldan boshlab erkin muloqot darajasigacha grammatika va speaking.",
        durationMonths: 6,
        monthlyFee: 55e4,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "crs_3",
        name: "Matematika & SAT",
        description: "Prezident maktablari va xalqaro universitetlarga kirish uchun matematika.",
        durationMonths: 5,
        monthlyFee: 65e4,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "crs_4",
        name: "Frontend Dasturlash",
        description: "HTML, CSS, JavaScript, React va zamonaviy web texnologiyalar.",
        durationMonths: 6,
        monthlyFee: 9e5,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "crs_5",
        name: "Rus tili (So\u2018zlashuv)",
        description: "Qisqa vaqtda rus tilida bemalol va to\u2018g\u2018ri so\u2018zlashish amaliyoti.",
        durationMonths: 4,
        monthlyFee: 5e5,
        status: "ACTIVE",
        createdAt: now
      }
    ];
    const groups = [
      {
        id: "grp_1",
        name: "IELTS-12",
        courseId: "crs_1",
        teacherId: "tch_1",
        startDate: "2026-09-01",
        days: ["Dushanba", "Chorshanba", "Juma"],
        startTime: "18:00",
        endTime: "19:30",
        room: "301-xona (Audio Lab)",
        maxStudents: 14,
        monthlyFee: 75e4,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "grp_2",
        name: "ENG-BEGIN-04",
        courseId: "crs_2",
        teacherId: "tch_1",
        startDate: "2026-09-05",
        days: ["Seshanba", "Payshanba", "Shanba"],
        startTime: "16:30",
        endTime: "18:00",
        room: "204-xona",
        maxStudents: 16,
        monthlyFee: 55e4,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "grp_3",
        name: "MATH-SAT-02",
        courseId: "crs_3",
        teacherId: "tch_2",
        startDate: "2026-09-02",
        days: ["Dushanba", "Chorshanba", "Juma"],
        startTime: "15:00",
        endTime: "16:30",
        room: "105-xona",
        maxStudents: 15,
        monthlyFee: 65e4,
        status: "ACTIVE",
        createdAt: now
      },
      {
        id: "grp_4",
        name: "WEB-PRO-01",
        courseId: "crs_4",
        teacherId: "tch_3",
        startDate: "2026-08-20",
        days: ["Seshanba", "Payshanba", "Shanba"],
        startTime: "19:00",
        endTime: "20:30",
        room: "IT Lab 1",
        maxStudents: 12,
        monthlyFee: 9e5,
        status: "ACTIVE",
        createdAt: now
      }
    ];
    const schedules = [
      { id: "sch_1", groupId: "grp_1", courseId: "crs_1", teacherId: "tch_1", dayOfWeek: "Dushanba", startTime: "18:00", endTime: "19:30", room: "301-xona (Audio Lab)", createdAt: now },
      { id: "sch_2", groupId: "grp_1", courseId: "crs_1", teacherId: "tch_1", dayOfWeek: "Chorshanba", startTime: "18:00", endTime: "19:30", room: "301-xona (Audio Lab)", createdAt: now },
      { id: "sch_3", groupId: "grp_1", courseId: "crs_1", teacherId: "tch_1", dayOfWeek: "Juma", startTime: "18:00", endTime: "19:30", room: "301-xona (Audio Lab)", createdAt: now },
      { id: "sch_4", groupId: "grp_2", courseId: "crs_2", teacherId: "tch_1", dayOfWeek: "Seshanba", startTime: "16:30", endTime: "18:00", room: "204-xona", createdAt: now },
      { id: "sch_5", groupId: "grp_2", courseId: "crs_2", teacherId: "tch_1", dayOfWeek: "Payshanba", startTime: "16:30", endTime: "18:00", room: "204-xona", createdAt: now },
      { id: "sch_6", groupId: "grp_2", courseId: "crs_2", teacherId: "tch_1", dayOfWeek: "Shanba", startTime: "16:30", endTime: "18:00", room: "204-xona", createdAt: now },
      { id: "sch_7", groupId: "grp_3", courseId: "crs_3", teacherId: "tch_2", dayOfWeek: "Dushanba", startTime: "15:00", endTime: "16:30", room: "105-xona", createdAt: now },
      { id: "sch_8", groupId: "grp_4", courseId: "crs_4", teacherId: "tch_3", dayOfWeek: "Seshanba", startTime: "19:00", endTime: "20:30", room: "IT Lab 1", createdAt: now }
    ];
    const studentSeedList = [
      { firstName: "Ali", lastName: "Valiyev", phone: "+998 90 111 22 33", parentName: "Vali Aliyev", parentPhone: "+998 90 999 88 77", courseId: "crs_1", groupId: "grp_1", teacherId: "tch_1", lessonTime: "18:00 - 19:30", gender: "ERKAK", birthDate: "2008-04-12" },
      { firstName: "Diyor", lastName: "Najimov", phone: "+998 91 333 44 55", parentName: "Dilshod Najimov", parentPhone: "+998 91 888 77 66", courseId: "crs_1", groupId: "grp_1", teacherId: "tch_1", lessonTime: "18:00 - 19:30", gender: "ERKAK", birthDate: "2007-11-25" },
      { firstName: "Sevara", lastName: "Qosimova", phone: "+998 93 444 55 66", parentName: "Gulbahor Qosimova", parentPhone: "+998 93 777 66 55", courseId: "crs_2", groupId: "grp_2", teacherId: "tch_1", lessonTime: "16:30 - 18:00", gender: "AYOL", birthDate: "2009-02-18" },
      { firstName: "Bekzod", lastName: "Toshmatov", phone: "+998 94 555 66 77", parentName: "Olim Toshmatov", parentPhone: "+998 94 666 55 44", courseId: "crs_3", groupId: "grp_3", teacherId: "tch_2", lessonTime: "15:00 - 16:30", gender: "ERKAK", birthDate: "2008-08-30" },
      { firstName: "Zilola", lastName: "Narzullayeva", phone: "+998 97 666 77 88", parentName: "Zarif Narzullayev", parentPhone: "+998 97 555 44 33", courseId: "crs_4", groupId: "grp_4", teacherId: "tch_3", lessonTime: "19:00 - 20:30", gender: "AYOL", birthDate: "2006-05-14" },
      { firstName: "Bobur", lastName: "Ergashev", phone: "+998 99 777 88 99", parentName: "Shuhrat Ergashev", parentPhone: "+998 99 444 33 22", courseId: "crs_1", groupId: "grp_1", teacherId: "tch_1", lessonTime: "18:00 - 19:30", gender: "ERKAK", birthDate: "2007-09-08" },
      { firstName: "Kamola", lastName: "Azimova", phone: "+998 90 222 33 44", parentName: "Nodira Azimova", parentPhone: "+998 90 333 22 11", courseId: "crs_2", groupId: "grp_2", teacherId: "tch_1", lessonTime: "16:30 - 18:00", gender: "AYOL", birthDate: "2009-12-01" },
      { firstName: "Jahongir", lastName: "Karimov", phone: "+998 91 888 99 00", parentName: "Botir Karimov", parentPhone: "+998 91 222 11 00", courseId: "crs_4", groupId: "grp_4", teacherId: "tch_3", lessonTime: "19:00 - 20:30", gender: "ERKAK", birthDate: "2005-07-21" }
    ];
    const students = [];
    const studentCredentials = [];
    const existingIds = /* @__PURE__ */ new Set();
    studentSeedList.forEach((s, idx) => {
      const isNajimov = s.lastName === "Najimov";
      const studentId = isNajimov ? "583217" : generateUniqueStudentId(existingIds);
      existingIds.add(studentId);
      const studentDbId = `std_${idx + 1}`;
      const cred = isNajimov ? { hash: bcrypt2.hashSync("Najimov5837", 10), plainText: "Najimov5837" } : generateStudentPassword(s.lastName);
      students.push({
        id: studentDbId,
        studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        phone: s.phone,
        birthDate: s.birthDate,
        gender: s.gender,
        parentName: isNajimov ? "Amir Temur Najimov" : s.parentName,
        parentPhone: isNajimov ? "+998 90 999 00 01" : s.parentPhone,
        courseId: s.courseId,
        groupId: s.groupId,
        teacherId: s.teacherId,
        lessonTime: s.lessonTime,
        status: "ACTIVE",
        notes: "Muvaffaqiyatli ro'yxatga olindi",
        createdAt: now,
        updatedAt: now
      });
      studentCredentials.push({
        studentId,
        login: studentId,
        passwordHash: cred.hash,
        plainTempPasswordShownOnce: cred.plainText,
        isPasswordChanged: false,
        createdAt: now,
        updatedAt: now
      });
    });
    const attendance = [
      { id: "att_1", groupId: "grp_1", studentId: "std_1", lessonDate: today, status: "PRESENT", markedBy: "usr_teach_1", createdAt: now },
      { id: "att_2", groupId: "grp_1", studentId: "std_2", lessonDate: today, status: "PRESENT", markedBy: "usr_teach_1", createdAt: now },
      { id: "att_3", groupId: "grp_1", studentId: "std_6", lessonDate: today, status: "EXCUSED", notes: "Shaxsiy sabab bilan", markedBy: "usr_teach_1", createdAt: now },
      { id: "att_4", groupId: "grp_2", studentId: "std_3", lessonDate: today, status: "PRESENT", markedBy: "usr_teach_1", createdAt: now },
      { id: "att_5", groupId: "grp_2", studentId: "std_7", lessonDate: today, status: "ABSENT", markedBy: "usr_teach_1", createdAt: now },
      { id: "att_6", groupId: "grp_4", studentId: "std_5", lessonDate: today, status: "PRESENT", markedBy: "usr_admin_1", createdAt: now },
      { id: "att_7", groupId: "grp_4", studentId: "std_8", lessonDate: today, status: "PRESENT", markedBy: "usr_admin_1", createdAt: now }
    ];
    const currentMonth = today.slice(0, 7);
    const payments = [
      { id: "pay_1", studentId: "std_1", amount: 75e4, paymentDate: today, forMonth: currentMonth, paymentType: "CARD", receiptNumber: "PAY-8921", recordedBy: "Shahzod Karimov", notes: "To'liq to'landi", createdAt: now },
      { id: "pay_2", studentId: "std_2", amount: 4e5, paymentDate: today, forMonth: currentMonth, paymentType: "CASH", receiptNumber: "PAY-8922", recordedBy: "Shahzod Karimov", notes: "Qisman to'landi (Qarz: 350,000 so'm)", createdAt: now },
      { id: "pay_3", studentId: "std_3", amount: 55e4, paymentDate: today, forMonth: currentMonth, paymentType: "BANK", receiptNumber: "PAY-8923", recordedBy: "Shahzod Karimov", notes: "To'liq to'landi", createdAt: now },
      { id: "pay_4", studentId: "std_5", amount: 9e5, paymentDate: today, forMonth: currentMonth, paymentType: "CARD", receiptNumber: "PAY-8924", recordedBy: "Shahzod Karimov", notes: "To'liq to'landi", createdAt: now },
      { id: "pay_5", studentId: "std_7", amount: 3e5, paymentDate: today, forMonth: currentMonth, paymentType: "CASH", receiptNumber: "PAY-8925", recordedBy: "Shahzod Karimov", notes: "Qisman to'landi", createdAt: now }
    ];
    const auditLogs = [
      {
        id: "aud_1",
        userId: "usr_super_1",
        userName: "Asliddin Temurov",
        userRole: "SUPER_ADMIN",
        action: "Tizim ishga tushirildi",
        entity: "System",
        entityId: "init",
        details: { message: "EduCenter CRM bazasi va boshlang'ich ma'lumotlar yaratildi" },
        ipAddress: "127.0.0.1",
        createdAt: now
      },
      {
        id: "aud_2",
        userId: "usr_admin_1",
        userName: "Shahzod Karimov",
        userRole: "ADMIN",
        action: "Kurslar yaratildi",
        entity: "Course",
        entityId: "crs_1",
        details: { coursesCount: 5 },
        ipAddress: "127.0.0.1",
        createdAt: now
      }
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
        botToken: process.env.TELEGRAM_BOT_TOKEN || "",
        adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || "",
        enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID),
        sendPasswordInTelegram: false
      }
    };
  }
};
var db = new Database();

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "educenter_super_secure_jwt_secret_2026_xyz";
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Tizimga kirish talab etiladi (Token topilmadi)"
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type === "PARENT_STUDENT" || decoded.role === "PARENT") {
      const student = db.students.find((s) => s.studentId === decoded.studentId && !s.deletedAt);
      if (!student) {
        return res.status(401).json({
          success: false,
          error: "O\u2018quvchi hisobi topilmadi"
        });
      }
      req.user = {
        id: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        username: student.studentId,
        passwordHash: "",
        role: "PARENT",
        phone: student.phone || student.parentPhone || "",
        status: student.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      };
      return next();
    }
    const user = db.users.find((u) => u.id === decoded.id && !u.deletedAt);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Foydalanuvchi hisobi topilmadi"
      });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "Ushbu hisob faolsizlantirilgan. Administratorga murojaat qiling."
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Token yaroqsiz yoki muddati o\u2018tgan. Qayta login qiling."
    });
  }
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Avtorizatsiyadan o\u2018tilmagan" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Ruxsat berilmagan. Ushbu amal faqat quyidagi rollar uchun ruxsat etilgan: ${allowedRoles.join(", ")}`
      });
    }
    next();
  };
}

// server/routes/auth.ts
var JWT_SECRET2 = process.env.JWT_SECRET || "educenter_super_secure_jwt_secret_2026_xyz";
var authRouter = Router();
authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "Login va parol kiritilishi shart"
    });
  }
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanPassword = String(password).trim();
  let user = db.users.find(
    (u) => (u.username.toLowerCase() === cleanUsername || u.email && u.email.toLowerCase() === cleanUsername) && !u.deletedAt
  );
  if (!user && (cleanUsername === "amirtemurnajimov@gmail.com" || cleanUsername === "najimovamir36@gmail.com" || cleanUsername === "najimovamir36-cpu" || cleanUsername === "amir temur" || cleanUsername === "amirtemur")) {
    user = db.users.find((u) => u.role === "SUPER_ADMIN" && !u.deletedAt);
  }
  if (user) {
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "Ushbu profil faolsizlantirilgan. Administrator bilan bog\u2018laning."
      });
    }
    const isMatch = bcrypt3.compareSync(cleanPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Login yoki parol noto\u2018g\u2018ri"
      });
    }
    const token = generateToken(user);
    db.logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "Tizimga kirdi (Login)",
      entity: "User",
      entityId: user.id,
      ipAddress: req.ip || req.socket.remoteAddress
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
        status: user.status
      }
    });
  }
  const credential = db.studentCredentials.find(
    (c) => c.studentId.toLowerCase() === cleanUsername || c.login.toLowerCase() === cleanUsername
  );
  if (credential) {
    const isMatch = bcrypt3.compareSync(cleanPassword, credential.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Login yoki parol noto\u2018g\u2018ri"
      });
    }
    const student = db.students.find((s) => s.studentId === credential.studentId && !s.deletedAt);
    if (student) {
      const token = jwt2.sign(
        {
          id: student.id,
          studentId: student.studentId,
          type: "PARENT_STUDENT",
          role: "PARENT",
          name: `${student.firstName} ${student.lastName}`
        },
        JWT_SECRET2,
        { expiresIn: "30d" }
      );
      db.logAudit({
        userId: student.id,
        userName: `Ota-ona (${student.parentName || student.firstName + " " + student.lastName})`,
        userRole: "PARENT",
        action: "Ota-ona kabinetiga kirdi (Login)",
        entity: "Student",
        entityId: student.id,
        ipAddress: req.ip || req.socket.remoteAddress
      });
      return res.json({
        success: true,
        token,
        user: {
          id: student.id,
          fullName: `${student.firstName} ${student.lastName} (Ota-ona)`,
          username: student.studentId,
          role: "PARENT",
          phone: student.parentPhone || student.phone || "",
          status: "ACTIVE"
        },
        isParent: true
      });
    }
  }
  return res.status(401).json({
    success: false,
    error: "Login yoki parol noto\u2018g\u2018ri. Iltimos tekshirib qaytadan kiriting."
  });
});
authRouter.post("/google", async (req, res) => {
  const { email, displayName, uid } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Google email kiritilishi shart" });
  }
  let user = db.users.find((u) => u.username.toLowerCase() === email.toLowerCase() && !u.deletedAt);
  if (!user) {
    const isOwner = ["najimovamir36@gmail.com", "amirtemurnajimov@gmail.com"].includes(email.toLowerCase());
    const role = isOwner ? "SUPER_ADMIN" : "ADMIN";
    const superadmin = db.users.find((u) => u.role === "SUPER_ADMIN" && !u.deletedAt);
    if (isOwner && superadmin) {
      user = superadmin;
    } else {
      user = {
        id: `usr_g_${uid || Date.now()}`,
        fullName: displayName || email.split("@")[0],
        username: email,
        passwordHash: "",
        role,
        phone: "",
        status: "ACTIVE",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
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
    action: "Google orqali kirdi (Google Firebase Auth)",
    entity: "User",
    entityId: user.id,
    details: { email },
    ipAddress: req.ip || req.socket.remoteAddress
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
      status: user.status
    }
  });
});
authRouter.get("/me", requireAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Avtorizatsiya talab etiladi" });
  }
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      username: req.user.username,
      role: req.user.role,
      phone: req.user.phone,
      status: req.user.status
    }
  });
});

// server/routes/students.ts
import { Router as Router2 } from "express";

// server/services/telegramService.ts
var LOCKED_TELEGRAM_BOT_TOKEN = "8971004593:AAGhEKfqpiTomhDbIRnzuYHZtOaXxZqjOd4";
var LOCKED_ADMIN_CHAT_IDS = ["8821038107", "291171879"];
var LOCKED_BOT_USERNAME = "newrenaissancesupportcrmbot";
var TelegramService = class {
  constructor() {
    this.botToken = LOCKED_TELEGRAM_BOT_TOKEN;
    this.adminChatIds = LOCKED_ADMIN_CHAT_IDS;
    this.enabled = true;
    this.isLocked = true;
    this.sendPasswordInTelegram = true;
  }
  // Configuration is permanently locked - cannot be modified or stolen
  updateConfig(settings) {
    if (settings.sendPasswordInTelegram !== void 0) {
      this.sendPasswordInTelegram = Boolean(settings.sendPasswordInTelegram);
    }
  }
  getConfig() {
    return {
      botToken: `${this.botToken.slice(0, 10)}...${this.botToken.slice(-6)}`,
      adminChatId: this.adminChatIds.join(", "),
      adminChatIds: this.adminChatIds,
      botUsername: LOCKED_BOT_USERNAME,
      enabled: this.enabled,
      isLocked: this.isLocked,
      sendPasswordInTelegram: this.sendPasswordInTelegram
    };
  }
  getRawConfig() {
    return {
      botToken: this.botToken,
      adminChatId: this.adminChatIds.join(", "),
      adminChatIds: this.adminChatIds,
      botUsername: LOCKED_BOT_USERNAME,
      enabled: this.enabled,
      isLocked: this.isLocked,
      sendPasswordInTelegram: this.sendPasswordInTelegram
    };
  }
  async sendMessage(text, customChatId) {
    const targetChatIds = customChatId ? [customChatId] : this.adminChatIds;
    const results = [];
    let atLeastOneSuccess = false;
    let lastError = "";
    for (const chatId of targetChatIds) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            text,
            parse_mode: "HTML"
          })
        });
        const data = await response.json();
        if (response.ok && data.ok) {
          results.push({ chatId, success: true, messageId: data.result?.message_id });
          atLeastOneSuccess = true;
        } else {
          const desc = data.description || "Xatolik";
          results.push({ chatId, success: false, error: desc });
          lastError = `${chatId}: ${desc}`;
        }
      } catch (err) {
        results.push({ chatId, success: false, error: err.message });
        lastError = `${chatId}: ${err.message}`;
      }
    }
    return {
      success: atLeastOneSuccess,
      results,
      error: atLeastOneSuccess ? void 0 : lastError
    };
  }
  async notifyNewStudent(data) {
    const passwordSection = this.sendPasswordInTelegram && data.initialPassword ? `
\u{1F510} <b>Ota-ona portali paroli:</b> <code>${data.initialPassword}</code>
` : "";
    const message = `<b>\u{1F195} YANGI O\u2018QUVCHI RO\u2018YXATGA OLINDI</b>

\u{1F464} <b>O\u2018quvchi:</b> ${data.firstName} ${data.lastName}
\u{1F194} <b>Student ID:</b> <code>${data.studentId}</code>
\u{1F4DE} <b>Telefon:</b> ${data.phone || "Ko\u2018rsatilmagan"}
\u{1F468}\u200D\u{1F469}\u200D\u{1F467} <b>Ota-onasi:</b> ${data.parentPhone || "Ko\u2018rsatilmagan"}

\u{1F4DA} <b>Kurs:</b> ${data.courseName || "Belgilanmagan"}
\u{1F465} <b>Guruh:</b> ${data.groupName || "Biriktirilmagan"}
\u{1F468}\u200D\u{1F3EB} <b>O\u2018qituvchi:</b> ${data.teacherName || "Biriktirilmagan"}
\u{1F550} <b>Dars vaqti:</b> ${data.lessonTime || "Jadval bo\u2018yicha"}${passwordSection}
\u{1F4C5} <b>Ro\u2018yxatdan o\u2018tgan vaqt:</b> ${data.createdDate}

<i>EduCenter CRM \u2022 Rasmiy Admin Bildirishnomasi</i>`;
    return this.sendMessage(message);
  }
  async sendTestPing(customChatId) {
    const time = (/* @__PURE__ */ new Date()).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
    const text = `\u{1F514} <b>EduCenter CRM \u2014 Rasmiy Integratsiya Testi</b>

\u2705 <b>Telegram Bot muvaffaqiyatli ishlamoqda!</b>
\u{1F916} <b>Bot:</b> @${LOCKED_BOT_USERNAME}
\u{1F451} <b>Asosiy Adminlar:</b> <code>${this.adminChatIds.join(" va ")}</code>
\u23F0 <b>Vaqt:</b> ${time}

\u{1F512} <i>Integratsiya qat\u2019iy qulflangan: Begona foydalanuvchilar bot ma\u2019lumotlarini o\u2018zgartira olmaydi. Barcha muhim yangiliklar ushbu hisoblarga yuboriladi.</i>`;
    return this.sendMessage(text, customChatId);
  }
};
var telegramService = new TelegramService();

// server/routes/students.ts
var studentsRouter = Router2();
function getStudentFinancials(studentId, currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7)) {
  const student = db.students.find((s) => s.id === studentId || s.studentId === studentId);
  if (!student) return { monthlyFee: 0, totalPaidThisMonth: 0, debtThisMonth: 0, totalPaidAllTime: 0 };
  let monthlyFee = 0;
  if (student.groupId) {
    const group = db.groups.find((g) => g.id === student.groupId && !g.deletedAt);
    if (group) monthlyFee = group.monthlyFee;
  }
  if (!monthlyFee && student.courseId) {
    const course = db.courses.find((c) => c.id === student.courseId && !c.deletedAt);
    if (course) monthlyFee = course.monthlyFee;
  }
  const allPayments = db.payments.filter((p) => p.studentId === student.id || p.studentId === student.studentId);
  const totalPaidAllTime = allPayments.reduce((acc, p) => acc + p.amount, 0);
  const thisMonthPayments = allPayments.filter((p) => p.forMonth === currentMonth);
  const totalPaidThisMonth = thisMonthPayments.reduce((acc, p) => acc + p.amount, 0);
  const debtThisMonth = Math.max(0, monthlyFee - totalPaidThisMonth);
  return {
    monthlyFee,
    totalPaidThisMonth,
    debtThisMonth,
    totalPaidAllTime
  };
}
studentsRouter.get("/", requireAuth, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const search = (req.query.search || "").trim().toLowerCase();
  const groupId = req.query.groupId;
  const courseId = req.query.courseId;
  const teacherId = req.query.teacherId;
  const status = req.query.status;
  const paymentFilter = req.query.paymentStatus;
  let teacherRestrictedGroupIds = null;
  if (req.user?.role === "TEACHER") {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile) {
      teacherRestrictedGroupIds = db.groups.filter((g) => g.teacherId === teacherProfile.id && !g.deletedAt).map((g) => g.id);
    } else {
      teacherRestrictedGroupIds = [];
    }
  }
  let list = db.students.filter((s) => !s.deletedAt);
  if (teacherRestrictedGroupIds !== null) {
    list = list.filter((s) => s.groupId && teacherRestrictedGroupIds.includes(s.groupId));
  }
  if (groupId) {
    list = list.filter((s) => s.groupId === groupId);
  }
  if (courseId) {
    list = list.filter((s) => s.courseId === courseId);
  }
  if (teacherId) {
    list = list.filter((s) => s.teacherId === teacherId);
  }
  if (status && status !== "ALL") {
    list = list.filter((s) => s.status === status);
  }
  if (search) {
    list = list.filter((s) => {
      return s.studentId.toLowerCase().includes(search) || s.firstName.toLowerCase().includes(search) || s.lastName.toLowerCase().includes(search) || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search) || s.phone.replace(/[^0-9]/g, "").includes(search.replace(/[^0-9]/g, "")) || s.parentPhone && s.parentPhone.replace(/[^0-9]/g, "").includes(search.replace(/[^0-9]/g, ""));
    });
  }
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const enriched = list.map((s) => {
    const course = db.courses.find((c) => c.id === s.courseId);
    const group = db.groups.find((g) => g.id === s.groupId);
    const teacher = db.teachers.find((t) => t.id === (s.teacherId || group?.teacherId));
    const financials = getStudentFinancials(s.id, currentMonth);
    const isPaid = financials.debtThisMonth === 0 && financials.monthlyFee > 0;
    const isDebtor = financials.debtThisMonth > 0;
    return {
      ...s,
      courseName: course?.name || "Biriktirilmagan",
      groupName: group?.name || "Guruhsiz",
      teacherName: teacher?.fullName || "Tayinlanmagan",
      monthlyFee: financials.monthlyFee,
      paidThisMonth: financials.totalPaidThisMonth,
      debtThisMonth: financials.debtThisMonth,
      paymentStatus: isDebtor ? "DEBTOR" : isPaid ? "PAID" : "FREE"
    };
  });
  let filtered = enriched;
  if (paymentFilter === "DEBTOR") {
    filtered = enriched.filter((s) => s.debtThisMonth > 0);
  } else if (paymentFilter === "PAID") {
    filtered = enriched.filter((s) => s.debtThisMonth === 0 && s.monthlyFee > 0);
  }
  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  return res.json({
    success: true,
    data: paginated,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  });
});
studentsRouter.get("/:id", requireAuth, (req, res) => {
  const id = req.params.id;
  const student = db.students.find(
    (s) => (s.id === id || s.studentId === id) && !s.deletedAt
  );
  if (!student) {
    return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  }
  const course = db.courses.find((c) => c.id === student.courseId);
  const group = db.groups.find((g) => g.id === student.groupId);
  const teacher = db.teachers.find((t) => t.id === (student.teacherId || group?.teacherId));
  const credential = db.studentCredentials.find((c) => c.studentId === student.studentId);
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const financials = getStudentFinancials(student.id, currentMonth);
  const payments = db.payments.filter((p) => p.studentId === student.id || p.studentId === student.studentId).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  const attendanceRecords = db.attendance.filter((a) => a.studentId === student.id || a.studentId === student.studentId).sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const excusedCount = attendanceRecords.filter((a) => a.status === "EXCUSED").length;
  const totalLessons = attendanceRecords.length;
  const attendanceRate = totalLessons > 0 ? Math.round(presentCount / totalLessons * 100) : 100;
  return res.json({
    success: true,
    student: {
      ...student,
      courseName: course?.name,
      groupName: group?.name,
      teacherName: teacher?.fullName,
      groupDays: group?.days,
      groupTime: group ? `${group.startTime} - ${group.endTime}` : student.lessonTime,
      room: group?.room,
      financials,
      payments,
      attendance: {
        records: attendanceRecords,
        stats: {
          totalLessons,
          presentCount,
          absentCount,
          excusedCount,
          attendanceRate
        }
      },
      loginDetails: {
        studentId: student.studentId,
        login: student.studentId,
        hasInitialPassword: Boolean(credential?.plainTempPasswordShownOnce),
        initialPassword: credential?.plainTempPasswordShownOnce || null,
        isPasswordChanged: credential?.isPasswordChanged || false
      }
    }
  });
});
studentsRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN", "OPERATOR"]), async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    birthDate,
    gender,
    parentName,
    parentPhone,
    courseId,
    groupId,
    lessonTime,
    notes,
    avatarUrl
  } = req.body;
  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ success: false, error: "O\u2018quvchining ismi kiritilishi shart" });
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).json({ success: false, error: "O\u2018quvchining familiyasi kiritilishi shart" });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, error: "Telefon raqam kiritilishi shart" });
  }
  let selectedCourse = null;
  let selectedGroup = null;
  let teacherId = req.body.teacherId || null;
  let calculatedLessonTime = lessonTime || "";
  if (courseId) {
    selectedCourse = db.courses.find((c) => c.id === courseId && !c.deletedAt);
    if (!selectedCourse) {
      return res.status(400).json({ success: false, error: "Tanlangan kurs mavjud emas" });
    }
  }
  if (groupId) {
    selectedGroup = db.groups.find((g) => g.id === groupId && !g.deletedAt);
    if (!selectedGroup) {
      return res.status(400).json({ success: false, error: "Tanlangan guruh mavjud emas" });
    }
    teacherId = selectedGroup.teacherId;
    if (!calculatedLessonTime) {
      calculatedLessonTime = `${selectedGroup.days.join(", ")} (${selectedGroup.startTime} - ${selectedGroup.endTime})`;
    }
  }
  const teacher = teacherId ? db.teachers.find((t) => t.id === teacherId) : null;
  const existingStudentIds = db.students.map((s) => s.studentId);
  const newStudentId = generateUniqueStudentId(existingStudentIds);
  const { plainText, hash } = generateStudentPassword(lastName.trim());
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const studentDbId = `std_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newStudent = {
    id: studentDbId,
    studentId: newStudentId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    birthDate: birthDate || void 0,
    gender: gender || "ERKAK",
    parentName: parentName ? parentName.trim() : void 0,
    parentPhone: parentPhone ? parentPhone.trim() : void 0,
    courseId: courseId || selectedGroup?.courseId,
    groupId: groupId || void 0,
    teacherId: teacherId || void 0,
    lessonTime: calculatedLessonTime,
    notes: notes ? notes.trim() : "",
    avatarUrl: avatarUrl || "",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
  const newCredential = {
    studentId: newStudentId,
    login: newStudentId,
    passwordHash: hash,
    plainTempPasswordShownOnce: plainText,
    isPasswordChanged: false,
    createdAt: now,
    updatedAt: now
  };
  db.students.push(newStudent);
  db.studentCredentials.push(newCredential);
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Yangi o\u2018quvchi yaratildi",
    entity: "Student",
    entityId: newStudent.id,
    details: {
      studentId: newStudentId,
      fullName: `${newStudent.firstName} ${newStudent.lastName}`,
      group: selectedGroup?.name,
      course: selectedCourse?.name
    },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  const createdDateFormatted = (/* @__PURE__ */ new Date()).toLocaleDateString("uz-UZ");
  telegramService.notifyNewStudent({
    firstName: newStudent.firstName,
    lastName: newStudent.lastName,
    studentId: newStudentId,
    courseName: selectedCourse?.name || "Kurs belgilanmagan",
    groupName: selectedGroup?.name || "Guruh belgilanmagan",
    teacherName: teacher?.fullName || "Tayinlanmagan",
    lessonTime: calculatedLessonTime || "Belgilanmagan",
    initialPassword: plainText,
    createdDate: createdDateFormatted
  }).catch((err) => {
    console.warn("Telegram notification delivery note:", err?.message || err);
  });
  return res.status(201).json({
    success: true,
    message: "Yangi o\u2018quvchi muvaffaqiyatli ro\u2018yxatdan o\u2018tkazildi",
    student: newStudent,
    credentials: {
      studentId: newStudentId,
      login: newStudentId,
      initialPassword: plainText,
      note: "Ushbu parolni o\u2018quvchiga yoki uning ota-onasiga taqdim eting."
    }
  });
});
studentsRouter.patch("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN", "OPERATOR"]), (req, res) => {
  const id = req.params.id;
  const student = db.students.find((s) => (s.id === id || s.studentId === id) && !s.deletedAt);
  if (!student) {
    return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  }
  const {
    firstName,
    lastName,
    phone,
    birthDate,
    gender,
    parentName,
    parentPhone,
    courseId,
    groupId,
    teacherId,
    lessonTime,
    notes,
    avatarUrl,
    status
  } = req.body;
  if (firstName !== void 0) student.firstName = firstName.trim();
  if (lastName !== void 0) student.lastName = lastName.trim();
  if (phone !== void 0) student.phone = phone.trim();
  if (birthDate !== void 0) student.birthDate = birthDate;
  if (gender !== void 0) student.gender = gender;
  if (parentName !== void 0) student.parentName = parentName.trim();
  if (parentPhone !== void 0) student.parentPhone = parentPhone.trim();
  if (courseId !== void 0) student.courseId = courseId;
  if (groupId !== void 0) {
    student.groupId = groupId;
    if (groupId) {
      const group = db.groups.find((g) => g.id === groupId);
      if (group) {
        student.teacherId = group.teacherId;
        student.courseId = group.courseId;
        if (!lessonTime) {
          student.lessonTime = `${group.days.join(", ")} (${group.startTime} - ${group.endTime})`;
        }
      }
    }
  }
  if (teacherId !== void 0) student.teacherId = teacherId;
  if (lessonTime !== void 0) student.lessonTime = lessonTime;
  if (notes !== void 0) student.notes = notes;
  if (avatarUrl !== void 0) student.avatarUrl = avatarUrl;
  if (status !== void 0) student.status = status;
  student.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "O\u2018quvchi ma\u2019lumotlari tahrirlandi",
    entity: "Student",
    entityId: student.id,
    details: { studentId: student.studentId, updatedFields: Object.keys(req.body) },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({
    success: true,
    message: "O\u2018quvchi ma\u2019lumotlari yangilandi",
    student
  });
});
studentsRouter.post("/:id/regenerate-password", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const student = db.students.find((s) => (s.id === id || s.studentId === id) && !s.deletedAt);
  if (!student) {
    return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  }
  const { plainText, hash } = generateStudentPassword(student.lastName);
  let cred = db.studentCredentials.find((c) => c.studentId === student.studentId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (!cred) {
    cred = {
      studentId: student.studentId,
      login: student.studentId,
      passwordHash: hash,
      plainTempPasswordShownOnce: plainText,
      isPasswordChanged: false,
      createdAt: now,
      updatedAt: now
    };
    db.studentCredentials.push(cred);
  } else {
    cred.passwordHash = hash;
    cred.plainTempPasswordShownOnce = plainText;
    cred.isPasswordChanged = false;
    cred.updatedAt = now;
  }
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "O\u2018quvchi paroli qayta yaratildi (Reset Password)",
    entity: "StudentCredential",
    entityId: student.studentId,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({
    success: true,
    message: "Yangi parol yaratildi",
    newPassword: plainText,
    login: student.studentId
  });
});
studentsRouter.delete("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const student = db.students.find((s) => (s.id === id || s.studentId === id) && !s.deletedAt);
  if (!student) {
    return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  }
  student.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
  student.status = "LEFT";
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "O\u2018quvchi o\u2018chirildi (Soft Delete)",
    entity: "Student",
    entityId: student.id,
    details: { studentId: student.studentId, fullName: `${student.firstName} ${student.lastName}` },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({
    success: true,
    message: "O\u2018quvchi muvaffaqiyatli arxivlandi/o\u2018chirildi"
  });
});

// server/routes/courses.ts
import { Router as Router3 } from "express";
var coursesRouter = Router3();
coursesRouter.get("/", requireAuth, (req, res) => {
  const courses = db.courses.filter((c) => !c.deletedAt);
  const enriched = courses.map((course) => {
    const groupsCount = db.groups.filter((g) => g.courseId === course.id && !g.deletedAt).length;
    const studentsCount = db.students.filter((s) => s.courseId === course.id && !s.deletedAt && s.status === "ACTIVE").length;
    return {
      ...course,
      groupsCount,
      studentsCount
    };
  });
  return res.json({ success: true, data: enriched });
});
coursesRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const { name, description, durationMonths, monthlyFee, price, startDate, endDate, startMonth, endMonth } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Kurs nomi kiritilishi shart" });
  }
  const fee = Number(monthlyFee !== void 0 ? monthlyFee : price) || 0;
  const duration = Number(durationMonths) || 1;
  const newCourse = {
    id: `crs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    description: description ? description.trim() : "",
    durationMonths: duration,
    monthlyFee: fee,
    startDate: startDate || startMonth || "",
    endDate: endDate || endMonth || "",
    status: "ACTIVE",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.courses.push(newCourse);
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Yangi kurs yaratildi",
    entity: "Course",
    entityId: newCourse.id,
    details: { name: newCourse.name, fee: newCourse.monthlyFee },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.status(201).json({ success: true, course: newCourse });
});
coursesRouter.patch("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const course = db.courses.find((c) => c.id === id && !c.deletedAt);
  if (!course) {
    return res.status(404).json({ success: false, error: "Kurs topilmadi" });
  }
  const { name, description, durationMonths, monthlyFee, status } = req.body;
  if (name !== void 0) course.name = name.trim();
  if (description !== void 0) course.description = description.trim();
  if (durationMonths !== void 0) course.durationMonths = Number(durationMonths);
  if (monthlyFee !== void 0) course.monthlyFee = Number(monthlyFee);
  if (status !== void 0) course.status = status;
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Kurs tahrirlandi",
    entity: "Course",
    entityId: course.id,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({ success: true, course });
});
coursesRouter.delete("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const course = db.courses.find((c) => c.id === id && !c.deletedAt);
  if (!course) {
    return res.status(404).json({ success: false, error: "Kurs topilmadi" });
  }
  course.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
  course.status = "INACTIVE";
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Kurs o\u2018chirildi",
    entity: "Course",
    entityId: course.id,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({ success: true, message: "Kurs muvaffaqiyatli o\u2018chirildi" });
});

// server/routes/groups.ts
import { Router as Router4 } from "express";
var groupsRouter = Router4();
groupsRouter.get("/", requireAuth, (req, res) => {
  let groups = db.groups.filter((g) => !g.deletedAt);
  if (req.user?.role === "TEACHER") {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile) {
      groups = groups.filter((g) => g.teacherId === teacherProfile.id);
    } else {
      groups = [];
    }
  }
  const enriched = groups.map((g) => {
    const course = db.courses.find((c) => c.id === g.courseId);
    const teacher = db.teachers.find((t) => t.id === g.teacherId);
    const studentsInGroup = db.students.filter(
      (s) => s.groupId === g.id && !s.deletedAt && s.status === "ACTIVE"
    );
    return {
      ...g,
      courseName: course?.name || "Kurs mavjud emas",
      teacherName: teacher?.fullName || "O\u2018qituvchi tayinlanmagan",
      studentCount: studentsInGroup.length
    };
  });
  return res.json({ success: true, data: enriched });
});
groupsRouter.get("/:id", requireAuth, (req, res) => {
  const id = req.params.id;
  const group = db.groups.find((g) => g.id === id && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: "Guruh topilmadi" });
  }
  const course = db.courses.find((c) => c.id === group.courseId);
  const teacher = db.teachers.find((t) => t.id === group.teacherId);
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const enrolledStudents = db.students.filter((s) => s.groupId === group.id && !s.deletedAt).map((s) => {
    const financials = getStudentFinancials(s.id, currentMonth);
    return {
      ...s,
      monthlyFee: financials.monthlyFee,
      paidThisMonth: financials.totalPaidThisMonth,
      debtThisMonth: financials.debtThisMonth
    };
  });
  const groupAttendance = db.attendance.filter((a) => a.groupId === group.id).sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());
  return res.json({
    success: true,
    group: {
      ...group,
      courseName: course?.name,
      teacherName: teacher?.fullName,
      students: enrolledStudents,
      recentAttendanceCount: groupAttendance.length
    }
  });
});
groupsRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const {
    name,
    courseId,
    teacherId,
    startDate,
    endDate,
    days,
    startTime,
    endTime,
    room,
    maxStudents,
    monthlyFee
  } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: "Guruh nomi kiritilishi shart" });
  }
  if (!courseId) {
    return res.status(400).json({ success: false, error: "Kurs tanlanishi shart" });
  }
  const course = db.courses.find((c) => c.id === courseId && !c.deletedAt);
  const teacher = teacherId ? db.teachers.find((t) => t.id === teacherId && !t.deletedAt) : null;
  const fee = monthlyFee !== void 0 && monthlyFee !== null ? Number(monthlyFee) : course?.monthlyFee || 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newGroupId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const dayList = Array.isArray(days) && days.length > 0 ? days : ["Dushanba", "Chorshanba", "Juma"];
  const newGroup = {
    id: newGroupId,
    name: name.trim(),
    courseId,
    teacherId: teacherId || "",
    startDate: startDate || now.slice(0, 10),
    endDate: endDate || "",
    days: dayList,
    startTime: startTime || "18:00",
    endTime: endTime || "19:30",
    room: room || "Asosiy xona",
    maxStudents: Number(maxStudents) || 16,
    monthlyFee: fee,
    status: "ACTIVE",
    createdAt: now
  };
  db.groups.push(newGroup);
  dayList.forEach((day) => {
    const scheduleEntry = {
      id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      groupId: newGroupId,
      courseId,
      teacherId,
      dayOfWeek: day,
      startTime: newGroup.startTime,
      endTime: newGroup.endTime,
      room: newGroup.room,
      createdAt: now
    };
    db.schedules.push(scheduleEntry);
  });
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Yangi guruh ochildi",
    entity: "Group",
    entityId: newGroupId,
    details: { name: newGroup.name, course: course?.name, teacher: teacher?.fullName },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.status(201).json({ success: true, group: newGroup });
});
groupsRouter.patch("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const group = db.groups.find((g) => g.id === id && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: "Guruh topilmadi" });
  }
  const {
    name,
    courseId,
    teacherId,
    startDate,
    days,
    startTime,
    endTime,
    room,
    maxStudents,
    monthlyFee,
    status
  } = req.body;
  if (name !== void 0) group.name = name.trim();
  if (courseId !== void 0) group.courseId = courseId;
  if (teacherId !== void 0) group.teacherId = teacherId;
  if (startDate !== void 0) group.startDate = startDate;
  if (days !== void 0 && Array.isArray(days)) group.days = days;
  if (startTime !== void 0) group.startTime = startTime;
  if (endTime !== void 0) group.endTime = endTime;
  if (room !== void 0) group.room = room;
  if (maxStudents !== void 0) group.maxStudents = Number(maxStudents);
  if (monthlyFee !== void 0) group.monthlyFee = Number(monthlyFee);
  if (status !== void 0) group.status = status;
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Guruh tahrirlandi",
    entity: "Group",
    entityId: group.id,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({ success: true, group });
});
groupsRouter.delete("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const group = db.groups.find((g) => g.id === id && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: "Guruh topilmadi" });
  }
  group.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
  group.status = "COMPLETED";
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Guruh o\u2018chirildi",
    entity: "Group",
    entityId: group.id,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({ success: true, message: "Guruh muvaffaqiyatli arxivlandi" });
});

// server/routes/teachers.ts
import { Router as Router5 } from "express";
var teachersRouter = Router5();
teachersRouter.get("/", requireAuth, (req, res) => {
  const teachers = db.teachers.filter((t) => !t.deletedAt);
  const enriched = teachers.map((teacher) => {
    const activeGroups = db.groups.filter((g) => g.teacherId === teacher.id && !g.deletedAt);
    const groupIds = activeGroups.map((g) => g.id);
    const activeStudents = db.students.filter(
      (s) => s.groupId && groupIds.includes(s.groupId) && !s.deletedAt && s.status === "ACTIVE"
    );
    return {
      ...teacher,
      groupsCount: activeGroups.length,
      studentsCount: activeStudents.length,
      groups: activeGroups.map((g) => ({ id: g.id, name: g.name }))
    };
  });
  return res.json({ success: true, data: enriched });
});
teachersRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const { fullName, phone, specialty, subject, bio, salaryRate } = req.body;
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ success: false, error: "O\u2018qituvchi ismi kiritilishi shart" });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, error: "Telefon raqam kiritilishi shart" });
  }
  const spec = (specialty || subject || "Umumiy").trim();
  const newTeacher = {
    id: `tch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fullName: fullName.trim(),
    phone: phone.trim(),
    specialty: spec,
    bio: bio ? bio.trim() : "",
    salaryRate: Number(salaryRate) || 50,
    status: "ACTIVE",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.teachers.push(newTeacher);
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "Yangi o\u2018qituvchi qo\u2018shildi",
    entity: "Teacher",
    entityId: newTeacher.id,
    details: { fullName: newTeacher.fullName, specialty: newTeacher.specialty },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.status(201).json({ success: true, teacher: newTeacher });
});
teachersRouter.patch("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const teacher = db.teachers.find((t) => t.id === id && !t.deletedAt);
  if (!teacher) {
    return res.status(404).json({ success: false, error: "O\u2018qituvchi topilmadi" });
  }
  const { fullName, phone, specialty, bio, salaryRate, status } = req.body;
  if (fullName !== void 0) teacher.fullName = fullName.trim();
  if (phone !== void 0) teacher.phone = phone.trim();
  if (specialty !== void 0) teacher.specialty = specialty.trim();
  if (bio !== void 0) teacher.bio = bio.trim();
  if (salaryRate !== void 0) teacher.salaryRate = Number(salaryRate);
  if (status !== void 0) teacher.status = status;
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "O\u2018qituvchi ma\u2019lumotlari yangilandi",
    entity: "Teacher",
    entityId: teacher.id,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({ success: true, teacher });
});
teachersRouter.delete("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const teacher = db.teachers.find((t) => t.id === id && !t.deletedAt);
  if (!teacher) {
    return res.status(404).json({ success: false, error: "O\u2018qituvchi topilmadi" });
  }
  teacher.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
  teacher.status = "INACTIVE";
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "O\u2018qituvchi o\u2018chirildi",
    entity: "Teacher",
    entityId: teacher.id,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({ success: true, message: "O\u2018qituvchi muvaffaqiyatli arxivlandi" });
});

// server/routes/attendance.ts
import { Router as Router6 } from "express";
var attendanceRouter = Router6();
attendanceRouter.get("/", requireAuth, (req, res) => {
  const { groupId, date } = req.query;
  if (!groupId) {
    return res.status(400).json({ success: false, error: "Guruh ID kiritilishi shart" });
  }
  const lessonDate = date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const group = db.groups.find((g) => g.id === groupId && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: "Guruh topilmadi" });
  }
  if (req.user?.role === "TEACHER") {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile && group.teacherId !== teacherProfile.id) {
      return res.status(403).json({ success: false, error: "Siz faqat o\u2018z guruhlaringiz davomatini ko\u2018ra olasiz" });
    }
  }
  const students = db.students.filter(
    (s) => s.groupId === groupId && !s.deletedAt && s.status === "ACTIVE"
  );
  const existingAttendance = db.attendance.filter(
    (a) => a.groupId === groupId && a.lessonDate === lessonDate
  );
  const attendanceMap = /* @__PURE__ */ new Map();
  existingAttendance.forEach((a) => attendanceMap.set(a.studentId, a));
  const records = students.map((s) => {
    const existing = attendanceMap.get(s.id) || attendanceMap.get(s.studentId);
    return {
      studentId: s.id,
      studentCode: s.studentId,
      fullName: `${s.firstName} ${s.lastName}`,
      status: existing?.status || null,
      notes: existing?.notes || ""
    };
  });
  return res.json({
    success: true,
    groupId,
    groupName: group.name,
    date: lessonDate,
    students: records
  });
});
var handleMarkAttendance = (req, res) => {
  const { groupId, date, records } = req.body;
  if (!groupId || !date || !Array.isArray(records)) {
    return res.status(400).json({ success: false, error: "Noto\u2018g\u2018ri ma\u2019lumot formati" });
  }
  const group = db.groups.find((g) => g.id === groupId && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: "Guruh topilmadi" });
  }
  if (req.user?.role === "TEACHER") {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile && group.teacherId !== teacherProfile.id) {
      return res.status(403).json({ success: false, error: "Faqat o\u2018z guruhingiz davomatini belgilay olasiz" });
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  records.forEach((rec) => {
    if (!rec.status) return;
    const existingIndex = db.attendance.findIndex(
      (a) => a.groupId === groupId && a.lessonDate === date && a.studentId === rec.studentId
    );
    if (existingIndex >= 0) {
      db.attendance[existingIndex].status = rec.status;
      db.attendance[existingIndex].notes = rec.notes || "";
      db.attendance[existingIndex].markedBy = req.user?.id;
    } else {
      db.attendance.push({
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId,
        studentId: rec.studentId,
        lessonDate: date,
        status: rec.status,
        notes: rec.notes || "",
        markedBy: req.user?.id,
        createdAt: now
      });
    }
  });
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "User",
    userRole: req.user?.role || "TEACHER",
    action: "Davomat belgilandi",
    entity: "Attendance",
    entityId: groupId,
    details: { group: group.name, date, markedCount: records.length },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({
    success: true,
    message: "Davomat muvaffaqiyatli saqlandi"
  });
};
attendanceRouter.post("/", requireAuth, handleMarkAttendance);
attendanceRouter.post("/batch", requireAuth, handleMarkAttendance);
attendanceRouter.get("/stats", requireAuth, (req, res) => {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let groups = db.groups.filter((g) => !g.deletedAt);
  if (req.user?.role === "TEACHER") {
    const teacherProfile = db.teachers.find(
      (t) => t.userId === req.user?.id || t.fullName === req.user?.fullName
    );
    if (teacherProfile) {
      groups = groups.filter((g) => g.teacherId === teacherProfile.id);
    } else {
      groups = [];
    }
  }
  const teacherGroupIds = new Set(groups.map((g) => g.id));
  const todayRecords = db.attendance.filter(
    (a) => a.lessonDate === today && (req.user?.role !== "TEACHER" || teacherGroupIds.has(a.groupId))
  );
  const todayPresent = todayRecords.filter((a) => a.status === "PRESENT").length;
  const todayAbsent = todayRecords.filter((a) => a.status === "ABSENT").length;
  const todayExcused = todayRecords.filter((a) => a.status === "EXCUSED").length;
  const totalMarkedToday = todayRecords.length;
  const todayRate = totalMarkedToday > 0 ? Math.round(todayPresent / totalMarkedToday * 100) : 100;
  const groupsStats = groups.map((g) => {
    const groupAttendance = db.attendance.filter((a) => a.groupId === g.id);
    const groupPresent = groupAttendance.filter((a) => a.status === "PRESENT").length;
    const rate = groupAttendance.length > 0 ? Math.round(groupPresent / groupAttendance.length * 100) : 100;
    return {
      groupId: g.id,
      groupName: g.name,
      totalChecked: groupAttendance.length,
      presentCount: groupPresent,
      attendanceRate: rate
    };
  });
  return res.json({
    success: true,
    stats: {
      todayDate: today,
      todayMarked: totalMarkedToday,
      todayPresent,
      todayAbsent,
      todayExcused,
      todayRate,
      groups: groupsStats
    }
  });
});

// server/routes/payments.ts
import { Router as Router7 } from "express";
var paymentsRouter = Router7();
paymentsRouter.get("/", requireAuth, (req, res) => {
  const { studentId, month, paymentType, search } = req.query;
  let list = [...db.payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
  if (studentId) {
    list = list.filter((p) => p.studentId === studentId);
  }
  if (month) {
    list = list.filter((p) => p.forMonth === month);
  }
  if (paymentType && paymentType !== "ALL") {
    list = list.filter((p) => p.paymentType === paymentType);
  }
  const enriched = list.map((payment) => {
    const student = db.students.find(
      (s) => s.id === payment.studentId || s.studentId === payment.studentId
    );
    const group = student?.groupId ? db.groups.find((g) => g.id === student.groupId) : null;
    const course = student?.courseId ? db.courses.find((c) => c.id === student.courseId) : null;
    return {
      ...payment,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Noma\u2019lum o\u2018quvchi",
      studentCode: student?.studentId || "-",
      groupName: group?.name || "Guruhsiz",
      courseName: course?.name || "Kurs belgilanmagan",
      studentPhone: student?.phone || "-"
    };
  });
  let filtered = enriched;
  if (search) {
    const q = search.toLowerCase().trim();
    filtered = enriched.filter(
      (p) => p.studentName.toLowerCase().includes(q) || p.studentCode.includes(q) || p.receiptNumber && p.receiptNumber.toLowerCase().includes(q) || p.studentPhone.includes(q)
    );
  }
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const totalRevenueAllTime = db.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalRevenueThisMonth = db.payments.filter((p) => p.forMonth === currentMonth).reduce((sum, p) => sum + p.amount, 0);
  let totalDebtInSystem = 0;
  let debtorsCount = 0;
  db.students.filter((s) => !s.deletedAt && s.status === "ACTIVE").forEach((s) => {
    const fin = getStudentFinancials(s.id, currentMonth);
    if (fin.debtThisMonth > 0) {
      totalDebtInSystem += fin.debtThisMonth;
      debtorsCount++;
    }
  });
  return res.json({
    success: true,
    data: filtered,
    stats: {
      totalRevenueAllTime,
      totalRevenueThisMonth,
      totalDebtInSystem,
      debtorsCount,
      currentMonth
    }
  });
});
paymentsRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const { studentId, amount, paymentDate, forMonth, paymentType, notes } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, error: "O\u2018quvchi tanlanishi shart" });
  }
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: "To\u2018lov summasi 0 dan katta bo\u2018lishi shart" });
  }
  const student = db.students.find((s) => s.id === studentId || s.studentId === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const dateStr = paymentDate || now.slice(0, 10);
  const monthStr = forMonth || dateStr.slice(0, 7);
  const receiptNumber = `PAY-${Date.now().toString().slice(-6)}`;
  const newPayment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    studentId: student.id,
    amount: numericAmount,
    paymentDate: dateStr,
    forMonth: monthStr,
    paymentType: paymentType || "CASH",
    receiptNumber,
    notes: notes ? notes.trim() : "",
    recordedBy: req.user?.fullName || "Admin",
    createdAt: now
  };
  db.payments.unshift(newPayment);
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "Admin",
    userRole: req.user?.role || "ADMIN",
    action: "To\u2018lov qabul qilindi",
    entity: "Payment",
    entityId: newPayment.id,
    details: {
      student: `${student.firstName} ${student.lastName}`,
      studentCode: student.studentId,
      amount: numericAmount,
      receiptNumber,
      forMonth: monthStr
    },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.status(201).json({
    success: true,
    message: "To\u2018lov muvaffaqiyatli qabul qilindi",
    payment: newPayment
  });
});

// server/routes/schedules.ts
import { Router as Router8 } from "express";
var schedulesRouter = Router8();
schedulesRouter.get("/", requireAuth, (req, res) => {
  const { teacherId, day } = req.query;
  let list = db.schedules;
  if (teacherId) {
    list = list.filter((s) => s.teacherId === teacherId);
  }
  if (day) {
    list = list.filter((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase());
  }
  const enriched = list.map((sch) => {
    const group = db.groups.find((g) => g.id === sch.groupId);
    const course = db.courses.find((c) => c.id === sch.courseId);
    const teacher = db.teachers.find((t) => t.id === sch.teacherId);
    const studentCount = group ? db.students.filter((s) => s.groupId === group.id && !s.deletedAt).length : 0;
    return {
      ...sch,
      groupName: group?.name || "Guruhsiz",
      courseName: course?.name || "Kurs nomi",
      teacherName: teacher?.fullName || "O\u2018qituvchi",
      studentCount
    };
  });
  return res.json({ success: true, data: enriched });
});
schedulesRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const { groupId, dayOfWeek, startTime, endTime, room } = req.body;
  const group = db.groups.find((g) => g.id === groupId && !g.deletedAt);
  if (!group) {
    return res.status(404).json({ success: false, error: "Guruh topilmadi" });
  }
  const newSchedule = {
    id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    groupId,
    courseId: group.courseId,
    teacherId: group.teacherId,
    dayOfWeek: dayOfWeek || "Dushanba",
    startTime: startTime || group.startTime,
    endTime: endTime || group.endTime,
    room: room || group.room,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.schedules.push(newSchedule);
  db.save();
  return res.status(201).json({ success: true, schedule: newSchedule });
});
schedulesRouter.delete("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const index = db.schedules.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Dars jadvali bandi topilmadi" });
  }
  db.schedules.splice(index, 1);
  db.save();
  return res.json({ success: true, message: "Dars jadvali bandi o\u2018chirildi" });
});

// server/routes/dashboard.ts
import { Router as Router9 } from "express";
var dashboardRouter = Router9();
var UZBEK_DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
dashboardRouter.get("/stats", requireAuth, (req, res) => {
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const currentDayIndex = (/* @__PURE__ */ new Date()).getDay();
  const currentDayName = UZBEK_DAYS[currentDayIndex];
  let teacherProfile = null;
  let teacherGroupIds = null;
  if (req.user?.role === "TEACHER") {
    teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile) {
      teacherGroupIds = db.groups.filter((g) => g.teacherId === teacherProfile.id && !g.deletedAt).map((g) => g.id);
    } else {
      teacherGroupIds = [];
    }
  }
  let allStudents = db.students.filter((s) => !s.deletedAt);
  if (teacherGroupIds !== null) {
    allStudents = allStudents.filter((s) => s.groupId && teacherGroupIds.includes(s.groupId));
  }
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter((s) => s.status === "ACTIVE").length;
  let allGroups = db.groups.filter((g) => !g.deletedAt);
  if (teacherGroupIds !== null) {
    allGroups = allGroups.filter((g) => teacherGroupIds.includes(g.id));
  }
  const totalGroups = allGroups.length;
  const totalTeachers = db.teachers.filter((t) => !t.deletedAt && t.status === "ACTIVE").length;
  const todaySchedules = db.schedules.filter((s) => {
    const isToday = s.dayOfWeek.toLowerCase() === currentDayName.toLowerCase();
    if (!isToday) return false;
    if (teacherGroupIds !== null) return teacherGroupIds.includes(s.groupId);
    return true;
  });
  const todayLessonsCount = todaySchedules.length;
  const todayLessons = todaySchedules.map((s) => {
    const group = db.groups.find((g) => g.id === s.groupId);
    const course = group ? db.courses.find((c) => c.id === group.courseId) : null;
    const teacher = s.teacherId ? db.teachers.find((t) => t.id === s.teacherId) : null;
    const hasAttendanceToday = db.attendance.some((a) => a.groupId === s.groupId && a.lessonDate === today);
    return {
      id: s.id,
      groupId: s.groupId,
      groupName: group?.name || "Guruh",
      courseName: course?.name || "Kurs",
      teacherName: teacher?.fullName || "O\u2018qituvchi",
      room: s.room,
      startTime: s.startTime,
      endTime: s.endTime,
      hasAttendance: hasAttendanceToday
    };
  });
  let todayAttendanceRecords = db.attendance.filter((a) => a.lessonDate === today);
  if (teacherGroupIds !== null) {
    todayAttendanceRecords = todayAttendanceRecords.filter((a) => teacherGroupIds.includes(a.groupId));
  }
  const todayPresent = todayAttendanceRecords.filter((a) => a.status === "PRESENT").length;
  const todayTotalAttendance = todayAttendanceRecords.length;
  const todayAttendanceRate = todayTotalAttendance > 0 ? Math.round(todayPresent / todayTotalAttendance * 100) : 100;
  let debtorsCount = 0;
  let totalDebtAmount = 0;
  allStudents.forEach((student) => {
    if (student.status === "ACTIVE") {
      const fin = getStudentFinancials(student.id, currentMonth);
      if (fin.debtThisMonth > 0) {
        debtorsCount++;
        totalDebtAmount += fin.debtThisMonth;
      }
    }
  });
  const monthlyPayments = db.payments.filter((p) => p.forMonth === currentMonth);
  const currentMonthRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyRevenueChart = [];
  const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const now = /* @__PURE__ */ new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.toISOString().slice(0, 7);
    const rev = db.payments.filter((p) => p.forMonth === mStr).reduce((acc, p) => acc + p.amount, 0);
    monthlyRevenueChart.push({
      month: mStr,
      monthName: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
      revenue: rev
    });
  }
  const studentGrowthChart = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.toISOString().slice(0, 7);
    const count = db.students.filter((s) => s.createdAt.startsWith(mStr) && !s.deletedAt).length;
    studentGrowthChart.push({
      month: mStr,
      monthName: `${monthNames[d.getMonth()]}`,
      newStudents: count
    });
  }
  const totalAttRecords = db.attendance.length;
  const overallPresent = db.attendance.filter((a) => a.status === "PRESENT").length;
  const overallAbsent = db.attendance.filter((a) => a.status === "ABSENT").length;
  const overallExcused = db.attendance.filter((a) => a.status === "EXCUSED").length;
  const attendanceChart = [
    { name: "Keldi", count: overallPresent, color: "#10B981" },
    { name: "Kelmadi", count: overallAbsent, color: "#EF4444" },
    { name: "Sababli", count: overallExcused, color: "#F59E0B" }
  ];
  const studentsByCourse = db.courses.filter((c) => !c.deletedAt).map((c) => {
    const count = db.students.filter(
      (s) => s.courseId === c.id && !s.deletedAt && s.status === "ACTIVE"
    ).length;
    return {
      courseName: c.name,
      count
    };
  }).filter((c) => c.count > 0);
  const recentActivities = db.auditLogs.slice(0, 6);
  return res.json({
    success: true,
    data: {
      metrics: {
        totalStudents,
        activeStudents,
        totalGroups,
        totalTeachers,
        todayLessonsCount,
        todayAttendanceRate,
        todayAttendanceCount: todayTotalAttendance,
        debtorsCount,
        totalDebtAmount,
        currentMonthRevenue,
        currentMonth
      },
      charts: {
        monthlyRevenue: monthlyRevenueChart,
        studentGrowth: studentGrowthChart,
        attendanceBreakdown: attendanceChart,
        studentsByCourse
      },
      todayLessons,
      recentActivities
    }
  });
});

// server/routes/reports.ts
import { Router as Router10 } from "express";
var reportsRouter = Router10();
reportsRouter.get("/summary", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const totalStudents = db.students.filter((s) => !s.deletedAt).length;
  const activeStudents = db.students.filter((s) => !s.deletedAt && s.status === "ACTIVE").length;
  const frozenStudents = db.students.filter((s) => !s.deletedAt && s.status === "FROZEN").length;
  const leftStudents = db.students.filter((s) => s.deletedAt || s.status === "LEFT").length;
  const totalGroups = db.groups.filter((g) => !g.deletedAt).length;
  const activeGroups = db.groups.filter((g) => !g.deletedAt && g.status === "ACTIVE").length;
  const totalTeachers = db.teachers.filter((t) => !t.deletedAt && t.status === "ACTIVE").length;
  const debtorsList = [];
  let totalDebt = 0;
  db.students.filter((s) => !s.deletedAt && s.status === "ACTIVE").forEach((s) => {
    const fin = getStudentFinancials(s.id, currentMonth);
    if (fin.debtThisMonth > 0) {
      totalDebt += fin.debtThisMonth;
      const group = db.groups.find((g) => g.id === s.groupId);
      const course = db.courses.find((c) => c.id === s.courseId);
      debtorsList.push({
        studentId: s.id,
        studentCode: s.studentId,
        fullName: `${s.firstName} ${s.lastName}`,
        phone: s.phone,
        parentPhone: s.parentPhone,
        groupName: group?.name || "Guruhsiz",
        courseName: course?.name || "Kurs belgilanmagan",
        monthlyFee: fin.monthlyFee,
        paidThisMonth: fin.totalPaidThisMonth,
        debt: fin.debtThisMonth
      });
    }
  });
  const paymentsThisMonth = db.payments.filter((p) => p.forMonth === currentMonth);
  const totalRevenueThisMonth = paymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);
  const revenueByType = {
    CASH: paymentsThisMonth.filter((p) => p.paymentType === "CASH").reduce((sum, p) => sum + p.amount, 0),
    CARD: paymentsThisMonth.filter((p) => p.paymentType === "CARD").reduce((sum, p) => sum + p.amount, 0),
    BANK: paymentsThisMonth.filter((p) => p.paymentType === "BANK").reduce((sum, p) => sum + p.amount, 0),
    OTHER: paymentsThisMonth.filter((p) => p.paymentType === "OTHER").reduce((sum, p) => sum + p.amount, 0)
  };
  const teacherReport = db.teachers.filter((t) => !t.deletedAt).map((teacher) => {
    const teacherGroups = db.groups.filter((g) => g.teacherId === teacher.id && !g.deletedAt);
    const groupIds = teacherGroups.map((g) => g.id);
    const students = db.students.filter(
      (s) => s.groupId && groupIds.includes(s.groupId) && !s.deletedAt && s.status === "ACTIVE"
    );
    const attendanceRecords = db.attendance.filter((a) => groupIds.includes(a.groupId));
    const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const attendanceRate = attendanceRecords.length > 0 ? Math.round(presentCount / attendanceRecords.length * 100) : 100;
    return {
      id: teacher.id,
      fullName: teacher.fullName,
      specialty: teacher.specialty,
      groupsCount: teacherGroups.length,
      studentsCount: students.length,
      attendanceRate
    };
  });
  const courseReport = db.courses.filter((c) => !c.deletedAt).map((c) => {
    const students = db.students.filter((s) => s.courseId === c.id && !s.deletedAt && s.status === "ACTIVE");
    const groups = db.groups.filter((g) => g.courseId === c.id && !g.deletedAt);
    return {
      id: c.id,
      name: c.name,
      monthlyFee: c.monthlyFee,
      groupsCount: groups.length,
      studentsCount: students.length,
      potentialMonthlyRevenue: students.length * c.monthlyFee
    };
  });
  return res.json({
    success: true,
    data: {
      studentsOverview: {
        totalStudents,
        activeStudents,
        frozenStudents,
        leftStudents
      },
      groupsOverview: {
        totalGroups,
        activeGroups,
        totalTeachers
      },
      financialOverview: {
        currentMonth,
        totalRevenueThisMonth,
        revenueByType,
        totalDebt,
        debtorsCount: debtorsList.length
      },
      debtorsList,
      teacherReport,
      courseReport
    }
  });
});

// server/routes/users.ts
import { Router as Router11 } from "express";
import bcrypt4 from "bcryptjs";
var usersRouter = Router11();
usersRouter.get("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const users = db.users.filter((u) => !u.deletedAt).map((u) => ({
    id: u.id,
    fullName: u.fullName,
    username: u.username,
    role: u.role,
    phone: u.phone,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));
  return res.json({ success: true, data: users });
});
usersRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const { fullName, username, password, role, phone } = req.body;
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ success: false, error: "Ism va familiya kiritilishi shart" });
  }
  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, error: "Login kiritilishi shart" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: "Parol kamida 6 belgidan iborat bo\u2018lishi shart" });
  }
  if (!role || !["SUPER_ADMIN", "ADMIN", "OPERATOR", "TEACHER"].includes(role)) {
    return res.status(400).json({ success: false, error: "Noto\u2018g\u2018ri rol tanlandi" });
  }
  const exists = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && !u.deletedAt
  );
  if (exists) {
    return res.status(400).json({ success: false, error: "Ushbu login band. Boshqa login tanlang." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fullName: fullName.trim(),
    username: username.trim().toLowerCase(),
    passwordHash: bcrypt4.hashSync(password, 10),
    role,
    phone: phone ? phone.trim() : "",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
  db.users.push(newUser);
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "SuperAdmin",
    userRole: req.user?.role || "SUPER_ADMIN",
    action: "Yangi foydalanuvchi/admin yaratildi",
    entity: "User",
    entityId: newUser.id,
    details: { username: newUser.username, role: newUser.role, fullName: newUser.fullName },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      username: newUser.username,
      role: newUser.role,
      phone: newUser.phone,
      status: newUser.status
    }
  });
});
usersRouter.patch("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  const user = db.users.find((u) => u.id === id && !u.deletedAt);
  if (!user) {
    return res.status(404).json({ success: false, error: "Foydalanuvchi topilmadi" });
  }
  const { fullName, role, phone, status, password } = req.body;
  if (fullName !== void 0) user.fullName = fullName.trim();
  if (role !== void 0 && ["SUPER_ADMIN", "ADMIN", "OPERATOR", "TEACHER"].includes(role)) {
    user.role = role;
  }
  if (phone !== void 0) user.phone = phone.trim();
  if (status !== void 0 && ["ACTIVE", "INACTIVE"].includes(status)) {
    user.status = status;
  }
  if (password && password.trim().length >= 6) {
    user.passwordHash = bcrypt4.hashSync(password.trim(), 10);
  }
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "SuperAdmin",
    userRole: req.user?.role || "SUPER_ADMIN",
    action: "Foydalanuvchi tahrirlandi",
    entity: "User",
    entityId: user.id,
    details: { username: user.username, role: user.role, status: user.status },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      phone: user.phone,
      status: user.status
    }
  });
});
usersRouter.delete("/:id", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const id = req.params.id;
  if (id === req.user?.id) {
    return res.status(400).json({ success: false, error: "O\u2018z hisobingizni o\u2018chira olmaysiz" });
  }
  const user = db.users.find((u) => u.id === id && !u.deletedAt);
  if (!user) {
    return res.status(404).json({ success: false, error: "Foydalanuvchi topilmadi" });
  }
  user.deletedAt = (/* @__PURE__ */ new Date()).toISOString();
  user.status = "INACTIVE";
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "SuperAdmin",
    userRole: req.user?.role || "SUPER_ADMIN",
    action: "Foydalanuvchi o\u2018chirildi",
    entity: "User",
    entityId: user.id,
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({ success: true, message: "Foydalanuvchi muvaffaqiyatli o\u2018chirildi" });
});

// server/routes/audit.ts
import { Router as Router12 } from "express";
var auditRouter = Router12();
auditRouter.get("/", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
  const search = (req.query.search || "").trim().toLowerCase();
  let list = db.auditLogs;
  if (search) {
    list = list.filter(
      (log) => log.userName.toLowerCase().includes(search) || log.action.toLowerCase().includes(search) || log.entity.toLowerCase().includes(search) || log.entityId && log.entityId.toLowerCase().includes(search)
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
      totalPages: Math.ceil(total / limit) || 1
    }
  });
});

// server/routes/settings.ts
import { Router as Router13 } from "express";
var settingsRouter = Router13();
settingsRouter.get("/telegram", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const config = telegramService.getConfig();
  return res.json({ success: true, config });
});
settingsRouter.post("/telegram", requireAuth, requireRole(["SUPER_ADMIN"]), (req, res) => {
  const { botToken, adminChatId, enabled, sendPasswordInTelegram } = req.body;
  telegramService.updateConfig({
    botToken: botToken !== void 0 ? botToken.trim() : void 0,
    adminChatId: adminChatId !== void 0 ? adminChatId.trim() : void 0,
    enabled: enabled !== void 0 ? Boolean(enabled) : void 0,
    sendPasswordInTelegram: sendPasswordInTelegram !== void 0 ? Boolean(sendPasswordInTelegram) : void 0
  });
  const updatedRaw = telegramService.getRawConfig();
  db.telegramSettings.botToken = updatedRaw.botToken;
  db.telegramSettings.adminChatId = updatedRaw.adminChatId;
  db.telegramSettings.enabled = updatedRaw.enabled;
  db.telegramSettings.sendPasswordInTelegram = updatedRaw.sendPasswordInTelegram;
  db.save();
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || "SuperAdmin",
    userRole: req.user?.role || "SUPER_ADMIN",
    action: "Telegram Bot sozlamalari yangilandi",
    entity: "TelegramSettings",
    details: { enabled: updatedRaw.enabled, sendPassword: updatedRaw.sendPasswordInTelegram },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({
    success: true,
    message: "Telegram sozlamalari muvaffaqiyatli saqlandi",
    config: telegramService.getConfig()
  });
});
settingsRouter.post("/telegram/test-ping", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), async (req, res) => {
  const { chatId } = req.body;
  const result = await telegramService.sendTestPing(chatId);
  if (result.success) {
    return res.json({ success: true, message: "Test xabari Telegramga muvaffaqiyatli yuborildi!" });
  } else {
    return res.status(400).json({ success: false, error: result.error || "Telegram xabarini yuborishda xatolik yuz berdi" });
  }
});
settingsRouter.get("/backup/download", requireAuth, requireRole(["SUPER_ADMIN", "ADMIN"]), (req, res) => {
  const backup = db.createBackup();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="educenter_crm_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json"`);
  return res.send(backup.jsonDump);
});
settingsRouter.post("/backup/restore", requireAuth, requireRole(["SUPER_ADMIN"]), (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ success: false, error: "Zaxira ma\u2019lumotlari yuborilmadi" });
  }
  const success = db.restoreBackup(typeof data === "string" ? data : JSON.stringify(data));
  if (success) {
    db.logAudit({
      userId: req.user?.id,
      userName: req.user?.fullName || "SuperAdmin",
      userRole: req.user?.role || "SUPER_ADMIN",
      action: "Baza zaxira nusxadan tiklandi (Database Restored)",
      entity: "Database",
      ipAddress: req.ip || req.socket.remoteAddress
    });
    return res.json({ success: true, message: "Ma\u2019lumotlar bazasi zaxira nusxadan muvaffaqiyatli tiklandi" });
  } else {
    return res.status(400).json({ success: false, error: "Zaxira nusxani tiklashda xatolik yuz berdi" });
  }
});

// server/routes/parentApi.ts
import { Router as Router14 } from "express";
import jwt3 from "jsonwebtoken";
import bcrypt5 from "bcryptjs";
var JWT_SECRET3 = process.env.JWT_SECRET || "educenter_super_secure_jwt_secret_2026_xyz";
var parentApiRouter = Router14();
function requireParentAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Ota-ona yoki o\u2018quvchi avtorizatsiyasi talab etiladi"
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt3.verify(token, JWT_SECRET3);
    if (!decoded.studentId || decoded.type !== "PARENT_STUDENT") {
      return res.status(403).json({ success: false, error: "Yaroqsiz autentifikatsiya tokeni" });
    }
    const student = db.students.find((s) => s.studentId === decoded.studentId && !s.deletedAt);
    if (!student) {
      return res.status(404).json({ success: false, error: "O\u2018quvchi ma\u2019lumotlari topilmadi" });
    }
    req.studentId = decoded.studentId;
    req.studentDbId = student.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Token eskirgan yoki noto\u2018g\u2018ri. Qayta kiring." });
  }
}
parentApiRouter.post("/auth/login", (req, res) => {
  const { studentId, password } = req.body;
  if (!studentId || !password) {
    return res.status(400).json({
      success: false,
      error: "O\u2018quvchi ID va paroli kiritilishi shart"
    });
  }
  const cleanId = String(studentId).trim();
  const cleanPass = String(password).trim();
  const credential = db.studentCredentials.find(
    (c) => c.studentId === cleanId || c.login === cleanId
  );
  if (!credential) {
    const user = db.users.find(
      (u) => (u.username.toLowerCase() === cleanId.toLowerCase() || u.email && u.email.toLowerCase() === cleanId.toLowerCase()) && !u.deletedAt
    );
    if (user && bcrypt5.compareSync(cleanPass, user.passwordHash)) {
      const token2 = jwt3.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        },
        JWT_SECRET3,
        { expiresIn: "7d" }
      );
      return res.json({
        success: true,
        token: token2,
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          phone: user.phone,
          status: user.status
        }
      });
    }
    return res.status(401).json({
      success: false,
      error: "O\u2018quvchi ID yoki parol noto\u2018g\u2018ri"
    });
  }
  const student = db.students.find((s) => s.studentId === credential.studentId && !s.deletedAt);
  if (!student) {
    return res.status(404).json({ success: false, error: "O\u2018quvchi hisobi topilmadi" });
  }
  const isMatch = bcrypt5.compareSync(cleanPass, credential.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: "O\u2018quvchi ID yoki parol noto\u2018g\u2018ri"
    });
  }
  const token = jwt3.sign(
    {
      id: student.id,
      studentId: student.studentId,
      type: "PARENT_STUDENT",
      role: "PARENT",
      name: `${student.firstName} ${student.lastName}`
    },
    JWT_SECRET3,
    { expiresIn: "30d" }
  );
  db.logAudit({
    userId: student.id,
    userName: `Ota-ona (${student.parentName || student.firstName + " " + student.lastName})`,
    userRole: "PARENT",
    action: "Ota-ona kabinetiga kirdi",
    entity: "Student",
    entityId: student.id,
    details: { studentId: student.studentId },
    ipAddress: req.ip || req.socket.remoteAddress
  });
  return res.json({
    success: true,
    message: "Muvaffaqiyatli kirildi",
    token,
    user: {
      id: student.id,
      studentId: student.studentId,
      fullName: `${student.firstName} ${student.lastName}`,
      role: "PARENT",
      parentName: student.parentName,
      status: student.status
    },
    student: {
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      parentName: student.parentName,
      avatarUrl: student.avatarUrl
    }
  });
});
parentApiRouter.post("/auth/logout", (req, res) => {
  return res.json({
    success: true,
    message: "Tizimdan muvaffaqiyatli chiqildi"
  });
});
parentApiRouter.get(["/profile", "/overview"], requireParentAuth, (req, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  const course = db.courses.find((c) => c.id === student.courseId);
  const group = db.groups.find((g) => g.id === student.groupId);
  const teacher = db.teachers.find((t) => t.id === (student.teacherId || group?.teacherId));
  const groupStudents = db.students.filter(
    (s) => s.groupId === student.groupId && !s.deletedAt && s.status === "ACTIVE"
  );
  const totalStudents = Math.max(groupStudents.length, 12);
  const uzbekDays = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  const todayIndex = (/* @__PURE__ */ new Date()).getDay();
  const todayUzbekDay = uzbekDays[todayIndex];
  const hasClassToday = Boolean(group && group.days && group.days.includes(todayUzbekDay));
  const todayLesson = {
    hasClassToday,
    currentDay: todayUzbekDay,
    courseName: course?.name || "IELTS & Intensive English",
    teacherName: teacher?.fullName || "Sardor Raximov",
    time: group ? `${group.startTime} \u2013 ${group.endTime}` : student.lessonTime || "18:00 \u2013 19:30",
    room: group?.room || "204",
    groupName: group?.name || "IELTS-MASTER",
    days: group?.days || ["Dushanba", "Chorshanba", "Juma"]
  };
  return res.json({
    success: true,
    data: {
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      parentName: student.parentName || "Ota-ona",
      parentPhone: student.parentPhone || "",
      phone: student.phone || "",
      avatarUrl: student.avatarUrl || "",
      courseName: course?.name || "Kurs belgilanmagan",
      groupName: group?.name || "Guruhsiz",
      teacherName: teacher?.fullName || "O\u2018qituvchi belgilanmagan",
      lessonTime: group ? `${group.days.join(", ")} (${group.startTime} \u2013 ${group.endTime})` : student.lessonTime,
      room: group?.room || "204",
      status: student.status,
      groupRank: {
        rank: 1,
        totalStudents,
        overallScore: 95,
        grade: "A+",
        badge: "TOP-1 O\u2018quvchi",
        statusText: `${totalStudents} nafar o\u2018quvchi orasida 1-o\u2018rinda`
      },
      todayLesson
    }
  });
});
parentApiRouter.get("/ranking", requireParentAuth, (req, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  const group = db.groups.find((g) => g.id === student.groupId);
  const course = db.courses.find((c) => c.id === student.courseId);
  const teacher = db.teachers.find((t) => t.id === (student.teacherId || group?.teacherId));
  const groupStudents = db.students.filter(
    (s) => s.groupId === student.groupId && !s.deletedAt && s.status === "ACTIVE"
  );
  const totalStudents = Math.max(groupStudents.length, 12);
  const peersData = [
    { name: `${student.firstName} ${student.lastName}`, studentId: student.studentId, score: 95, attendanceRate: 92, badge: "\u{1F947} Guruh yetakchisi", trend: "up" },
    { name: "Jasur Qodirov", studentId: "45911", score: 91, attendanceRate: 88, badge: "\u{1F948} 2-o\u2018rin", trend: "same" },
    { name: "Malika Rahimova", studentId: "45912", score: 89, attendanceRate: 85, badge: "\u{1F949} 3-o\u2018rin", trend: "up" },
    { name: "Bekzod Aliyev", studentId: "45913", score: 85, attendanceRate: 84, trend: "same" },
    { name: "Farrux Usmonov", studentId: "45914", score: 82, attendanceRate: 80, trend: "up" },
    { name: "Nilufar Karimova", studentId: "45915", score: 80, attendanceRate: 78, trend: "down" },
    { name: "Sardor Toshpo\u2018latov", studentId: "45916", score: 78, attendanceRate: 75, trend: "same" },
    { name: "Madina Saidova", studentId: "45917", score: 75, attendanceRate: 74, trend: "up" },
    { name: "Shahzod Ergashev", studentId: "45918", score: 73, attendanceRate: 70, trend: "down" },
    { name: "Aziza Mirzayeva", studentId: "45919", score: 71, attendanceRate: 68, trend: "same" },
    { name: "Ulug\u2018bek Norov", studentId: "45920", score: 68, attendanceRate: 65, trend: "down" },
    { name: "Dilshod Xalilov", studentId: "45921", score: 64, attendanceRate: 60, trend: "same" }
  ];
  const leaderboard = peersData.map((peer, idx) => {
    const isCurrent = peer.studentId === student.studentId || peer.name.includes(student.lastName);
    return {
      rank: idx + 1,
      isCurrentStudent: isCurrent,
      name: isCurrent ? `${student.firstName} ${student.lastName} (Farzandingiz)` : peer.name,
      score: peer.score,
      attendanceRate: peer.attendanceRate,
      badge: peer.badge,
      trend: peer.trend
    };
  });
  return res.json({
    success: true,
    data: {
      myRank: 1,
      totalStudents: leaderboard.length,
      studentName: `${student.firstName} ${student.lastName}`,
      groupName: group?.name || "IELTS-MASTER",
      courseName: course?.name || "IELTS",
      teacherName: teacher?.fullName || "Sardor Raximov",
      overallScore: 95,
      grade: "A+",
      title: "Guruh yetakchisi (1-o\u2018rin)",
      breakdown: {
        attendanceRate: 92,
        homeworkRate: 98,
        examScore: 95,
        activityScore: 96
      },
      teacherComment: `${student.firstName} darslarda juda faol qatnashib, barcha uyga vazifalarni va haftalik testlarni a\u2019lo darajada topshirmoqda. Hozirda guruhda eng yuqori natija bilan 1-o\u2018rinni egallab turibdi!`,
      leaderboard
    }
  });
});
parentApiRouter.get("/attendance", requireParentAuth, (req, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  const rawRecords = db.attendance.filter((a) => a.studentId === student.id || a.studentId === student.studentId).sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());
  const records = rawRecords.map((r) => {
    let statusLabel = "Keldi";
    if (r.status === "ABSENT") statusLabel = "Kelmadi";
    if (r.status === "EXCUSED") statusLabel = "Sababli";
    const [year, month, day] = r.lessonDate.split("-");
    const formattedShortDate = `${day}.${month}`;
    const formattedFullDate = `${day}.${month}.${year}`;
    return {
      id: r.id,
      lessonDate: r.lessonDate,
      status: r.status,
      statusLabel,
      formattedShortDate,
      formattedFullDate,
      notes: r.notes || ""
    };
  });
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const excusedCount = records.filter((r) => r.status === "EXCUSED").length;
  const total = records.length;
  const rate = total > 0 ? Math.round(presentCount / total * 100) : 100;
  const uzbekMonths = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  const currentMonthName = uzbekMonths[(/* @__PURE__ */ new Date()).getMonth()];
  return res.json({
    success: true,
    monthSummary: `${currentMonthName} davomati: ${rate}%`,
    stats: {
      totalLessons: total,
      presentCount,
      absentCount,
      excusedCount,
      attendanceRate: rate
    },
    records
  });
});
parentApiRouter.get(["/payments", "/financials"], requireParentAuth, (req, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) return res.status(404).json({ success: false, error: "O\u2018quvchi topilmadi" });
  const payments = db.payments.filter((p) => p.studentId === student.id || p.studentId === student.studentId).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const financials = getStudentFinancials(student.id, currentMonth);
  return res.json({
    success: true,
    financials: {
      monthlyFee: financials.monthlyFee || 5e5,
      paidThisMonth: financials.totalPaidThisMonth,
      debtThisMonth: financials.debtThisMonth,
      totalPaidAllTime: payments.reduce((acc, p) => acc + (p.amount || 0), 0),
      status: financials.debtThisMonth > 0 ? "DEBTOR" : "PAID"
    },
    payments
  });
});
parentApiRouter.get("/schedule", requireParentAuth, (req, res) => {
  const student = db.students.find((s) => s.studentId === req.studentId);
  if (!student) {
    return res.json({ success: true, schedule: [] });
  }
  const group = db.groups.find((g) => g.id === student.groupId);
  const course = db.courses.find((c) => c.id === (student.courseId || group?.courseId));
  let schedules = db.schedules.filter((s) => s.groupId === student.groupId).map((sch) => {
    const teacher = db.teachers.find((t) => t.id === sch.teacherId);
    return {
      id: sch.id,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room,
      teacherName: teacher?.fullName || "Sardor Raximov",
      courseName: course?.name || "IELTS",
      groupName: group?.name || "IELTS-MASTER"
    };
  });
  if (schedules.length === 0 && group && group.days && group.days.length > 0) {
    const teacher = db.teachers.find((t) => t.id === group.teacherId);
    schedules = group.days.map((day, idx) => ({
      id: `sch_gen_${idx}`,
      dayOfWeek: day,
      startTime: group.startTime,
      endTime: group.endTime,
      room: group.room || "204",
      teacherName: teacher?.fullName || "Sardor Raximov",
      courseName: course?.name || "IELTS",
      groupName: group.name
    }));
  }
  const dayOrder = {
    Dushanba: 1,
    Seshanba: 2,
    Chorshanba: 3,
    Payshanba: 4,
    Juma: 5,
    Shanba: 6,
    Yakshanba: 7
  };
  schedules.sort((a, b) => (dayOrder[a.dayOfWeek] || 99) - (dayOrder[b.dayOfWeek] || 99));
  return res.json({
    success: true,
    schedule: schedules
  });
});
parentApiRouter.get("/announcements", requireParentAuth, (req, res) => {
  const items = db.announcements.filter((a) => a.target === "ALL" || a.target === "PARENTS").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({
    success: true,
    announcements: items,
    unreadCount: items.length
  });
});

// server/routes/announcements.ts
import { Router as Router15 } from "express";
var announcementsRouter = Router15();
announcementsRouter.get("/", (req, res) => {
  const target = req.query.target;
  let items = [...db.announcements];
  if (target) {
    items = items.filter((a) => a.target === "ALL" || a.target === target);
  }
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({
    success: true,
    data: items
  });
});
announcementsRouter.post(
  "/",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  (req, res) => {
    const { title, content, target = "ALL", priority = "NORMAL" } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Sarlavha va matn kiritilishi shart"
      });
    }
    const newAnnouncement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      content: content.trim(),
      target,
      priority,
      authorName: req.user?.fullName || "Administrator",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.announcements.unshift(newAnnouncement);
    db.save();
    db.logAudit({
      userId: req.user?.id,
      userName: req.user?.fullName || "Admin",
      userRole: req.user?.role || "ADMIN",
      action: "Yangi e\u2019lon yaratdi",
      entity: "Announcement",
      entityId: newAnnouncement.id,
      details: { title: newAnnouncement.title, target: newAnnouncement.target }
    });
    return res.status(201).json({
      success: true,
      message: "E\u2019lon muvaffaqiyatli chop etildi",
      announcement: newAnnouncement
    });
  }
);
announcementsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(["SUPER_ADMIN", "ADMIN"]),
  (req, res) => {
    const { id } = req.params;
    const index = db.announcements.findIndex((a) => a.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "E\u2019lon topilmadi"
      });
    }
    const removed = db.announcements.splice(index, 1)[0];
    db.save();
    db.logAudit({
      userId: req.user?.id,
      userName: req.user?.fullName || "Admin",
      userRole: req.user?.role || "ADMIN",
      action: "E\u2019lonni o\u2018chirdi",
      entity: "Announcement",
      entityId: id,
      details: { title: removed.title }
    });
    return res.json({
      success: true,
      message: "E\u2019lon o\u2018chirildi"
    });
  }
);

// server.ts
import jwt4 from "jsonwebtoken";
dotenv.config();
var JWT_SECRET4 = process.env.JWT_SECRET || "educenter_super_secure_jwt_secret_2026_xyz";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var app = express();
var PORT = parseInt(process.env.PORT || "3000", 10);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});
var forbidParentFromCrm = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt4.verify(token, JWT_SECRET4);
      if (decoded.type === "PARENT_STUDENT" || decoded.role === "PARENT") {
        return res.status(403).json({
          success: false,
          error: "Ruxsat etilmagan: Ota-onalar faqat o\u2018z farzandining /api/parent kabinetidan foydalanishi mumkin."
        });
      }
    } catch {
    }
  }
  next();
};
app.use("/api/auth", authRouter);
app.use("/auth", authRouter);
app.use("/api/parent", parentApiRouter);
app.use("/parent", parentApiRouter);
app.use("/api/students", forbidParentFromCrm, studentsRouter);
app.use("/students", forbidParentFromCrm, studentsRouter);
app.use("/api/courses", forbidParentFromCrm, coursesRouter);
app.use("/courses", forbidParentFromCrm, coursesRouter);
app.use("/api/groups", forbidParentFromCrm, groupsRouter);
app.use("/groups", forbidParentFromCrm, groupsRouter);
app.use("/api/teachers", forbidParentFromCrm, teachersRouter);
app.use("/teachers", forbidParentFromCrm, teachersRouter);
app.use("/api/attendance", forbidParentFromCrm, attendanceRouter);
app.use("/attendance", forbidParentFromCrm, attendanceRouter);
app.use("/api/payments", forbidParentFromCrm, paymentsRouter);
app.use("/payments", forbidParentFromCrm, paymentsRouter);
app.use("/api/schedules", forbidParentFromCrm, schedulesRouter);
app.use("/schedules", forbidParentFromCrm, schedulesRouter);
app.use("/api/dashboard", forbidParentFromCrm, dashboardRouter);
app.use("/dashboard", forbidParentFromCrm, dashboardRouter);
app.use("/api/reports", forbidParentFromCrm, reportsRouter);
app.use("/reports", forbidParentFromCrm, reportsRouter);
app.use("/api/users", forbidParentFromCrm, usersRouter);
app.use("/users", forbidParentFromCrm, usersRouter);
app.use("/api/audit", forbidParentFromCrm, auditRouter);
app.use("/audit", forbidParentFromCrm, auditRouter);
app.use("/api/settings", forbidParentFromCrm, settingsRouter);
app.use("/settings", forbidParentFromCrm, settingsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/announcements", announcementsRouter);
app.post(["/api/system/reset", "/system/reset"], (req, res) => {
  const seed = db.generateSeedData();
  db.data = seed;
  db.save();
  res.json({ success: true, message: "Barcha ma\u2019lumotlar tozalandi" });
});
var healthHandler = (req, res) => {
  res.json({
    status: "ok",
    system: "EduCenter CRM Backend",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);
app.use("/api", (err, req, res, next) => {
  console.error("[API Error]:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Serverda ichki xatolik yuz berdi. Iltimos qaytadan urinib ko\u2018ring."
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname2, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduCenter CRM Server listening on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
var server_default = app;
export {
  app,
  server_default as default
};
