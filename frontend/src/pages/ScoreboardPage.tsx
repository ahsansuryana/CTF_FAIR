import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import socket from '../lib/socket';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useEventStore } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import { ScoreboardEntry } from '../types';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <svg className="w-5 h-5 text-warning" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="font-mono text-sm font-semibold text-warning">1</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <svg className="w-5 h-5 text-text-muted" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="font-mono text-sm font-semibold text-text-secondary">2</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="font-mono text-sm font-semibold text-accent">3</span>
      </span>
    );
  }
  return <span className="font-mono text-sm text-text-secondary">#{rank}</span>;
}

export function ScoreboardPage() {
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const prefersReduced = useReducedMotion();
  const eventName = useEventStore((s) => s.eventName);
  const loadEventInfo = useEventStore((s) => s.loadEventInfo);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get('/scoreboard').then(({ data }) => {
      if (data.success) {
        setScoreboard(data.data?.scoreboard || []);
        setIsFrozen(data.data?.isFrozen || false);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    loadEventInfo();

    socket.connect();
    socket.on('scoreboard:update', (data: unknown) => {
      if (Array.isArray(data)) {
        setScoreboard(data as ScoreboardEntry[]);
      }
    });
    socket.on('scoreboard:freeze', (payload: unknown) => {
      if (payload && typeof payload === 'object' && 'isFrozen' in payload) {
        setIsFrozen((payload as { isFrozen: boolean }).isFrozen);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spinner" />
          <p className="text-text-muted text-sm">Loading scoreboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="max-w-content mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-semibold text-text-primary mb-2 text-wrap-balance">{eventName}</h1>
          <p className="text-text-muted text-sm">Scoreboard</p>
        </div>

        {isFrozen && (
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-button px-4 py-3 mb-6 max-w-xl mx-auto"
          >
            <svg className="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-warning text-sm">Scoreboard is frozen — standings are no longer being updated</span>
          </motion.div>
        )}

        {scoreboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-text-secondary text-sm">No participants yet</p>
            <p className="text-text-muted text-xs">Entries will appear here once participants start solving challenges</p>
          </div>
        ) : (
          <div className="bg-bg-surface border border-border-default rounded-card overflow-hidden max-w-4xl mx-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-5 py-3.5 w-20">
                    <span className="font-label text-text-muted">Rank</span>
                  </th>
                  <th className="text-left px-5 py-3.5">
                    <span className="font-label text-text-muted">Username</span>
                  </th>
                  <th className="text-right px-5 py-3.5">
                    <span className="font-label text-text-muted">Score</span>
                  </th>
                  <th className="text-right px-5 py-3.5 hidden sm:table-cell">
                    <span className="font-label text-text-muted">Solves</span>
                  </th>
                  <th className="text-right px-5 py-3.5 hidden md:table-cell">
                    <span className="font-label text-text-muted">Last Solve</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, index) => {
                  const isCurrentUser = currentUser && entry.userId === currentUser.id;
                  return (
                    <motion.tr
                      key={entry.userId}
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReduced ? 0 : Math.min(index * 0.02, 0.4), duration: prefersReduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={`border-b border-border-subtle last:border-0 transition-duration-micro ${
                        isCurrentUser
                          ? 'bg-accent-subtle hover:bg-accent-subtle'
                          : 'hover:bg-bg-muted/30'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-body text-sm ${isCurrentUser ? 'text-accent font-medium' : 'text-text-primary'}`}>
                            {entry.username}
                          </span>
                          {isCurrentUser && (
                            <span className="font-label text-accent-subtle text-accent text-[10px] leading-none px-1.5 py-0.5 rounded-badge border border-accent/30 bg-accent/10">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-mono text-sm text-accent font-semibold">{entry.totalPoints}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                        <span className="font-mono text-sm text-text-secondary">{entry.solvedCount}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden md:table-cell">
                        <span className="font-body text-xs text-text-muted">
                          {entry.lastSolveAt ? new Date(entry.lastSolveAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
