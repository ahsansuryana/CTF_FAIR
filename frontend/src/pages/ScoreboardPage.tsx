import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import socket from '../lib/socket';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useEventStore } from '../store/eventStore';
import { ScoreboardEntry } from '../types';

export function ScoreboardPage() {
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const prefersReduced = useReducedMotion();
  const eventName = useEventStore((s) => s.eventName);
  const loadEventInfo = useEventStore((s) => s.loadEventInfo);

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

  function getRankDisplay(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-content mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary mb-2">{eventName}</h1>
        <p className="text-text-muted text-sm mb-8">Scoreboard</p>

        {isFrozen && (
          <div className="bg-warning/10 border border-warning/30 text-warning text-sm rounded-button px-4 py-3 mb-4 text-center">
            Scoreboard is frozen — standings are no longer being updated
          </div>
        )}

        {scoreboard.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted">Event belum dimulai</p>
          </div>
        ) : (
          <div className="bg-bg-surface border border-border-default rounded-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3 w-16">Rank</th>
                  <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Username</th>
                  <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Score</th>
                  <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Solves</th>
                  <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3 hidden md:table-cell">Last Solve</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, index) => (
                  <motion.tr
                    key={entry.userId}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: prefersReduced ? 0 : index * 0.03 }}
                    className="border-b border-border-subtle last:border-0 hover:bg-bg-muted/50 transition-duration-micro"
                    layout={!prefersReduced}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{getRankDisplay(entry.rank)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-primary font-medium">{entry.username}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-accent font-semibold">{entry.totalPoints}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="font-mono text-text-secondary text-sm">{entry.solvedCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-text-muted text-xs">
                        {entry.lastSolveAt ? new Date(entry.lastSolveAt).toLocaleString() : '-'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
