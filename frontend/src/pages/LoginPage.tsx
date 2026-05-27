import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import api from '../lib/api';

export function LoginPage() {
  const prefersReduced = useReducedMotion();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventName, setEventName] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/event/info').then(({ data }) => {
      if (data.success && data.data?.name) {
        setEventName(data.data.name);
        document.title = data.data.name;
      }
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      const user = useAuthStore.getState().user;
      if (user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid username or password';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base p-4">
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-bg-surface border border-border-default rounded-card p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-semibold text-text-primary">{eventName || 'Event'}</h1>
            <p className="text-text-muted text-sm mt-2">Sign in to your account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-button px-4 py-3 mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary font-body focus:outline-none focus:border-accent focus:shadow-accent-glow transition-duration-micro"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary font-body focus:outline-none focus:border-accent focus:shadow-accent-glow transition-duration-micro"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-2.5 px-4 rounded-button transition-duration-micro disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-text-muted text-xs mt-6">Powered by CTF FAIR</p>
        </div>
      </motion.div>
    </div>
  );
}
