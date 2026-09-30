import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, ShieldCheck, Send, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { Course, Group, Teacher } from '../../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'ERKAK' | 'AYOL' | 'BOSHQA'>('ERKAK');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [courseId, setCourseId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [lessonTime, setLessonTime] = useState('');
  const [notes, setNotes] = useState('');

  // Selected Group Helper Preview
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<{
    teacherName?: string;
    days?: string[];
    time?: string;
    room?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success result card with Generated Credentials
  const [createdStudentResult, setCreatedStudentResult] = useState<{
    student: any;
    credentials: {
      studentId: string;
      login: string;
      initialPassword: string;
      note: string;
    };
  } | null>(null);

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load courses, groups, teachers
      Promise.all([api.getCourses(), api.getGroups(), api.getTeachers()])
        .then(([cRes, gRes, tRes]) => {
          if (cRes.success) setCourses(cRes.data);
          if (gRes.success) setGroups(gRes.data);
          if (tRes.success) setTeachers(tRes.data);
        })
        .catch((err) => console.error('Failed to load form options:', err));
    } else {
      // Reset form
      setFirstName('');
      setLastName('');
      setPhone('');
      setBirthDate('');
      setGender('ERKAK');
      setParentName('');
      setParentPhone('');
      setCourseId('');
      setGroupId('');
      setLessonTime('');
      setNotes('');
      setSelectedGroupInfo(null);
      setError(null);
      setCreatedStudentResult(null);
      setIsCopied(false);
    }
  }, [isOpen]);

  // When Course is selected, filter available groups
  const filteredGroups = courseId
    ? groups.filter((g) => g.courseId === courseId)
    : groups;

  // When Group is selected, auto-fill teacher, days, time, room
  const handleGroupChange = (selectedGId: string) => {
    setGroupId(selectedGId);
    if (!selectedGId) {
      setSelectedGroupInfo(null);
      return;
    }
    const grp = groups.find((g) => g.id === selectedGId);
    if (grp) {
      if (!courseId) setCourseId(grp.courseId);
      const teacher = teachers.find((t) => t.id === grp.teacherId);
      const timeStr = `${grp.days.join(', ')} (${grp.startTime} - ${grp.endTime})`;
      setLessonTime(timeStr);
      setSelectedGroupInfo({
        teacherName: teacher?.fullName || grp.teacherName,
        days: grp.days,
        time: `${grp.startTime} - ${grp.endTime}`,
        room: grp.room,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Ism, familiya va telefon raqami kiritilishi shart');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.createStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        birthDate: birthDate || undefined,
        gender,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        courseId: courseId || undefined,
        groupId: groupId || undefined,
        lessonTime: lessonTime || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.credentials) {
        setCreatedStudentResult({
          student: res.student,
          credentials: res.credentials,
        });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'O‘quvchini saqlashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdStudentResult) return;
    const text = `EduCenter CRM — O‘quvchi Kirish Ma’lumotlari:\n\n👤 O‘quvchi: ${createdStudentResult.student.firstName} ${createdStudentResult.student.lastName}\n🆔 Student ID: ${createdStudentResult.credentials.studentId}\n🔑 Login: ${createdStudentResult.credentials.login}\n🔐 Parol: ${createdStudentResult.credentials.initialPassword}\n\nUshbu ma’lumotlarni kelajakda mobil ilovaga kirish uchun saqlab qo‘ying.`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // If successfully created, show credential reveal card
  if (createdStudentResult) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="O‘quvchi Muvaffaqiyatli Ro‘yxatga Olindi"
        subtitle="Avtomatik unique ID va boshlang‘ich parol yaratildi"
        maxWidth="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold">
                {createdStudentResult.student.firstName} {createdStudentResult.student.lastName} bazaga saqlandi!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Telegram bot orqali adminga xabarnoma jo‘natildi.
              </p>
            </div>
          </div>

          {/* Credentials Card */}
          <div className="p-5 bg-slate-900 rounded-2xl text-white space-y-4 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-400" /> Kirish Ma’lumotlari (Credentials)
              </span>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded">
                Bir marta ko‘rsatiladi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">Student ID (Login)</span>
                <p className="text-2xl font-black text-sky-400 font-mono tracking-tight mt-0.5">
                  {createdStudentResult.credentials.studentId}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">Boshlang‘ich Parol</span>
                <p className="text-xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                  {createdStudentResult.credentials.initialPassword}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
              Parol xavfsiz tarzda <strong>bcrypt</strong> orqali shifrlangan. Ota-onaga yoki o‘quvchiga taqdim etish uchun nusxa oling.
            </p>

            <button
              onClick={copyCredentials}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Nusxa olindi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Ma’lumotlarni nusxalash (Copy)</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="+ Yangi O‘quvchi Qo‘shish"
      subtitle="Barcha ma’lumotlarni to‘ldiring. Student ID va parol backend tomonidan avtomatik yaratiladi."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Asosiy Ma'lumotlar */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            1. Asosiy shaxsiy ma’lumotlar
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ism <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Masalan: Jasur"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Familiya <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Masalan: Qodirov"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefon <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tug‘ilgan sana</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jinsi</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                <option value="ERKAK">Erkak</option>
                <option value="AYOL">Ayol</option>
                <option value="BOSHQA">Boshqa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Ota-ona ma'lumotlari */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            2. Ota-ona ma’lumotlari (Mobil ilova va aloqa uchun)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ota-onaning ismi</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Masalan: Nodir Qodirov"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ota-onaning telefoni</label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+998 90 987 65 43"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Kurs va Guruh Biriktirish */}
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            3. Kurs va guruh biriktirish
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kurs</label>
              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setGroupId('');
                  setSelectedGroupInfo(null);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                <option value="">Kursni tanlang...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({new Intl.NumberFormat('uz-UZ').format(c.monthlyFee)} so‘m/oy)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guruh</label>
              <select
                value={groupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                <option value="">Guruhni tanlang...</option>
                {filteredGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.startTime} ({g.days.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-filled Group Info Preview */}
          {selectedGroupInfo && (
            <div className="mt-3 p-3.5 rounded-xl bg-orange-50/70 border border-orange-100 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-orange-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Avtomatik biriktirildi:
              </span>
              <span className="text-slate-700">
                <strong>O‘qituvchi:</strong> {selectedGroupInfo.teacherName || 'Belgilanmagan'}
              </span>
              <span className="text-slate-700">
                <strong>Dars kunlari:</strong> {selectedGroupInfo.days?.join(', ')}
              </span>
              <span className="text-slate-700">
                <strong>Vaqti:</strong> {selectedGroupInfo.time}
              </span>
              <span className="text-slate-700">
                <strong>Xona:</strong> {selectedGroupInfo.room}
              </span>
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dars vaqti (Izoh)</label>
            <input
              type="text"
              value={lessonTime}
              onChange={(e) => setLessonTime(e.target.value)}
              placeholder="Masalan: Dushanba-Chorshanba-Juma (18:00 - 19:30)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>
        </div>

        {/* Section 4: Izoh */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Izoh / Qo‘shimcha ma’lumot</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="O‘quvchi bo‘yicha har qanday zarur qaydlar..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl shadow-md shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            <span>O‘quvchini saqlash</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
