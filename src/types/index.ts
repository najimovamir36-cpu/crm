export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'TEACHER' | 'PARENT';

export interface User {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  studentId?: string;
  parentName?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  target: 'ALL' | 'PARENTS' | 'STUDENTS' | 'TEACHERS';
  priority?: 'NORMAL' | 'URGENT';
  authorName?: string;
  createdAt: string;
}

export interface GroupRankInfo {
  rank: number;
  totalStudents: number;
  overallScore: number;
  grade: string;
  badge: string;
  statusText: string;
}

export interface GroupLeaderboardEntry {
  rank: number;
  isCurrentStudent: boolean;
  name: string;
  score: number;
  attendanceRate: number;
  badge?: string;
  trend?: 'up' | 'same' | 'down';
}

export interface ParentGroupRanking {
  myRank: number;
  totalStudents: number;
  studentName: string;
  groupName: string;
  courseName: string;
  teacherName: string;
  overallScore: number;
  grade: string;
  title: string;
  breakdown: {
    attendanceRate: number;
    homeworkRate: number;
    examScore: number;
    activityScore: number;
  };
  teacherComment: string;
  leaderboard: GroupLeaderboardEntry[];
}

export interface ParentChildProfile {
  studentId: string;
  firstName: string;
  lastName: string;
  parentName: string;
  parentPhone?: string;
  phone?: string;
  avatarUrl?: string;
  courseName: string;
  groupName: string;
  teacherName: string;
  lessonTime: string;
  room: string;
  status: string;
  groupRank?: GroupRankInfo;
  todayLesson: {
    hasClassToday: boolean;
    currentDay: string;
    courseName: string;
    teacherName: string;
    time: string;
    room: string;
    groupName: string;
    days: string[];
  };
}

export interface ParentAttendanceStat {
  totalLessons: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface ParentAttendanceItem {
  id: string;
  lessonDate: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  statusLabel: string;
  formattedShortDate: string;
  formattedFullDate: string;
  notes?: string;
}

export interface ParentFinancials {
  monthlyFee: number;
  paidThisMonth: number;
  debtThisMonth: number;
  totalPaidAllTime: number;
  status: 'PAID' | 'DEBTOR' | 'FREE';
}

export interface ParentScheduleItem {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  teacherName: string;
  courseName: string;
  groupName: string;
}

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate?: string;
  gender?: 'ERKAK' | 'AYOL' | 'BOSHQA';
  parentName?: string;
  parentPhone?: string;
  courseId?: string;
  courseName?: string;
  groupId?: string;
  groupName?: string;
  teacherId?: string;
  teacherName?: string;
  lessonTime?: string;
  notes?: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'FROZEN' | 'LEFT';
  createdAt: string;
  monthlyFee?: number;
  paidThisMonth?: number;
  debtThisMonth?: number;
  paymentStatus?: 'PAID' | 'DEBTOR' | 'FREE';
}

export interface Group {
  id: string;
  name: string;
  courseId: string;
  courseName?: string;
  teacherId: string;
  teacherName?: string;
  startDate: string;
  endDate?: string;
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  maxStudents: number;
  monthlyFee: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING';
  studentCount?: number;
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
  groupsCount?: number;
  studentsCount?: number;
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
  groupsCount?: number;
  studentsCount?: number;
  groups?: { id: string; name: string }[];
}

export interface Payment {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  studentPhone?: string;
  courseName?: string;
  groupName?: string;
  amount: number;
  paymentDate: string;
  forMonth: string;
  paymentType: 'CASH' | 'CARD' | 'BANK' | 'OTHER';
  receiptNumber?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentCode: string;
  fullName: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | null;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  groupId: string;
  groupName?: string;
  courseId: string;
  courseName?: string;
  teacherId: string;
  teacherName?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  studentCount?: number;
}

export interface AuditLogItem {
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
