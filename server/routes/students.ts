import { Router } from 'express';
import { db, Student, StudentCredential } from '../db/database.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.js';
import { generateUniqueStudentId } from '../services/studentIdGenerator.js';
import { generateStudentPassword } from '../services/passwordGenerator.js';
import { telegramService } from '../services/telegramService.js';

export const studentsRouter = Router();

// Helper to calculate student debt and attendance summary
export function getStudentFinancials(studentId: string, currentMonth: string = new Date().toISOString().slice(0, 7)) {
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
    totalPaidAllTime,
  };
}

// GET /api/students
studentsRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const groupId = req.query.groupId as string;
  const courseId = req.query.courseId as string;
  const teacherId = req.query.teacherId as string;
  const status = req.query.status as string;
  const paymentFilter = req.query.paymentStatus as string; // 'PAID', 'DEBTOR', 'ALL'

  // If logged in as TEACHER, restrict to teacher's own groups
  let teacherRestrictedGroupIds: string[] | null = null;
  if (req.user?.role === 'TEACHER') {
    const teacherProfile = db.teachers.find((t) => t.userId === req.user?.id || t.fullName === req.user?.fullName);
    if (teacherProfile) {
      teacherRestrictedGroupIds = db.groups
        .filter((g) => g.teacherId === teacherProfile.id && !g.deletedAt)
        .map((g) => g.id);
    } else {
      teacherRestrictedGroupIds = [];
    }
  }

  let list = db.students.filter((s) => !s.deletedAt);

  if (teacherRestrictedGroupIds !== null) {
    list = list.filter((s) => s.groupId && teacherRestrictedGroupIds!.includes(s.groupId));
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
  if (status && status !== 'ALL') {
    list = list.filter((s) => s.status === status);
  }

  if (search) {
    list = list.filter((s) => {
      return (
        s.studentId.toLowerCase().includes(search) ||
        s.firstName.toLowerCase().includes(search) ||
        s.lastName.toLowerCase().includes(search) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search) ||
        s.phone.replace(/[^0-9]/g, '').includes(search.replace(/[^0-9]/g, '')) ||
        (s.parentPhone && s.parentPhone.replace(/[^0-9]/g, '').includes(search.replace(/[^0-9]/g, '')))
      );
    });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Map enriched data
  const enriched = list.map((s) => {
    const course = db.courses.find((c) => c.id === s.courseId);
    const group = db.groups.find((g) => g.id === s.groupId);
    const teacher = db.teachers.find((t) => t.id === (s.teacherId || group?.teacherId));
    const financials = getStudentFinancials(s.id, currentMonth);

    const isPaid = financials.debtThisMonth === 0 && financials.monthlyFee > 0;
    const isDebtor = financials.debtThisMonth > 0;

    return {
      ...s,
      courseName: course?.name || 'Biriktirilmagan',
      groupName: group?.name || 'Guruhsiz',
      teacherName: teacher?.fullName || 'Tayinlanmagan',
      monthlyFee: financials.monthlyFee,
      paidThisMonth: financials.totalPaidThisMonth,
      debtThisMonth: financials.debtThisMonth,
      paymentStatus: isDebtor ? 'DEBTOR' : isPaid ? 'PAID' : 'FREE',
    };
  });

  // Filter by payment status if requested
  let filtered = enriched;
  if (paymentFilter === 'DEBTOR') {
    filtered = enriched.filter((s) => s.debtThisMonth > 0);
  } else if (paymentFilter === 'PAID') {
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
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

// GET /api/students/:id
studentsRouter.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const id = req.params.id;
  const student = db.students.find(
    (s) => (s.id === id || s.studentId === id) && !s.deletedAt
  );

  if (!student) {
    return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });
  }

  const course = db.courses.find((c) => c.id === student.courseId);
  const group = db.groups.find((g) => g.id === student.groupId);
  const teacher = db.teachers.find((t) => t.id === (student.teacherId || group?.teacherId));
  const credential = db.studentCredentials.find((c) => c.studentId === student.studentId);

  // Financials
  const currentMonth = new Date().toISOString().slice(0, 7);
  const financials = getStudentFinancials(student.id, currentMonth);

  // Payments list
  const payments = db.payments
    .filter((p) => p.studentId === student.id || p.studentId === student.studentId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // Attendance history
  const attendanceRecords = db.attendance
    .filter((a) => a.studentId === student.id || a.studentId === student.studentId)
    .sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());

  const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
  const excusedCount = attendanceRecords.filter((a) => a.status === 'EXCUSED').length;
  const totalLessons = attendanceRecords.length;
  const attendanceRate = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 100;

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
          attendanceRate,
        },
      },
      loginDetails: {
        studentId: student.studentId,
        login: student.studentId,
        hasInitialPassword: Boolean(credential?.plainTempPasswordShownOnce),
        initialPassword: credential?.plainTempPasswordShownOnce || null,
        isPasswordChanged: credential?.isPasswordChanged || false,
      },
    },
  });
});

// POST /api/students
studentsRouter.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), async (req: AuthRequest, res) => {
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
    avatarUrl,
  } = req.body;

  // Validation
  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ success: false, error: 'O‘quvchining ismi kiritilishi shart' });
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).json({ success: false, error: 'O‘quvchining familiyasi kiritilishi shart' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, error: 'Telefon raqam kiritilishi shart' });
  }

  // Course & Group validation
  let selectedCourse = null;
  let selectedGroup = null;
  let teacherId = req.body.teacherId || null;
  let calculatedLessonTime = lessonTime || '';

  if (courseId) {
    selectedCourse = db.courses.find((c) => c.id === courseId && !c.deletedAt);
    if (!selectedCourse) {
      return res.status(400).json({ success: false, error: 'Tanlangan kurs mavjud emas' });
    }
  }

  if (groupId) {
    selectedGroup = db.groups.find((g) => g.id === groupId && !g.deletedAt);
    if (!selectedGroup) {
      return res.status(400).json({ success: false, error: 'Tanlangan guruh mavjud emas' });
    }
    teacherId = selectedGroup.teacherId;
    if (!calculatedLessonTime) {
      calculatedLessonTime = `${selectedGroup.days.join(', ')} (${selectedGroup.startTime} - ${selectedGroup.endTime})`;
    }
  }

  const teacher = teacherId ? db.teachers.find((t) => t.id === teacherId) : null;

  // 1. Generate unique 5-7 digit Student ID
  const existingStudentIds = db.students.map((s) => s.studentId);
  const newStudentId = generateUniqueStudentId(existingStudentIds);

  // 2. Generate initial random password: LastName + 4 non-trivial digits
  const { plainText, hash } = generateStudentPassword(lastName.trim());

  const now = new Date().toISOString();
  const studentDbId = `std_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const newStudent: Student = {
    id: studentDbId,
    studentId: newStudentId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    birthDate: birthDate || undefined,
    gender: gender || 'ERKAK',
    parentName: parentName ? parentName.trim() : undefined,
    parentPhone: parentPhone ? parentPhone.trim() : undefined,
    courseId: courseId || selectedGroup?.courseId,
    groupId: groupId || undefined,
    teacherId: teacherId || undefined,
    lessonTime: calculatedLessonTime,
    notes: notes ? notes.trim() : '',
    avatarUrl: avatarUrl || '',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const newCredential: StudentCredential = {
    studentId: newStudentId,
    login: newStudentId,
    passwordHash: hash,
    plainTempPasswordShownOnce: plainText,
    isPasswordChanged: false,
    createdAt: now,
    updatedAt: now,
  };

  // Atomic insert into database
  db.students.push(newStudent);
  db.studentCredentials.push(newCredential);
  db.save();

  // Audit log
  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'Yangi o‘quvchi yaratildi',
    entity: 'Student',
    entityId: newStudent.id,
    details: {
      studentId: newStudentId,
      fullName: `${newStudent.firstName} ${newStudent.lastName}`,
      group: selectedGroup?.name,
      course: selectedCourse?.name,
    },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  // Asynchronous Telegram Bot Notification (Non-blocking)
  const createdDateFormatted = new Date().toLocaleDateString('uz-UZ');
  telegramService
    .notifyNewStudent({
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      studentId: newStudentId,
      courseName: selectedCourse?.name || 'Kurs belgilanmagan',
      groupName: selectedGroup?.name || 'Guruh belgilanmagan',
      teacherName: teacher?.fullName || 'Tayinlanmagan',
      lessonTime: calculatedLessonTime || 'Belgilanmagan',
      initialPassword: plainText,
      createdDate: createdDateFormatted,
    })
    .catch((err) => {
      console.warn('Telegram notification delivery note:', err?.message || err);
    });

  return res.status(201).json({
    success: true,
    message: 'Yangi o‘quvchi muvaffaqiyatli ro‘yxatdan o‘tkazildi',
    student: newStudent,
    credentials: {
      studentId: newStudentId,
      login: newStudentId,
      initialPassword: plainText,
      note: 'Ushbu parolni o‘quvchiga yoki uning ota-onasiga taqdim eting.',
    },
  });
});

// PATCH /api/students/:id
studentsRouter.patch('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const student = db.students.find((s) => (s.id === id || s.studentId === id) && !s.deletedAt);

  if (!student) {
    return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });
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
    status,
  } = req.body;

  if (firstName !== undefined) student.firstName = firstName.trim();
  if (lastName !== undefined) student.lastName = lastName.trim();
  if (phone !== undefined) student.phone = phone.trim();
  if (birthDate !== undefined) student.birthDate = birthDate;
  if (gender !== undefined) student.gender = gender;
  if (parentName !== undefined) student.parentName = parentName.trim();
  if (parentPhone !== undefined) student.parentPhone = parentPhone.trim();
  if (courseId !== undefined) student.courseId = courseId;
  if (groupId !== undefined) {
    student.groupId = groupId;
    if (groupId) {
      const group = db.groups.find((g) => g.id === groupId);
      if (group) {
        student.teacherId = group.teacherId;
        student.courseId = group.courseId;
        if (!lessonTime) {
          student.lessonTime = `${group.days.join(', ')} (${group.startTime} - ${group.endTime})`;
        }
      }
    }
  }
  if (teacherId !== undefined) student.teacherId = teacherId;
  if (lessonTime !== undefined) student.lessonTime = lessonTime;
  if (notes !== undefined) student.notes = notes;
  if (avatarUrl !== undefined) student.avatarUrl = avatarUrl;
  if (status !== undefined) student.status = status;

  student.updatedAt = new Date().toISOString();
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'O‘quvchi ma’lumotlari tahrirlandi',
    entity: 'Student',
    entityId: student.id,
    details: { studentId: student.studentId, updatedFields: Object.keys(req.body) },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({
    success: true,
    message: 'O‘quvchi ma’lumotlari yangilandi',
    student,
  });
});

// POST /api/students/:id/regenerate-password
studentsRouter.post('/:id/regenerate-password', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const student = db.students.find((s) => (s.id === id || s.studentId === id) && !s.deletedAt);

  if (!student) {
    return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });
  }

  const { plainText, hash } = generateStudentPassword(student.lastName);

  let cred = db.studentCredentials.find((c) => c.studentId === student.studentId);
  const now = new Date().toISOString();

  if (!cred) {
    cred = {
      studentId: student.studentId,
      login: student.studentId,
      passwordHash: hash,
      plainTempPasswordShownOnce: plainText,
      isPasswordChanged: false,
      createdAt: now,
      updatedAt: now,
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
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'O‘quvchi paroli qayta yaratildi (Reset Password)',
    entity: 'StudentCredential',
    entityId: student.studentId,
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({
    success: true,
    message: 'Yangi parol yaratildi',
    newPassword: plainText,
    login: student.studentId,
  });
});

// DELETE /api/students/:id (Soft delete)
studentsRouter.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthRequest, res) => {
  const id = req.params.id;
  const student = db.students.find((s) => (s.id === id || s.studentId === id) && !s.deletedAt);

  if (!student) {
    return res.status(404).json({ success: false, error: 'O‘quvchi topilmadi' });
  }

  student.deletedAt = new Date().toISOString();
  student.status = 'LEFT';
  db.save();

  db.logAudit({
    userId: req.user?.id,
    userName: req.user?.fullName || 'Admin',
    userRole: req.user?.role || 'ADMIN',
    action: 'O‘quvchi o‘chirildi (Soft Delete)',
    entity: 'Student',
    entityId: student.id,
    details: { studentId: student.studentId, fullName: `${student.firstName} ${student.lastName}` },
    ipAddress: req.ip || req.socket.remoteAddress,
  });

  return res.json({
    success: true,
    message: 'O‘quvchi muvaffaqiyatli arxivlandi/o‘chirildi',
  });
});
