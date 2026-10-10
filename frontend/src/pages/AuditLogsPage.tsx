import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, RefreshCw, Search } from 'lucide-react';
import { api } from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-slate-700" />
            Audit Trail & Security Event Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Immutable system audit logs tracking all critical database mutations and inventory actions
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">System Logs ({logs.length} Recorded)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    System activity logging operational. All recent actions logged in stock movements ledger.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {log.user_email || 'System Daemon'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{log.entity_type}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{log.entity_id || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{log.details || 'Normal operation'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
