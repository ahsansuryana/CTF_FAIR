import { useEffect, useState } from 'react';
import api from '../../lib/api';

interface Participant {
  id: string;
  username: string;
  isBanned: boolean;
  createdAt: string;
  totalPoints: number;
  solveCount: number;
}

export function AdminParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    const { data } = await api.get('/admin/participants');
    if (data.success) setParticipants(data.data || []);
  }

  async function addParticipant() {
    setError('');
    try {
      await api.post('/admin/participants', { username, password });
      setShowAdd(false);
      setUsername('');
      setPassword('');
      await loadParticipants();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add participant');
    }
  }

  async function toggleBan(id: string) {
    await api.patch(`/admin/participants/${id}/toggle-ban`);
    setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, isBanned: !p.isBanned } : p));
  }

  async function handleResetPassword() {
    if (!resetId || !newPassword) return;
    setError('');
    try {
      await api.patch(`/admin/participants/${resetId}/reset-password`, { newPassword });
      setResetId(null);
      setNewPassword('');
      await loadParticipants();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to reset password');
    }
  }

  async function handleDelete(id: string) {
    setError('');
    try {
      await api.delete(`/admin/participants/${id}`);
      setDeleteId(null);
      await loadParticipants();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete participant');
      setDeleteId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Participants</h1>
        <button
          onClick={() => { setShowAdd(true); setError(''); }}
          className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-button text-sm transition-duration-micro"
        >
          + Add Participant
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{error}</div>
      )}

      {showAdd && (
        <div className="bg-bg-surface border border-border-default rounded-card p-4 mb-6">
          <div className="flex gap-3">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Username" autoComplete="off"
              className="bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" autoComplete="off"
              className="bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
            <button onClick={addParticipant} disabled={!username || password.length < 8}
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-button text-sm disabled:opacity-50">
              Save
            </button>
            <button onClick={() => { setShowAdd(false); setError(''); }} className="text-text-muted hover:text-text-primary text-sm px-2">Cancel</button>
          </div>
        </div>
      )}

      {resetId && (
        <div className="bg-bg-surface border border-border-default rounded-card p-4 mb-6">
          <p className="text-sm text-text-secondary mb-3">Reset password for <span className="text-text-primary font-medium">{participants.find((p) => p.id === resetId)?.username}</span></p>
          <div className="flex gap-3">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)" autoComplete="off"
              className="bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
            <button onClick={handleResetPassword} disabled={newPassword.length < 8}
              className="bg-warning hover:bg-warning/80 text-white px-4 py-2 rounded-button text-sm disabled:opacity-50">
              Reset
            </button>
            <button onClick={() => { setResetId(null); setNewPassword(''); setError(''); }} className="text-text-muted hover:text-text-primary text-sm px-2">Cancel</button>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-bg-surface border border-border-default rounded-card p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">Delete Participant</h3>
            <p className="text-text-secondary text-sm mb-4">Are you sure? Participants with submissions cannot be deleted.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="text-text-muted hover:text-text-primary text-sm px-3 py-2">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="bg-danger hover:bg-danger/80 text-white font-medium px-4 py-2 rounded-button text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-bg-surface border border-border-default rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Username</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Points</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Solves</th>
              <th className="text-center text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-muted/50">
                <td className="px-4 py-3 text-sm text-text-primary">{p.username}</td>
                <td className="px-4 py-3 text-sm font-mono text-accent text-right">{p.totalPoints}</td>
                <td className="px-4 py-3 text-sm font-mono text-text-secondary text-right">{p.solveCount}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-button ${p.isBanned ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                    {p.isBanned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => toggleBan(p.id)}
                    className="text-text-muted hover:text-warning text-sm transition-duration-micro"
                  >
                    {p.isBanned ? 'Unban' : 'Ban'}
                  </button>
                  <button
                    onClick={() => { setResetId(p.id); setNewPassword(''); setError(''); }}
                    className="text-text-muted hover:text-text-primary text-sm transition-duration-micro"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="text-text-muted hover:text-danger text-sm transition-duration-micro"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
