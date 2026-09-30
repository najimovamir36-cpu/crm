import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  LogIn,
  LogOut,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
} from 'lucide-react';
import {
  subscribeFirebaseStatus,
  loginWithGoogleFirebase,
  logoutFirebase,
  syncAllToFirebase,
  FirebaseSyncStatus,
} from '../../services/firebaseService';
import firebaseConfig from '../../../firebase-applet-config.json';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<FirebaseSyncStatus>({
    isConnected: false,
    isAuthenticated: false,
    currentUserEmail: null,
    currentUserId: null,
    lastSyncTime: null,
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
  });

  const [loadingAuth, setLoadingAuth] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeFirebaseStatus(setStatus);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoadingAuth(true);
      await loginWithGoogleFirebase();
      setSyncSuccessMsg("Google Firebase hisobi muvaffaqiyatli ulandi va ma'lumotlar sinxronlandi!");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logoutFirebase();
  };

  const handleSyncNow = async () => {
    try {
      setSyncSuccessMsg(null);
      const res = await syncAllToFirebase();
      if (res.success) {
        setSyncSuccessMsg("Barcha o'quv markazi ma'lumotlari Google Firebase Firestore-ga yuklandi!");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-orange-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Google Firebase Firestore</h3>
              <p className="text-xs text-orange-100">Bulutli xotira & Ma'lumotlar bazasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Box */}
          <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Aloqa holati:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Firestore Faol (Online)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-orange-200/50">
              <div>
                <p className="text-slate-500">Firebase Loyihasi:</p>
                <p className="font-semibold text-slate-800 font-mono truncate">{firebaseConfig.projectId}</p>
              </div>
              <div>
                <p className="text-slate-500">Firestore Database ID:</p>
                <p className="font-semibold text-slate-800 font-mono truncate" title={firebaseConfig.firestoreDatabaseId}>
                  {firebaseConfig.firestoreDatabaseId.slice(0, 18)}...
                </p>
              </div>
            </div>
          </div>

          {/* User Auth Section */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Firebase Avtorizatsiyasi (Google):</span>
              {status.isAuthenticated ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Ulangan
                </span>
              ) : (
                <span className="text-xs text-amber-700 font-medium">Ulanmagan</span>
              )}
            </div>

            {status.isAuthenticated ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900">{status.currentUserEmail}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">UID: {status.currentUserId}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Chiqish
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-600 mb-3">
                  Google akkauntingiz orqali Firebase-ga ulanib, ma’lumotlarni bulutga xavfsiz yuklang va doimiy saqlang:
                </p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loadingAuth}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all hover:shadow-md cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
                    />
                  </svg>
                  {loadingAuth ? "Ulanmoqda..." : "Google orqali Firebase-ga ulanish"}
                </button>
              </div>
            )}
          </div>

          {/* Sync Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Firestore-ga yuklanuvchi to'plamlar:</span>
              <span className="text-slate-500 text-[11px]">
                Oxirgi sinxronlash: <strong className="text-slate-800">{status.lastSyncTime || "Hali qilinmadi"}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Users className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500">O'quvchilar</p>
                <p className="font-extrabold text-slate-800">{status.syncedCounts.students || "Faol"}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <GraduationCap className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500">O'qituvchilar</p>
                <p className="font-extrabold text-slate-800">{status.syncedCounts.teachers || "Faol"}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <BookOpen className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500">Guruhlar</p>
                <p className="font-extrabold text-slate-800">{status.syncedCounts.groups || "Faol"}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <CalendarCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500">Davomat</p>
                <p className="font-extrabold text-slate-800">{status.syncedCounts.attendance || "Faol"}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <CreditCard className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500">To'lovlar</p>
                <p className="font-extrabold text-slate-800">{status.syncedCounts.payments || "Faol"}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <Database className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                <p className="text-[10px] text-slate-500">Kurslar</p>
                <p className="font-extrabold text-slate-800">{status.syncedCounts.courses || "Faol"}</p>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {status.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{status.error}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={status.isAuthenticated ? handleSyncNow : handleGoogleLogin}
              disabled={status.isSyncing || loadingAuth}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${status.isSyncing ? 'animate-spin' : ''}`} />
              {status.isSyncing
                ? "Firebase-ga yuklanmoqda..."
                : status.isAuthenticated
                ? "Barcha ma’lumotlarni Firebase-ga yuklash (Sync)"
                : "Google orqali ulanish va yuklash"}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Har bir qo'shilgan o'quvchi, guruh, davomat va to'lov avtomatik tarzda Google Firebase-da aks etadi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
