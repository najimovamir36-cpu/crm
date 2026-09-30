import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Shield, Filter, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { AuditLogItem } from '../../types';
import { Badge } from '../common/Badge';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ page, limit: 30, search });
      if (res.success) {
        setLogs(res.data);
        setMeta(res.meta);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit Xavfsizlik Loglari</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tizimda foydalanuvchilar tomonidan amalga oshirilgan barcha muhim harakatlar qaydi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple">Xavfsizlik & Monitoring</Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Foydalanuvchi, amal yoki obyekt bo‘yicha qidiring..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3">Vaqt</th>
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Bajarilgan Amal</th>
                <th className="px-5 py-3">Obyekt</th>
                <th className="px-5 py-3">Tafsilotlar</th>
                <th className="px-5 py-3">IP Manzil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Audit ma’lumotlari yuklanmoqda...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('uz-UZ')}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{log.userName}</td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{log.action}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[11px]">
                        {log.entity} {log.entityId ? `#${log.entityId}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-400 text-xs">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Audit loglar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Jami: {meta.total} ta log yozuvi</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="font-semibold text-slate-800">
              {page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
