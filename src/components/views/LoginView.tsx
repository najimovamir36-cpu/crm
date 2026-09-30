import React, { useState } from 'react';
import {
  Flame,
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Shield,
  Users,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type LoginRole = 'ADMIN' | 'PARENT';

export const LoginView: React.FC = () => {
  const { login, loginParent, loginWithGoogle } = useAuth();
  const [role, setRole] = useState<LoginRole>('ADMIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(
        role === 'ADMIN'
          ? 'Login va parol kiritilishi shart'
          : 'O‘quvchi ID va paroli kiritilishi shart'
      );
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (role === 'ADMIN') {
        await login(identifier.trim(), password);
      } else {
        await loginParent(identifier.trim(), password);
      }
    } catch (err: any) {
      setError(
        err.message ||
          (role === 'ADMIN' ? 'Login yoki parol noto‘g‘ri' : 'O‘quvchi ID yoki parol noto‘g‘ri')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (newRole: LoginRole) => {
    setRole(newRole);
    setIdentifier('');
    setPassword('');
    setError(null);
  };

  const handleQuickLogin = async (id: string, p: string, targetRole: LoginRole = 'ADMIN') => {
    setRole(targetRole);
    setIdentifier(id);
    setPassword(p);
    setError(null);
    setIsLoading(true);
    try {
      if (targetRole === 'ADMIN') {
        await login(id, p);
      } else {
        await loginParent(id, p);
      }
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!loginWithGoogle) return;
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google orqali kirishda xatolik yuz berdi');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070F1E] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-7 sm:p-9 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 items-center justify-center shadow-lg shadow-orange-500/30 mb-3">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            EduCenter <span className="text-orange-600">CRM</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'ADMIN'
              ? 'Admin tizimiga kirish'
              : 'Ota-ona kabinetiga kirish'}
          </p>
        </div>

        {/* Role Selector Tabs [ ADMIN ] [ OTA-ONA ] */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200/70">
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'ADMIN'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            ADMIN
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('PARENT')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'PARENT'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            OTA-ONA
          </button>
        </div>

        {/* Section Title */}
        <div className="mb-5 text-center">
          <h2 className="text-base font-bold text-slate-900">
            {role === 'ADMIN' ? 'Admin tizimiga kirish' : 'Ota-ona kabinetiga kirish'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {role === 'ADMIN'
              ? 'Boshqaruv paneli va barcha CRM bo‘limlari'
              : 'Farzandingizning davomat, jadval va to‘lovlari'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {role === 'ADMIN' ? 'Login / ID' : 'O‘quvchi ID'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {role === 'ADMIN' ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={role === 'ADMIN' ? 'Masalan: admin yoki superadmin' : 'Masalan: 583217'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Parol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={role === 'ADMIN' ? '••••••••' : 'Masalan: Najimov5837'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 ${
              role === 'ADMIN'
                ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/25'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
            }`}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Google Sign In option */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">yoki</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <span className="w-4 h-4 border-2 border-slate-400 border-t-orange-600 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.25 21.31 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.69 1.27 6.59l4.01 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>Google hisobi bilan 1-bosishda kirish</span>
            </>
          )}
        </button>

        {/* Quick Testing Options */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          {role === 'ADMIN' ? (
            <div>
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                1-bosishda kirish (Namunaviy rollar):
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin', 'admin123', 'ADMIN')}
                  className="p-2.5 bg-orange-50/70 hover:bg-orange-100/90 border border-orange-200/80 rounded-xl text-left transition-colors font-semibold text-slate-800 cursor-pointer"
                >
                  👑 Super Admin
                  <span className="block text-[10px] text-slate-500 font-normal">superadmin / admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin123', 'ADMIN')}
                  className="p-2.5 bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200/80 rounded-xl text-left transition-colors font-semibold text-blue-950 cursor-pointer"
                >
                  💼 Admin
                  <span className="block text-[10px] text-blue-600/70 font-normal">admin / admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('operator', 'operator123', 'ADMIN')}
                  className="p-2.5 bg-orange-50/70 hover:bg-orange-100/90 border border-orange-200/80 rounded-xl text-left transition-colors font-semibold text-slate-800 cursor-pointer"
                >
                  🎧 Operator
                  <span className="block text-[10px] text-slate-500 font-normal">operator / operator123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('teacher_sardor', 'teacher123', 'ADMIN')}
                  className="p-2.5 bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200/80 rounded-xl text-left transition-colors font-semibold text-blue-950 cursor-pointer"
                >
                  👨‍🏫 O‘qituvchi
                  <span className="block text-[10px] text-blue-600/70 font-normal">teacher_sardor / teacher123</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Ota-ona va o‘quvchilar kabineti:
              </p>
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 leading-relaxed text-center">
                O‘quv markazi ma’muriyati tomonidan taqdim etilgan <strong>6 xonali O‘quvchi ID</strong> va parolingizni yuqoridagi maydonlarga kiriting.
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center">
        EduCenter CRM • Yagona Markaziy Baza • Admin & Ota-onalar Kabineti
      </p>
    </div>
  );
};
