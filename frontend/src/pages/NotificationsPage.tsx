import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const markRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" />
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time telemetry, low stock warnings, transfer dispatches, and quality control flags
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No active notifications.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                n.is_read ? 'bg-white' : 'bg-emerald-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl mt-0.5 ${
                    n.notification_type === 'ALERT'
                      ? 'bg-rose-100 text-rose-700'
                      : n.notification_type === 'WARNING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {n.notification_type === 'ALERT' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
