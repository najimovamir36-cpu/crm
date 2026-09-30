import { handleClientStaticFallback } from './clientFallback';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem('educenter_token');
}

export function setToken(token: string) {
  localStorage.setItem('educenter_token', token);
}

export function removeToken() {
  localStorage.removeItem('educenter_token');
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    // If fetch failed completely (network down or offline), fallback to local client store
    const fallback = handleClientStaticFallback<T>(endpoint, options);
    if (fallback !== null) {
      return fallback;
    }
    throw new ApiError('Server bilan aloqa uzildi. Iltimos qaytadan urinib ko‘ring.', 503);
  }

  // If server responded with 404 (e.g. static CDN deployment like Vercel static without serverless functions)
  if (response.status === 404) {
    const fallback = handleClientStaticFallback<T>(endpoint, options);
    if (fallback !== null) {
      return fallback;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Xatolik (${response.status}): Server javob bermadi`;
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  loginWithGoogle: (data: { email: string; displayName?: string | null; uid?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),

  // Dashboard
  getDashboardStats: () => request<{ success: boolean; data: any }>('/dashboard/stats'),

  // Students
  getStudents: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
    });
    return request<{ success: boolean; data: any[]; meta: any }>(`/students?${query.toString()}`);
  },
  getStudent: (id: string) => request<{ success: boolean; student: any }>(`/students/${id}`),
  createStudent: (studentData: any) =>
    request<{ success: boolean; student: any; credentials: any; message: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),
  updateStudent: (id: string, updateData: any) =>
    request<{ success: boolean; student: any; message: string }>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),
  regenerateStudentPassword: (id: string) =>
    request<{ success: boolean; newPassword: string; login: string; message: string }>(
      `/students/${id}/regenerate-password`,
      { method: 'POST' }
    ),
  deleteStudent: (id: string) =>
    request<{ success: boolean; message: string }>(`/students/${id}`, { method: 'DELETE' }),

  // Courses
  getCourses: () => request<{ success: boolean; data: any[] }>('/courses'),
  createCourse: (data: any) =>
    request<{ success: boolean; course: any }>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCourse: (id: string, data: any) =>
    request<{ success: boolean; course: any }>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCourse: (id: string) =>
    request<{ success: boolean; message: string }>(`/courses/${id}`, { method: 'DELETE' }),

  // Groups
  getGroups: () => request<{ success: boolean; data: any[] }>('/groups'),
  getGroup: (id: string) => request<{ success: boolean; group: any }>(`/groups/${id}`),
  createGroup: (data: any) =>
    request<{ success: boolean; group: any }>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGroup: (id: string, data: any) =>
    request<{ success: boolean; group: any }>(`/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteGroup: (id: string) =>
    request<{ success: boolean; message: string }>(`/groups/${id}`, { method: 'DELETE' }),

  // Teachers
  getTeachers: () => request<{ success: boolean; data: any[] }>('/teachers'),
  createTeacher: (data: any) =>
    request<{ success: boolean; teacher: any }>('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTeacher: (id: string, data: any) =>
    request<{ success: boolean; teacher: any }>(`/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTeacher: (id: string) =>
    request<{ success: boolean; message: string }>(`/teachers/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (groupId: string, date: string) =>
    request<{ success: boolean; groupId: string; groupName: string; date: string; students: any[] }>(
      `/attendance?groupId=${groupId}&date=${date}`
    ),
  saveAttendance: (data: { groupId: string; date: string; records: any[] }) =>
    request<{ success: boolean; message: string }>('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAttendanceStats: () => request<{ success: boolean; stats: any }>('/attendance/stats'),

  // Payments
  getPayments: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, String(v));
    });
    return request<{ success: boolean; data: any[]; stats: any }>(`/payments?${query.toString()}`);
  },
  createPayment: (data: any) =>
    request<{ success: boolean; payment: any; message: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Schedules
  getSchedules: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, String(v));
    });
    return request<{ success: boolean; data: any[] }>(`/schedules?${query.toString()}`);
  },
  createSchedule: (data: any) =>
    request<{ success: boolean; schedule: any }>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSchedule: (id: string) =>
    request<{ success: boolean; message: string }>(`/schedules/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: () => request<{ success: boolean; data: any }>('/reports/summary'),

  // Users
  getUsers: () => request<{ success: boolean; data: any[] }>('/users'),
  createUser: (data: any) =>
    request<{ success: boolean; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    request<{ success: boolean; user: any }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, { method: 'DELETE' }),

  // Audit Logs
  getAuditLogs: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, String(v));
    });
    return request<{ success: boolean; data: any[]; meta: any }>(`/audit?${query.toString()}`);
  },

  // Settings
  getTelegramSettings: () => request<{ success: boolean; config: any }>('/settings/telegram'),
  updateTelegramSettings: (data: any) =>
    request<{ success: boolean; config: any; message: string }>('/settings/telegram', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendTestTelegramPing: (chatId?: string) =>
    request<{ success: boolean; message: string }>('/settings/telegram/test-ping', {
      method: 'POST',
      body: JSON.stringify({ chatId }),
    }),
  restoreBackup: (data: any) =>
    request<{ success: boolean; message: string }>('/settings/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),
  getBackupData: () => request<any>('/settings/backup/download'),

  // Parent Portal APIs (strictly scoped to authenticated parent/student)
  parentLogin: (credentials: { studentId: string; password: string }) =>
    request<{ success: boolean; token: string; user: any; student: any }>('/parent/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  parentLogout: () =>
    request<{ success: boolean; message: string }>('/parent/auth/logout', { method: 'POST' }),
  getParentProfile: () => request<{ success: boolean; data: any }>('/parent/profile'),
  getParentRanking: () => request<{ success: boolean; data: any }>('/parent/ranking'),
  getParentAttendance: () =>
    request<{ success: boolean; monthSummary: string; stats: any; records: any[] }>('/parent/attendance'),
  getParentPayments: () =>
    request<{ success: boolean; financials: any; payments: any[] }>('/parent/payments'),
  getParentSchedule: () => request<{ success: boolean; schedule: any[] }>('/parent/schedule'),
  getParentAnnouncements: () =>
    request<{ success: boolean; announcements: any[]; unreadCount: number }>('/parent/announcements'),

  // Announcements Management (Admin)
  getAnnouncements: (target?: string) => {
    const q = target ? `?target=${target}` : '';
    return request<{ success: boolean; data: any[] }>(`/announcements${q}`);
  },
  createAnnouncement: (data: { title: string; content: string; target?: string; priority?: string }) =>
    request<{ success: boolean; announcement: any; message: string }>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAnnouncement: (id: string) =>
    request<{ success: boolean; message: string }>(`/announcements/${id}`, { method: 'DELETE' }),
  resetSystem: () =>
    request<{ success: boolean; message: string }>('/system/reset', { method: 'POST' }),
};
