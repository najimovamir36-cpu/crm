import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError, testConnection } from '../firebase';
import { api, setToken, getToken } from './api';

const googleProvider = new GoogleAuthProvider();

export interface FirebaseSyncStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUserEmail: string | null;
  currentUserId: string | null;
  lastSyncTime: string | null;
  syncedCounts: {
    students: number;
    teachers: number;
    courses: number;
    groups: number;
    attendance: number;
    payments: number;
    users: number;
  };
  isSyncing: boolean;
  error: string | null;
}

// Global in-memory status
let syncStatus: FirebaseSyncStatus = {
  isConnected: false,
  isAuthenticated: false,
  currentUserEmail: null,
  currentUserId: null,
  lastSyncTime: localStorage.getItem('educore_last_firebase_sync') || null,
  syncedCounts: {
    students: 0,
    teachers: 0,
    courses: 0,
    groups: 0,
    attendance: 0,
    payments: 0,
    users: 0,
  },
  isSyncing: false,
  error: null,
};

const listeners = new Set<(status: FirebaseSyncStatus) => void>();

export function subscribeFirebaseStatus(listener: (status: FirebaseSyncStatus) => void) {
  listeners.add(listener);
  listener({ ...syncStatus });
  return () => {
    listeners.delete(listener);
  };
}

function updateStatus(updates: Partial<FirebaseSyncStatus>) {
  syncStatus = { ...syncStatus, ...updates };
  listeners.forEach((l) => l({ ...syncStatus }));
}

// Initialize Auth Listener & Connection
export function initFirebaseService() {
  testConnection()
    .then((connected) => {
      updateStatus({ isConnected: connected });
    })
    .catch(() => {
      updateStatus({ isConnected: false });
    });

  onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      updateStatus({
        isAuthenticated: true,
        currentUserEmail: user.email,
        currentUserId: user.uid,
        error: null,
      });
      console.log('Firebase authenticated as:', user.email);

      // Exchange with backend token if missing
      if (!getToken() && user.email) {
        try {
          const authRes = await api.loginWithGoogle({
            email: user.email,
            displayName: user.displayName,
            uid: user.uid,
          });
          if (authRes.token) {
            setToken(authRes.token);
          }
        } catch (e) {
          console.warn('Backend token exchange warning:', e);
        }
      }

      // Auto-sync initial data when authenticated
      syncAllToFirebase().catch((err) => {
        console.warn('Initial auto-sync deferred:', err.message);
      });
    } else {
      updateStatus({
        isAuthenticated: false,
        currentUserEmail: null,
        currentUserId: null,
      });
    }
  });
}

// Google Sign-In for Firebase
export async function loginWithGoogleFirebase(): Promise<FirebaseUser> {
  try {
    updateStatus({ error: null });
    const result = await signInWithPopup(auth, googleProvider);
    updateStatus({
      isAuthenticated: true,
      currentUserEmail: result.user.email,
      currentUserId: result.user.uid,
    });

    // Exchange with backend to establish admin session
    if (result.user.email) {
      try {
        const authRes = await api.loginWithGoogle({
          email: result.user.email,
          displayName: result.user.displayName,
          uid: result.user.uid,
        });
        if (authRes.token) {
          setToken(authRes.token);
        }
      } catch (e) {
        console.warn('Backend loginWithGoogle note:', e);
      }
    }

    // Trigger sync immediately after successful sign-in
    await syncAllToFirebase();
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    updateStatus({ error: error.message || 'Google orqali ulanishda xatolik yuz berdi' });
    throw error;
  }
}

// Sign-Out from Firebase
export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    updateStatus({
      isAuthenticated: false,
      currentUserEmail: null,
      currentUserId: null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'auth/signout');
  }
}

// Upload & Sync all data from local database to Firebase Firestore
export async function syncAllToFirebase(): Promise<{ success: boolean; counts: any }> {
  if (!auth.currentUser) {
    const msg = "Firebase Firestore-ga yuklash uchun Google akkaunt orqali tizimga ulaning";
    updateStatus({ error: msg });
    throw new Error(msg);
  }

  updateStatus({ isSyncing: true, error: null });

  try {
    // 1. Fetch current data from server API
    let students: any[] = [];
    let teachers: any[] = [];
    let courses: any[] = [];
    let groups: any[] = [];
    let attendance: any[] = [];
    let payments: any[] = [];
    let users: any[] = [];

    try {
      const backupData = await api.getBackupData();
      if (backupData && typeof backupData === 'object') {
        students = Array.isArray(backupData.students) ? backupData.students : [];
        teachers = Array.isArray(backupData.teachers) ? backupData.teachers : [];
        courses = Array.isArray(backupData.courses) ? backupData.courses : [];
        groups = Array.isArray(backupData.groups) ? backupData.groups : [];
        attendance = Array.isArray(backupData.attendance) ? backupData.attendance : [];
        payments = Array.isArray(backupData.payments) ? backupData.payments : [];
        users = Array.isArray(backupData.users) ? backupData.users : [];
      }
    } catch {
      // Fallback to individual API endpoints
      const [studentsRes, teachersRes, coursesRes, groupsRes, paymentsRes, usersRes] = await Promise.all([
        api.getStudents({ limit: 1000 }).catch(() => ({ data: [] })),
        api.getTeachers().catch(() => ({ data: [] })),
        api.getCourses().catch(() => ({ data: [] })),
        api.getGroups().catch(() => ({ data: [] })),
        api.getPayments({ limit: 1000 }).catch(() => ({ data: [] })),
        api.getUsers().catch(() => ({ data: [] })),
      ]);

      students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      teachers = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      courses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      groups = Array.isArray(groupsRes.data) ? groupsRes.data : [];
      payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      users = Array.isArray(usersRes.data) ? usersRes.data : [];
    }

    // Helper to sanitize undefined values for Firestore
    const sanitize = (obj: any) => {
      const clean: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) {
          clean[k] = v;
        }
      }
      return clean;
    };

    let syncedStudents = 0;
    let syncedTeachers = 0;
    let syncedCourses = 0;
    let syncedGroups = 0;
    let syncedAttendance = 0;
    let syncedPayments = 0;
    let syncedUsers = 0;

    // 2. Upload Students
    for (const student of students) {
      if (student.id) {
        try {
          await setDoc(doc(db, 'students', String(student.id)), sanitize({
            ...student,
            syncedAt: new Date().toISOString(),
          }));
          syncedStudents++;
        } catch (e: any) {
          console.warn('Student sync notice:', student.id, e.message);
        }
      }
    }

    // 3. Upload Teachers
    for (const teacher of teachers) {
      if (teacher.id) {
        try {
          await setDoc(doc(db, 'teachers', String(teacher.id)), sanitize({
            ...teacher,
            syncedAt: new Date().toISOString(),
          }));
          syncedTeachers++;
        } catch (e: any) {
          console.warn('Teacher sync notice:', teacher.id, e.message);
        }
      }
    }

    // 4. Upload Courses
    for (const course of courses) {
      if (course.id) {
        try {
          await setDoc(doc(db, 'courses', String(course.id)), sanitize({
            ...course,
            syncedAt: new Date().toISOString(),
          }));
          syncedCourses++;
        } catch (e: any) {
          console.warn('Course sync notice:', course.id, e.message);
        }
      }
    }

    // 5. Upload Groups
    for (const group of groups) {
      if (group.id) {
        try {
          await setDoc(doc(db, 'groups', String(group.id)), sanitize({
            ...group,
            syncedAt: new Date().toISOString(),
          }));
          syncedGroups++;
        } catch (e: any) {
          console.warn('Group sync notice:', group.id, e.message);
        }
      }
    }

    // 6. Upload Attendance records
    for (const att of attendance) {
      if (att.id) {
        try {
          await setDoc(doc(db, 'attendance', String(att.id)), sanitize({
            ...att,
            syncedAt: new Date().toISOString(),
          }));
          syncedAttendance++;
        } catch (e: any) {
          console.warn('Attendance sync notice:', att.id, e.message);
        }
      }
    }

    // 7. Upload Payments
    for (const payment of payments) {
      if (payment.id) {
        try {
          await setDoc(doc(db, 'payments', String(payment.id)), sanitize({
            ...payment,
            syncedAt: new Date().toISOString(),
          }));
          syncedPayments++;
        } catch (e: any) {
          console.warn('Payment sync notice:', payment.id, e.message);
        }
      }
    }

    // 8. Upload Users (without passwordHash for security)
    for (const user of users) {
      if (user.id) {
        try {
          const { passwordHash, ...safeUser } = user;
          await setDoc(doc(db, 'users', String(user.id)), sanitize({
            ...safeUser,
            syncedAt: new Date().toISOString(),
          }));
          syncedUsers++;
        } catch (e: any) {
          console.warn('User sync notice:', user.id, e.message);
        }
      }
    }

    const counts = {
      students: syncedStudents,
      teachers: syncedTeachers,
      courses: syncedCourses,
      groups: syncedGroups,
      attendance: syncedAttendance,
      payments: syncedPayments,
      users: syncedUsers,
    };

    const now = new Date().toLocaleString('uz-UZ');
    localStorage.setItem('educore_last_firebase_sync', now);

    updateStatus({
      isSyncing: false,
      lastSyncTime: now,
      syncedCounts: counts,
      error: null,
    });

    console.log('Firebase full sync completed successfully:', counts);
    return { success: true, counts };
  } catch (error: any) {
    console.error('Firebase sync error:', error);
    updateStatus({
      isSyncing: false,
      error: error.message || 'Firebase-ga ma’lumot yuklashda xatolik yuz berdi',
    });
    handleFirestoreError(error, OperationType.WRITE, 'syncAll');
  }
}

// Single Document write to Firestore
export async function syncDocToFirebase(collectionName: string, id: string, data: any) {
  if (!auth.currentUser) return;
  try {
    const clean: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v;
    }
    await setDoc(doc(db, collectionName, id), {
      ...clean,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn(`Firestore syncDoc warning for ${collectionName}/${id}:`, error);
  }
}
