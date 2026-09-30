import React, { useState, useEffect } from 'react';
import {
  Settings,
  Send,
  Download,
  Upload,
  Database,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Terminal,
  Bell,
  Trash2,
  Plus,
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'announcements' | 'backup' | 'parentApi' | 'database'>('telegram');

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState<'ALL' | 'PARENTS'>('PARENTS');
  const [annPriority, setAnnPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [isPostingAnn, setIsPostingAnn] = useState(false);
  const [annMsg, setAnnMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Telegram Config state
  const [botToken, setBotToken] = useState('');
  const [adminChatId, setAdminChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [sendPasswordInTelegram, setSendPasswordInTelegram] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ping test
  const [pinging, setPinging] = useState(false);

  // Backup restore state
  const [restoreJson, setRestoreJson] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleWipeAllData = async () => {
    if (!window.confirm("Rostdan ham barcha ma'lumotlarni tozalamoqchimisiz? Barcha namunaviy o'quvchilar, guruhlar, kurslar, o'qituvchilar va to'lovlar o'chiriladi.")) {
      return;
    }
    setIsWiping(true);
    try {
      const { wipeAllLocalData } = await import('../../services/clientFallback');
      wipeAllLocalData();
      localStorage.removeItem('educenter_local_fallback_db_v2');
      localStorage.removeItem('educenter_local_fallback_db_v1');
      await api.resetSystem().catch(() => {});
      alert("Barcha ma'lumotlar muvaffaqiyatli tozalandi! Tizim toza holatda saqlandi.");
      window.location.reload();
    } catch (err: any) {
      alert("Xatolik: " + (err.message || 'Server xatosi'));
    } finally {
      setIsWiping(false);
    }
  };

  const loadAnnouncements = () => {
    api.getAnnouncements().then((res) => {
      if (res.success) setAnnouncements(res.data || []);
    });
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setIsPostingAnn(true);
    setAnnMsg(null);
    try {
      const res = await api.createAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        target: annTarget,
        priority: annPriority,
      });
      if (res.success) {
        setAnnMsg({ type: 'success', text: 'E’lon muvaffaqiyatli chop etildi!' });
        setAnnTitle('');
        setAnnContent('');
        loadAnnouncements();
      }
    } catch (err: any) {
      setAnnMsg({ type: 'error', text: err.message || 'Xatolik yuz berdi' });
    } finally {
      setIsPostingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Haqiqatan ham ushbu e’lonni o‘chirmoqchimisiz?')) return;
    try {
      const res = await api.deleteAnnouncement(id);
      if (res.success) {
        loadAnnouncements();
      }
    } catch (err: any) {
      alert(err.message || 'Xatolik');
    }
  };

  useEffect(() => {
    api.getTelegramSettings().then((res) => {
      if (res.success && res.config) {
        setBotToken(res.config.botToken || '');
        setAdminChatId(res.config.adminChatId || '');
        setTelegramEnabled(res.config.enabled || false);
        setSendPasswordInTelegram(res.config.sendPasswordInTelegram || false);
      }
    });
  }, []);

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTelegram(true);
    setTelegramMessage(null);
    try {
      const res = await api.updateTelegramSettings({
        botToken: botToken.includes('...') ? undefined : botToken,
        adminChatId,
        enabled: telegramEnabled,
        sendPasswordInTelegram,
      });
      if (res.success) {
        setTelegramMessage({ type: 'success', text: 'Telegram sozlamalari muvaffaqiyatli saqlandi!' });
      }
    } catch (err: any) {
      setTelegramMessage({ type: 'error', text: err.message || 'Saqlashda xatolik yuz berdi' });
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleTestPing = async () => {
    setPinging(true);
    setTelegramMessage(null);
    try {
      const res = await api.sendTestTelegramPing();
      if (res.success) {
        setTelegramMessage({
          type: 'success',
          text: 'Test xabari Telegram bot orqali muvaffaqiyatli yuborildi! (8821038107 ga yetkazildi ✅)',
        });
      }
    } catch (err: any) {
      setTelegramMessage({ type: 'error', text: err.message || 'Xabar yuborishda xatolik yuz berdi' });
    } finally {
      setPinging(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/settings/backup/download', '_blank');
  };

  const handleRestoreBackup = async () => {
    if (!restoreJson.trim()) {
      alert('Iltimos zaxira JSON matnini kiriting');
      return;
    }
    if (!window.confirm('Haqiqatan ham bazani ushbu zaxira nusxasidan tiklamoqchimisiz? Joriy ma’lumotlar almashtiriladi.')) {
      return;
    }

    setIsRestoring(true);
    setRestoreResult(null);
    try {
      const res = await api.restoreBackup(restoreJson);
      if (res.success) {
        setRestoreResult({ type: 'success', text: 'Ma’lumotlar bazasi zaxira nusxadan muvaffaqiyatli tiklandi!' });
        setRestoreJson('');
      }
    } catch (err: any) {
      setRestoreResult({ type: 'error', text: err.message || 'Tiklashda xatolik' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tizim Sozlamalari</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Telegram Bot integratsiyasi, Zaxira nusxasi (Backup) va Kelajakdagi Mobil Ilova API
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('telegram')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'telegram'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Telegram Bot Integratsiyasi
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          Ota-ona E’lonlari
        </button>
        <button
          onClick={() => setActiveTab('parentApi')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'parentApi'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Ota-ona Mobil Ilovasi API
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'backup'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Zaxira Nusxasi (Backup)
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'database'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          PostgreSQL Arxitekturasi
        </button>
      </div>

      {/* TAB 1: TELEGRAM BOT */}
      {activeTab === 'telegram' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-500" />
                Telegram Bot Avtomatik Xabarnomalari
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Yangi o‘quvchilar, login/parollar va markaz yangiliklari to‘g‘ridan-to‘g‘ri asosiy adminlarga avtomatik yuboriladi.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <span>🔒 Qulflangan & Faol</span>
            </div>
          </div>

          {telegramMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                telegramMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {telegramMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{telegramMessage.text}</span>
            </div>
          )}

          {/* Official Admin Badges */}
          <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                🤖 Rasmiy Bot:
              </span>
              <a
                href="https://t.me/newrenaissancesupportcrmbot"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 hover:underline"
              >
                @newrenaissancesupportcrmbot <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-sky-200/60 text-xs">
              <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-sky-100">
                <span className="font-semibold text-slate-800">👑 1-Asosiy Admin (Ulangan):</span>
                <span className="font-mono font-bold text-sky-900 bg-sky-100/70 px-2 py-0.5 rounded">8821038107</span>
              </div>
              <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-sky-100">
                <span className="font-semibold text-slate-800">👑 2-Asosiy Admin:</span>
                <span className="font-mono font-bold text-sky-900 bg-sky-100/70 px-2 py-0.5 rounded">291171879</span>
              </div>
            </div>
            <p className="text-[11px] text-sky-800/80 leading-relaxed italic">
              * Eslatma: Ikkinchi admin xabarlarni qabul qilishi uchun Telegramda <strong>@newrenaissancesupportcrmbot</strong> ga kirib <strong>/start</strong> tugmasini bosishi kifoya.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telegram Bot Token (Qulflangan 🔒)
              </label>
              <input
                type="text"
                readOnly
                value="8971004593:AAGhEKfqpiTomhDbIRnzuYHZtOaXxZqjOd4"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-600 cursor-not-allowed select-all"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Bot tokeni qat’iy qulflangan — tizimdan begona shaxslar uni o‘zgartira olmaydi yoki o‘g‘irlay olmaydi.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asosiy Admin Chat IDlar (Qulflangan 🔒)
              </label>
              <input
                type="text"
                readOnly
                value="8821038107, 291171879"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-600 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Barcha yangi o‘quvchilar va hisobotlar faqat ushbu 2 ta asosiy admin hisobiga yuboriladi.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Integratsiya faolligini tekshirish uchun test xabar yuborishingiz mumkin:
              </span>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={pinging}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{pinging ? 'Yuborilmoqda...' : '🔔 Test xabarini yuborish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANNOUNCEMENTS FOR PARENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 max-w-4xl">
          {/* Create Announcement Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                Ota-onalar Uchun Yangi E’lon Chop Etish
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chop etilgan e’lon barcha ota-onalarning kabinetida va bildirishnomalarida darhol ko‘rinadi.
              </p>
            </div>

            {annMsg && (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                  annMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {annMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{annMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E’lon Sarlavhasi
                </label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Masalan: 1-oktabr kuni darslar boshlanish vaqti o‘zgaradi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E’lon Matni (Mazmuni)
                </label>
                <textarea
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Hurmatli ota-onalar! ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kimlar uchun (Target)
                  </label>
                  <select
                    value={annTarget}
                    onChange={(e: any) => setAnnTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-600"
                  >
                    <option value="PARENTS">Faqat Ota-onalar</option>
                    <option value="ALL">Barchaga (Umumiy)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Muhimlik darajasi
                  </label>
                  <select
                    value={annPriority}
                    onChange={(e: any) => setAnnPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-600"
                  >
                    <option value="NORMAL">Oddiy xabarnoma</option>
                    <option value="URGENT">Shoshilinch / Muhim</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPostingAnn}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-orange-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isPostingAnn ? 'Chop etilmoqda...' : 'E’lonni chop etish'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Announcements List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Mavjud Faol E’lonlar ({announcements.length})
            </h3>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Hozircha faol e’lonlar yo‘q.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold text-sm">{ann.title}</strong>
                        {ann.priority === 'URGENT' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                            Muhim
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                          {ann.target === 'PARENTS' ? 'Ota-onalar' : 'Barchaga'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{ann.content}</p>
                      <p className="text-[10px] text-slate-400">
                        Chop etildi: {new Date(ann.createdAt).toLocaleDateString('uz-UZ')} • Muallif: {ann.authorName || 'Admin'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-end sm:self-center"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARENT MOBILE APP API */}
      {activeTab === 'parentApi' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-bold text-slate-900">
                Kelajakdagi Ota-ona Mobil Ilovasi Uchun API Arxitekturasi
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Backend hozirdanoq Android va iOS ilovalari ulanishi uchun to‘liq tayyorlangan.
              Ota-ona yoki o‘quvchi o‘zining <strong>Student ID</strong>si va <strong>boshlang‘ich paroli</strong> bilan tizimga kiradi.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">POST</span>
                <span>/api/parent/auth/login</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Mobil ilovadan kirish: Body <code>{`{ "studentId": "583217", "password": "..." }`}</code>. Maxsus scoped JWT token qaytaradi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800">GET</span>
                <span>/api/parent/profile</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Faqat ushbu farzandning shaxsiy ma’lumotlari, dars vaqti, guruhi, o‘qituvchisi va oylik to‘lov summasini qaytaradi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800">GET</span>
                <span>/api/parent/attendance</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Farzandning kunlik darslarga qatnashuv tarixi va umumiy foizi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800">GET</span>
                <span>/api/parent/payments</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                To‘langan cheklar, to‘lov tarixi va joriy oydagi qarzdorlik balansi.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800">GET</span>
                <span>/api/parent/schedule</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Farzandning guruhidagi haftalik dars vaqtlari va xonalari.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-600" />
              Ma’lumotlar Bazasi Zaxira Nusxasi (Backup & Restore)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Barcha o‘quvchilar, to‘lovlar, guruhlar va audit loglarining to‘liq zaxirasini yuklab oling.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-950">Zaxira Faylini Yuklab Olish</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Barcha jadvallarning to‘liq JSON dump nusxasi bir zumda yaratiladi.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Zaxirani yuklab olish (JSON)</span>
            </button>
          </div>

          {/* Restore section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Zaxira Nusxadan Tiklash (Restore)
            </h4>
            <p className="text-xs text-slate-500">
              Oldin yuklab olingan zaxira fayli JSON matnini quyidagi maydonga joylashtiring:
            </p>

            {restoreResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  restoreResult.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{restoreResult.text}</span>
              </div>
            )}

            <textarea
              rows={4}
              value={restoreJson}
              onChange={(e) => setRestoreJson(e.target.value)}
              placeholder="Zaxira nusxasi JSON matnini shu yerga qo‘ying..."
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />

            <button
              onClick={handleRestoreBackup}
              disabled={isRestoring || !restoreJson.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isRestoring ? 'Tiklanmoqda...' : 'Baza ma’lumotlarini tiklash'}
            </button>
          </div>

          {/* Wipe All Data Section */}
          <div className="pt-6 border-t border-rose-200 space-y-3 bg-rose-50/60 p-5 rounded-2xl border border-rose-200">
            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Barcha ma’lumotlarni tozalash (Toza boshlash)
            </h4>
            <p className="text-xs text-rose-700/80">
              Bu tugma barcha namunaviy o‘quvchilar, guruhlar, kurslar, o‘qituvchilar, davomat va to‘lovlarni to‘liq o‘chiradi.
              Asosiy admin hisoblari (<code>superadmin</code>, <code>admin</code>) saqlanib qoladi.
            </p>
            <button
              type="button"
              onClick={handleWipeAllData}
              disabled={isWiping}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isWiping ? 'Tozalanmoqda...' : 'Barcha ma’lumotlarni tozalash'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: POSTGRESQL ARCHITECTURE */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-orange-600" />
              PostgreSQL Production Schema va Deploy Qo‘llanmasi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Loyihaning barcha relyatsion jadvallari, indekslari va foreign key constraintlari{' '}
              <code>/server/db/schema.sql</code> faylida joylashtirilgan.
            </p>
          </div>

          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
            <p className="text-slate-400"># PostgreSQL Production Database ulash:</p>
            <p className="text-sky-300">psql -h localhost -U postgres -d educenter_crm -f server/db/schema.sql</p>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Jadvallar ro‘yxati:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>users</code> — Xodimlar va RBAC (Super Admin, Admin, Operator, Teacher)</li>
              <li><code>students</code> — O‘quvchilar, unique 5-7 xonali Student ID</li>
              <li><code>student_credentials</code> — Hashlangan parollar (bcrypt)</li>
              <li><code>courses</code> — O‘quv yo‘nalishlari va oylik to‘lov</li>
              <li><code>groups</code> — Guruhlar va dars jadvali</li>
              <li><code>teachers</code> — O‘qituvchilar tarkibi</li>
              <li><code>attendance</code> — Kunlik davomat qaydlari</li>
              <li><code>payments</code> — To‘lovlar va kvitansiyalar</li>
              <li><code>audit_logs</code> — Xavfsizlik va harakatlar tarixi</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
