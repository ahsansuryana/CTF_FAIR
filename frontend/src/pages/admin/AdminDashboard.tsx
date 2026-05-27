import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { AdminStats } from '../../types';

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => {
      if (data.success) {
        setStats(data.data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">Dashboard</h1>

      {stats && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-surface border border-border-default rounded-card p-6">
              <p className="text-text-muted text-sm">Participants</p>
              <p className="font-display text-3xl font-semibold text-text-primary mt-1">{stats.totalParticipants}</p>
            </div>
            <div className="bg-bg-surface border border-border-default rounded-card p-6">
              <p className="text-text-muted text-sm">Total Solves</p>
              <p className="font-display text-3xl font-semibold text-text-primary mt-1">{stats.totalSolves}</p>
            </div>
            <div className="bg-bg-surface border border-border-default rounded-card p-6">
              <p className="text-text-muted text-sm">Challenges</p>
              <p className="font-display text-3xl font-semibold text-text-primary mt-1">{stats.totalChallenges}</p>
            </div>
            <div className="bg-bg-surface border border-border-default rounded-card p-6">
              <p className="text-text-muted text-sm">Event Status</p>
              <p className={`font-display text-lg font-semibold mt-1 ${stats.eventStatus.isRunning ? 'text-success' : 'text-text-muted'}`}>
                {stats.eventStatus.isRunning ? 'Running' : 'Stopped'}
              </p>
            </div>
          </div>

          {/* Event controls */}
          <div className="bg-bg-surface border border-border-default rounded-card p-6 mb-8">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Event Controls</h2>
            <div className="flex gap-3">
              {!stats.eventStatus.isRunning ? (
                <button
                  onClick={async () => {
                    await api.post('/admin/event/start');
                    window.location.reload();
                  }}
                  className="bg-success hover:bg-success/80 text-white font-medium px-4 py-2 rounded-button transition-duration-micro text-sm"
                >
                  Start Event
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await api.post('/admin/event/stop');
                    window.location.reload();
                  }}
                  className="bg-danger hover:bg-danger/80 text-white font-medium px-4 py-2 rounded-button transition-duration-micro text-sm"
                >
                  Stop Event
                </button>
              )}
              <button
                onClick={async () => {
                  await api.patch('/admin/scoreboard/freeze');
                  window.location.reload();
                }}
                className="bg-warning hover:bg-warning/80 text-white font-medium px-4 py-2 rounded-button transition-duration-micro text-sm"
              >
                {stats.eventStatus.isFrozen ? 'Unfreeze Scoreboard' : 'Freeze Scoreboard'}
              </button>
            </div>
          </div>

          {/* Recent submissions */}
          <div className="bg-bg-surface border border-border-default rounded-card p-6">
            <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Recent Submissions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-3 py-2">User</th>
                    <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-3 py-2">Challenge</th>
                    <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-3 py-2">Status</th>
                    <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSubmissions.map((s) => (
                    <tr key={s.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-3 py-2 text-sm text-text-primary">{s.username}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{s.challengeTitle}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={s.isCorrect ? 'text-success' : 'text-danger'}>
                          {s.isCorrect ? 'Correct' : 'Wrong'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-text-muted text-right">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
