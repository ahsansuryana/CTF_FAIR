import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ChallengeDetail, DockerInstanceStatus } from '../types';

export function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [instance, setInstance] = useState<DockerInstanceStatus | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [flag, setFlag] = useState('');
  const [flagResult, setFlagResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [flagLoading, setFlagLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [instanceLoading, setInstanceLoading] = useState(false);
  const [eventEnded, setEventEnded] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    api.get(`/challenges/${id}`).then(({ data }) => {
      if (data.success) {
        setChallenge(data.data);
      }
      setLoading(false);
    }).catch((err: AxiosError) => {
      if (err.response?.status === 403) {
        setEventEnded(true);
      }
      setLoading(false);
    });
    api.get(`/instances/status?challengeId=${id}`).then(({ data }) => {
      if (data.success) {
        setInstance(data.data);
        if (data.data?.hasInstance && data.data?.instance?.timeRemaining) {
          setCountdown(data.data.instance.timeRemaining);
        }
      }
    }).catch(() => {});
  }, [id]);

  // Real-time countdown
  useEffect(() => {
    if (!instance?.hasInstance || instance.instance?.status !== 'RUNNING') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setInstance(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [instance?.hasInstance, instance?.instance?.status]);

  async function handleSubmitFlag() {
    if (!id || !flag.trim()) return;
    setFlagLoading(true);
    setFlagResult(null);

    try {
      const { data } = await api.post(`/challenges/${id}/submit`, { flag: flag.trim() });
      if (data.success) {
        setFlagResult(data.data);
        if (data.data?.correct) {
          setChallenge((prev) => prev ? { ...prev, isSolved: true } : prev);
        }
      }
    } catch {
      setFlagResult({ correct: false, message: 'Submission failed' });
    } finally {
      setFlagLoading(false);
    }
  }

  async function handleGenerateInstance() {
    if (!id) return;
    setInstanceLoading(true);
    try {
      const { data } = await api.post('/instances/generate', { challengeId: id });
      if (data.success) {
        setInstance({ hasInstance: true, instance: data.data });
        setCountdown(data.data.timeRemaining);
      }
    } catch {
      // Handle error
    } finally {
      setInstanceLoading(false);
    }
  }

  async function handleStopInstance() {
    if (!instance?.instance?.id) return;
    try {
      await api.post(`/instances/${instance.instance.id}/stop`);
      setInstance(null);
      setCountdown(0);
    } catch {
      // Handle error
    }
  }

  async function handleRecreateInstance() {
    if (!id) return;
    setInstanceLoading(true);
    try {
      const { data } = await api.post('/instances/recreate', { challengeId: id });
      if (data.success) {
        setInstance({ hasInstance: true, instance: data.data });
        setCountdown(data.data.timeRemaining);
      }
    } catch {
      // Handle error
    } finally {
      setInstanceLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spinner" />
      </div>
    );
  }

  if (eventEnded) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-text-primary mb-3">Event Telah Berakhir</h2>
          <p className="text-text-secondary mb-8">Competition has ended. Challenges are no longer available.</p>
          <Link to="/dashboard" className="bg-accent hover:bg-accent/80 text-white font-medium px-6 py-2 rounded-button transition-duration-micro inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <p className="text-text-muted">Challenge not found.</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <p className="text-text-muted">Challenge not found</p>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    web: 'bg-category-web/20 text-category-web',
    crypto: 'bg-category-crypto/20 text-category-crypto',
    forensics: 'bg-category-forensics/20 text-category-forensics',
    stegano: 'bg-category-stegano/20 text-category-stegano',
    osint: 'bg-category-osint/20 text-category-osint',
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-content mx-auto px-4 py-8">
        <Link to="/dashboard" className="text-text-muted hover:text-text-primary text-sm transition-duration-micro mb-6 inline-block">
          ← Back to Challenges
        </Link>

        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-surface border border-border-default rounded-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-medium px-2 py-1 rounded-badge ${categoryColors[challenge.category] || ''}`}>
              {challenge.category.toUpperCase()}
            </span>
            <span className="font-mono text-sm text-accent">{challenge.points}pts</span>
            {challenge.isSolved && (
              <span className="text-success text-sm font-medium">✓ Solved</span>
            )}
          </div>

          <h1 className="font-display text-2xl font-semibold text-text-primary mb-4">{challenge.title}</h1>

          <div className="prose prose-invert max-w-none mb-8 text-text-secondary">
            {challenge.description}
          </div>

          {(challenge.attachmentUrl || (challenge.files ?? []).length > 0) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {challenge.attachmentUrl && (
                  <a href={challenge.attachmentUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-info/10 text-info text-sm px-4 py-2 rounded-button border border-info/30 hover:bg-info/20 transition-duration-micro"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Attachment
                  </a>
                )}
                {challenge.files?.map((f) => (
                  <a key={f.id} href={`/api/files/${f.id}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-bg-muted border border-border-subtle text-text-primary text-sm px-4 py-2 rounded-button hover:bg-bg-muted/80 transition-duration-micro"
                  >
                    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {f.filename}
                    <span className="text-xs text-text-muted">
                      {f.fileSize < 1024 ? `${f.fileSize} B` : f.fileSize < 1048576 ? `${(f.fileSize / 1024).toFixed(1)} KB` : `${(f.fileSize / 1048576).toFixed(1)} MB`}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Docker instance panel for web challenges */}
          {challenge.dockerImage && (
            <div className="bg-bg-muted border border-border-subtle rounded-card p-4 mb-6">
              <h3 className="text-sm font-medium text-text-primary mb-2">Instance</h3>
              {instance?.hasInstance && instance.instance?.status === 'RUNNING' ? (
                <div>
                  <a
                    href={instance.instance.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info text-sm hover:underline"
                  >
                    {instance.instance.url}
                  </a>
                  <p className="font-mono text-sm text-text-primary mt-2">
                    {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleStopInstance}
                      className="bg-danger hover:bg-danger/80 text-white text-sm font-medium px-4 py-2 rounded-button transition-duration-micro"
                    >
                      Stop
                    </button>
                    <button
                      onClick={handleRecreateInstance}
                      disabled={instanceLoading}
                      className="bg-warning hover:bg-warning/80 text-white text-sm font-medium px-4 py-2 rounded-button transition-duration-micro disabled:opacity-50"
                    >
                      {instanceLoading ? 'Creating...' : 'Recreate'}
                    </button>
                  </div>
                  {countdown <= 120 && (
                    <p className="text-danger text-xs mt-2">Instance will expire soon!</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleGenerateInstance}
                  disabled={instanceLoading}
                  className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-button transition-duration-micro disabled:opacity-50"
                >
                  {instanceLoading ? 'Creating...' : 'Generate Instance'}
                </button>
              )}
            </div>
          )}

          {/* Flag submission */}
          {!challenge.isSolved && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">Flag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitFlag()}
                  className={`flex-1 bg-bg-muted border rounded-button px-4 py-2.5 font-mono text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow transition-duration-micro ${
                    flagResult?.correct === false ? 'border-danger animate-shake' : flagResult?.correct ? 'border-success' : 'border-border-default'
                  }`}
                  placeholder="CTF_ITFAIR{...}"
                  disabled={flagLoading}
                />
                <button
                  onClick={handleSubmitFlag}
                  disabled={flagLoading || !flag.trim()}
                  className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-button transition-duration-micro disabled:opacity-50"
                >
                  {flagLoading ? '...' : 'Submit'}
                </button>
              </div>
              {flagResult && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm mt-2 ${flagResult.correct ? 'text-success' : 'text-danger'}`}
                >
                  {flagResult.message}
                </motion.p>
              )}
            </div>
          )}

          {/* Hints */}
          {challenge.hints.length > 0 && (
            <div>
              <button
                onClick={() => setShowHints(!showHints)}
                className="text-sm text-text-secondary hover:text-text-primary transition-duration-micro"
              >
                {showHints ? '▼' : '▶'} Hints ({challenge.hints.length})
              </button>
              {showHints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-3"
                >
                  {challenge.hints.map((hint, i) => (
                    <div key={hint.id} className="bg-bg-muted border border-border-subtle rounded-card p-3">
                      <p className="text-xs text-text-muted mb-1">Hint {i + 1}</p>
                      <p className="text-text-secondary text-sm">{hint.content}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
