import { useEffect, useState } from 'react';
import api from '../../lib/api';

export function AdminSettings() {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/config').then(({ data }) => {
      if (data.success) setConfig(data.data);
    }).catch(() => {});
  }, []);

  async function saveConfig() {
    setSaving(true);
    try {
      await api.put('/admin/config', config);
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-semibold text-text-primary mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-bg-surface border border-border-default rounded-card p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Event Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Event Name</label>
              <input
                type="text"
                value={(config.event_name as string) || ''}
                onChange={(e) => updateConfig('event_name', e.target.value)}
                className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Flag Prefix</label>
              <input
                type="text"
                value={(config.flag_prefix as string) || ''}
                onChange={(e) => updateConfig('flag_prefix', e.target.value)}
                className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-card p-6">
          <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Docker Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Instance TTL (seconds)</label>
              <input
                type="number"
                value={(config.instance_ttl_seconds as number) || 3600}
                onChange={(e) => updateConfig('instance_ttl_seconds', parseInt(e.target.value, 10))}
                min={60}
                className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Max Instances per User</label>
              <input
                type="number"
                value={(config.max_instances_per_user as number) || 3}
                onChange={(e) => updateConfig('max_instances_per_user', parseInt(e.target.value, 10))}
                min={1}
                className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-button transition-duration-micro disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
