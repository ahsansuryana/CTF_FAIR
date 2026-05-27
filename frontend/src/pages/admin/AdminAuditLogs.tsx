import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface LogEntry {
  id: string;
  actorUsername: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    api.get('/admin/audit-logs', { params: { limit: 100 } }).then(({ data }) => {
      if (data.success) setLogs(data.data?.logs || []);
    }).catch(() => {});
  }, []);

  async function exportCSV() {
    const { data } = await api.get('/admin/audit-logs/export', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Audit Log</h1>
        <button
          onClick={exportCSV}
          className="bg-bg-muted hover:bg-bg-elevated text-text-secondary px-4 py-2 rounded-button text-sm border border-border-default transition-duration-micro"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Timestamp</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Actor</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Action</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3 hidden md:table-cell">Target</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3 hidden lg:table-cell">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-muted/50">
                <td className="px-4 py-2 font-mono text-text-muted text-xs">{l.createdAt ? new Date(l.createdAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-2 text-sm text-text-primary">{l.actorUsername}</td>
                <td className="px-4 py-2 text-sm">
                  <span className="bg-bg-muted text-text-secondary px-2 py-0.5 rounded-badge text-xs">{l.action}</span>
                </td>
                <td className="px-4 py-2 text-sm text-text-muted hidden md:table-cell">{l.targetType || '-'}</td>
                <td className="px-4 py-2 font-mono text-text-muted text-xs text-right hidden lg:table-cell">{l.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
