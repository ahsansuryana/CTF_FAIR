import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface SetupData {
  eventName: string;
  eventDescription: string;
  flagPrefix: string;
  startTime: string;
  endTime: string;
  instanceTtlSeconds: number;
  maxInstancesPerUser: number;
  adminUsername: string;
  adminPassword: string;
  confirmPassword: string;
}

const initialData: SetupData = {
  eventName: '',
  eventDescription: '',
  flagPrefix: 'CTF_ITFAIR',
  startTime: '',
  endTime: '',
  instanceTtlSeconds: 3600,
  maxInstancesPerUser: 3,
  adminUsername: '',
  adminPassword: '',
  confirmPassword: '',
};

const steps = ['Platform', 'Event', 'Admin Account'];

export function SetupWizardPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SetupData>(initialData);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    api.get('/setup/status').then(({ data }) => {
      if (data.data?.done) {
        navigate('/login', { replace: true });
      }
    }).catch(() => {});
  }, [navigate]);

  function updateField<K extends keyof SetupData>(key: K, value: SetupData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleComplete() {
    setError('');
    setIsSubmitting(true);

    try {
      if (!data.startTime || !data.endTime) {
        setError('Start time and end time are required');
        setIsSubmitting(false);
        return;
      }

      const { data: res } = await api.post('/setup/complete', {
        eventName: data.eventName,
        eventDescription: data.eventDescription,
        flagPrefix: data.flagPrefix,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        instanceTtlSeconds: data.instanceTtlSeconds,
        maxInstancesPerUser: data.maxInstancesPerUser,
        adminUsername: data.adminUsername,
        adminPassword: data.adminPassword,
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        navigate('/admin', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Setup failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return data.eventName.length > 0;
      case 1:
        return data.startTime.length > 0 && data.endTime.length > 0 && new Date(data.endTime) > new Date(data.startTime);
      case 2:
        return data.adminUsername.length >= 3 && data.adminPassword.length >= 8 && data.adminPassword === data.confirmPassword;
      default:
        return false;
    }
  }

  return (
      <main className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-bg-surface border border-border-default rounded-card p-8">
          <h1 className="font-display text-2xl font-semibold text-text-primary text-center mb-2">
            Setup Your Event
          </h1>
          <p className="text-text-muted text-sm text-center mb-8">
            Configure your first event
          </p>

          {/* Progress bar */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-duration-micro ${
                      i <= step ? 'bg-accent text-white' : 'bg-bg-muted text-text-muted'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-sm hidden sm:block ${i <= step ? 'text-text-primary' : 'text-text-muted'}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${i < step ? 'bg-accent' : 'bg-border-subtle'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Event Name *</label>
                    <input
                      type="text"
                      value={data.eventName}
                      onChange={(e) => updateField('eventName', e.target.value)}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      placeholder="e.g. My CTF Event"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                    <textarea
                      value={data.eventDescription}
                      onChange={(e) => updateField('eventDescription', e.target.value)}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow resize-none h-24"
                      placeholder="Event description..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Flag Prefix</label>
                    <input
                      type="text"
                      value={data.flagPrefix}
                      onChange={(e) => updateField('flagPrefix', e.target.value)}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary font-mono focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      placeholder="CTF_ITFAIR"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Start Time *</label>
                      <input
                        type="datetime-local"
                        value={data.startTime}
                        onChange={(e) => updateField('startTime', e.target.value)}
                        className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">End Time *</label>
                      <input
                        type="datetime-local"
                        value={data.endTime}
                        onChange={(e) => updateField('endTime', e.target.value)}
                        className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Instance TTL (seconds)</label>
                      <input
                        type="number"
                        value={data.instanceTtlSeconds}
                        onChange={(e) => updateField('instanceTtlSeconds', parseInt(e.target.value, 10))}
                        min={60}
                        className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary font-mono focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Max Instances / User</label>
                      <input
                        type="number"
                        value={data.maxInstancesPerUser}
                        onChange={(e) => updateField('maxInstancesPerUser', parseInt(e.target.value, 10))}
                        min={1}
                        className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary font-mono focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Admin Username *</label>
                    <input
                      type="text"
                      value={data.adminUsername}
                      onChange={(e) => updateField('adminUsername', e.target.value)}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      placeholder="admin"
                      minLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Password *</label>
                    <input
                      type="password"
                      value={data.adminPassword}
                      onChange={(e) => updateField('adminPassword', e.target.value)}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      placeholder="Min 8 characters"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password *</label>
                    <input
                      type="password"
                      value={data.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent focus:shadow-accent-glow"
                      placeholder="Repeat password"
                    />
                    {data.confirmPassword && data.adminPassword !== data.confirmPassword && (
                      <p className="text-danger text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-button px-4 py-3 mt-4">
              {error}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-duration-micro disabled:opacity-50"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2 rounded-button transition-duration-micro disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || isSubmitting}
                className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2 rounded-button transition-duration-micro disabled:opacity-50"
              >
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
