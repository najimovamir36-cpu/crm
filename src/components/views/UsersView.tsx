import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, User as UserIcon, Phone, Trash2, Edit2, AlertCircle, Key } from 'lucide-react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export const UsersView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success) setUsers(res.data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('ADMIN');
    setPhone('');
    setStatus('ACTIVE');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setPhone(u.phone);
    setStatus(u.status);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setError('Ism va login kiritilishi shart');
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi shart');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          fullName: fullName.trim(),
          role,
          phone: phone.trim(),
          status,
          password: password ? password.trim() : undefined,
        });
      } else {
        await api.createUser({
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          password: password.trim(),
          role,
          phone: phone.trim(),
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteUser(userToDelete.id);
      if (res.success) {
        setUserToDelete(null);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Foydalanuvchini o‘chirishda xatolik');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Adminlar va Xodimlar</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role Based Access Control (Super Admin, Admin, Operator, O‘qituvchi)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yangi xodim qo‘shish</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3">Xodim</th>
                <th className="px-5 py-3">Login</th>
                <th className="px-5 py-3">Roli (Vakolati)</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center font-bold text-orange-700 text-xs">
                        {u.fullName.charAt(0)}
                      </div>
                      <span>{u.fullName}</span>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-mono font-medium">
                          Siz
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-700">{u.username}</td>
                  <td className="px-5 py-3">
                    {u.role === 'SUPER_ADMIN' && <Badge variant="purple">SUPER ADMIN</Badge>}
                    {u.role === 'ADMIN' && <Badge variant="info">ADMIN</Badge>}
                    {u.role === 'OPERATOR' && <Badge variant="warning">OPERATOR</Badge>}
                    {u.role === 'TEACHER' && <Badge variant="neutral">TEACHER</Badge>}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-600">{u.phone || '-'}</td>
                  <td className="px-5 py-3">
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {u.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        title="Tahrirlash / Parolni yangilash"
                        className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => setUserToDelete(u)}
                          title="O‘chirish"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Xodimni Tahrirlash' : '+ Yangi Xodim Qo‘shish'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ism va familiya <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Sardor Raximov"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Login (Username) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              disabled={Boolean(editingUser)}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masalan: admin_sardor"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 disabled:opacity-60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {editingUser ? 'Yangi parol (ixtiyoriy, agar o‘zgartirilmasa bo‘sh qoldiring)' : 'Parol (kamida 6 belgi) *'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              required={!editingUser}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Roli (Vakolat)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="TEACHER">TEACHER</option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                <option value="ACTIVE">Faol (Active)</option>
                <option value="INACTIVE">Nofaol (Inactive)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl cursor-pointer"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Xodimni o‘chirish"
        message={`Haqiqatan ham ushbu xodim hisobini (${userToDelete?.fullName}, ${userToDelete?.username}) o‘chirmoqchimisiz?`}
        confirmText="Ha, o‘chirish"
        cancelText="Bekor qilish"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
