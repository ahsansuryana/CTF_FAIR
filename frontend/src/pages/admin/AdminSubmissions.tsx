import { useEffect, useState } from 'react';
import api from '../../lib/api';
import socket from '../../lib/socket';

interface Submission {
  id: string;
  username: string;
  challengeTitle: string;
  flagSubmitted: string;
  isCorrect: boolean;
  ipAddress: string | null;
  submittedAt: string;
}

export function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadSubmissions();
    socket.connect();
    socket.on('scoreboard:update', () => loadSubmissions());
    return () => { socket.disconnect(); };
  }, []);

  async function loadSubmissions() {
    try {
      const { data } = await api.get('/admin/submissions', { params: { limit: 100 } });
      if (data.success) setSubmissions(data.data?.submissions || []);
    } catch {}
  }

  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.isCorrect === (filter === 'correct'));

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">Submissions</h1>

      <div className="flex gap-2 mb-4">
        {['all', 'correct', 'wrong'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-button transition-duration-micro ${
              filter === f ? 'bg-accent text-white' : 'bg-bg-muted text-text-secondary hover:text-text-primary'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-bg-surface border border-border-default rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Time</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">User</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Challenge</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3 hidden md:table-cell">Flag</th>
              <th className="text-center text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Result</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3 hidden lg:table-cell">IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className={`border-b border-border-subtle last:border-0 text-sm ${s.isCorrect ? 'bg-solved-bg' : ''}`}>
                <td className="px-4 py-2 font-mono text-text-muted text-xs">{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}</td>
                <td className="px-4 py-2 text-text-primary">{s.username}</td>
                <td className="px-4 py-2 text-text-secondary">{s.challengeTitle}</td>
                <td className="px-4 py-2 font-mono text-text-muted text-xs hidden md:table-cell max-w-[200px] truncate">{s.flagSubmitted}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`text-xs font-medium ${s.isCorrect ? 'text-success' : 'text-danger'}`}>
                    {s.isCorrect ? '✓' : '✗'}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-text-muted text-xs text-right hidden lg:table-cell">{s.ipAddress || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
