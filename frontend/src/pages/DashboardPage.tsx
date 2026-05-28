import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AxiosError } from 'axios';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ChallengeStatus, ScoreboardEntry } from '../types';

const categoryColors: Record<string, string> = {
  web: 'bg-category-web/20 text-category-web border-category-web/30',
  crypto: 'bg-category-crypto/20 text-category-crypto border-category-crypto/30',
  forensics: 'bg-category-forensics/20 text-category-forensics border-category-forensics/30',
  stegano: 'bg-category-stegano/20 text-category-stegano border-category-stegano/30',
  osint: 'bg-category-osint/20 text-category-osint border-category-osint/30',
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [challenges, setChallenges] = useState<ChallengeStatus[]>([]);
  const [myStats, setMyStats] = useState<{ rank: number; points: number; solves: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventEnded, setEventEnded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/challenges'),
      api.get('/scoreboard'),
    ]).then(([{ data: chalData }, { data: scoreData }]) => {
      if (chalData.success) {
        setChallenges(chalData.data || []);
      }
      if (scoreData.success && user) {
        const entries: ScoreboardEntry[] = scoreData.data?.scoreboard || [];
        const myEntry = entries.find((e) => e.userId === user.id);
        if (myEntry) {
          setMyStats({ rank: myEntry.rank, points: myEntry.totalPoints, solves: myEntry.solvedCount });
        } else {
          const totalPoints = (chalData.data || []).filter((c: ChallengeStatus) => c.isSolved).reduce((sum: number, c: ChallengeStatus) => sum + c.points, 0);
          const solvedCount = (chalData.data || []).filter((c: ChallengeStatus) => c.isSolved).length;
          setMyStats({ rank: entries.length + 1, points: totalPoints, solves: solvedCount });
        }
      }
      setLoading(false);
    }).catch((err: AxiosError) => {
      if (err.response?.status === 403) {
        setEventEnded(true);
      }
      setLoading(false);
    });
  }, [user]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spinner" />
      </main>
    );
  }

  if (eventEnded) {
    return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-text-primary mb-3">Event Telah Berakhir</h2>
          <p className="text-text-secondary mb-8">Competition has ended. Challenges are no longer available.</p>
          <button
            onClick={async () => { await logout(); navigate('/login'); }}
            className="bg-accent hover:bg-accent/80 text-white font-medium px-6 py-2 rounded-button transition-duration-micro"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="max-w-content mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-bg-surface border border-border-default rounded-card p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-text-primary">{user?.username || 'Participant'}</h2>
              <p className="text-text-muted text-sm mt-0.5">Participant Dashboard</p>
            </div>
            <div className="flex items-center gap-6">
              {myStats && (
                <>
                  <div className="text-center">
                    <p className="font-mono text-lg font-semibold text-accent">#{myStats.rank}</p>
                    <p className="text-text-muted text-xs">Rank</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-lg font-semibold text-accent">{myStats.points}</p>
                    <p className="text-text-muted text-xs">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-lg font-semibold text-accent">{myStats.solves}</p>
                    <p className="text-text-muted text-xs">Solves</p>
                  </div>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-bg-muted hover:bg-bg-elevated text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-button text-sm border border-border-default transition-duration-micro"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">Challenges</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReduced ? 0 : index * 0.05, duration: prefersReduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {challenge.isLocked ? (
                <div className="bg-bg-surface border border-border-subtle rounded-card p-6 opacity-50 cursor-not-allowed">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-badge border ${categoryColors[challenge.category] || ''}`}>
                      {challenge.category.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm text-accent">{challenge.points}pts</span>
                  </div>
                  <h3 className="font-display text-lg font-medium text-text-disabled mb-2">{challenge.title}</h3>
                    <div className="flex items-center gap-2 text-text-muted text-sm mt-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>Locked</span>
                  </div>
                </div>
              ) : (
                <Link to={`/challenge/${challenge.id}`} className="block">
                  <div
                    className={`bg-bg-surface border rounded-card p-6 transition-all duration-micro hover:-translate-y-0.5 hover:shadow-card-hover ${
                      challenge.isSolved
                        ? 'border-solved-border bg-solved-bg'
                        : 'border-border-default hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-badge border ${categoryColors[challenge.category] || ''}`}>
                        {challenge.category.toUpperCase()}
                      </span>
                      <span className="font-mono text-sm text-accent">{challenge.points}pts</span>
                    </div>
                    <h3 className="font-display text-lg font-medium text-text-primary mb-2">{challenge.title}</h3>
                    <p className="text-text-secondary text-sm line-clamp-2">{challenge.description}</p>
                    <div className="flex items-center gap-2 mt-4">
                      {challenge.isSolved ? (
                        <span className="text-success text-sm font-medium">✓ Solved</span>
                      ) : (
                        <span className="text-accent text-sm font-medium">Available</span>
                      )}
                      {challenge.hintCount > 0 && (
                        <span className="text-text-muted text-xs ml-auto">{challenge.hintCount} hint{challenge.hintCount > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-muted">No challenges available yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
