import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  flag: string;
  orderIndex: number;
  isActive: boolean;
  dockerImage: string | null;
  attachmentUrl: string | null;
  composeStatus: string;
  _count: { solves: number; submissions: number };
  hints: { id: string; content: string; orderIndex: number }[];
}

interface ChallengeFile {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

const defaultForm = {
  title: '', description: '', category: 'web', points: 100, flag: '',
  orderIndex: 1, isActive: true, dockerImage: '', attachmentUrl: '',
};

type Tab = 'details' | 'files' | 'hints';

const CATEGORIES = ['web', 'crypto', 'forensics', 'stegano', 'osint'];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminChallenges() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Files state
  const [files, setFiles] = useState<ChallengeFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compose state
  const [composeStatus, setComposeStatus] = useState('none');
  const [composeImage, setComposeImage] = useState('');
  const [buildingCompose, setBuildingCompose] = useState(false);
  const composeInputRef = useRef<HTMLInputElement>(null);

  // Hints state
  const [hints, setHints] = useState<{ id: string; content: string; orderIndex: number }[]>([]);
  const [newHint, setNewHint] = useState('');
  const [editingHintId, setEditingHintId] = useState<string | null>(null);
  const [editingHintContent, setEditingHintContent] = useState('');

  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    if (action === 'add') {
      setEditId(null);
      setActiveTab('details');
      setError('');
      const nextOrder = challenges.length > 0 ? Math.max(...challenges.map((c) => c.orderIndex)) + 1 : 1;
      setForm({ ...defaultForm, orderIndex: nextOrder });
    } else if (action === 'edit' && id) {
      setError('');
      const c = challenges.find((x) => x.id === id);
      if (c) {
        setEditId(c.id);
        setForm({
          title: c.title, description: c.description, category: c.category,
          points: c.points, flag: c.flag, orderIndex: c.orderIndex,
          isActive: c.isActive, dockerImage: c.dockerImage || '',
          attachmentUrl: c.attachmentUrl || '',
        });
        setHints(c.hints || []);
        loadFiles(c.id);
        loadComposeStatus(c.id);
      } else {
        loadChallengeById(id);
      }
    }
  }, [searchParams]);

  async function loadChallenges() {
    const { data } = await api.get('/admin/challenges');
    if (data.success) setChallenges(data.data || []);
  }

  async function loadChallengeById(id: string) {
    const { data } = await api.get('/admin/challenges');
    if (data.success) {
      const c = data.data.find((x: Challenge) => x.id === id);
      if (c) {
        setEditId(c.id);
        setForm({
          title: c.title, description: c.description, category: c.category,
          points: c.points, flag: c.flag, orderIndex: c.orderIndex,
          isActive: c.isActive, dockerImage: c.dockerImage || '',
          attachmentUrl: c.attachmentUrl || '',
        });
        setHints(c.hints || []);
        loadFiles(c.id);
        loadComposeStatus(c.id);
      }
    }
  }

  async function loadFiles(challengeId: string) {
    try {
      const { data } = await api.get(`/admin/challenges/${challengeId}/files`);
      if (data.success) setFiles(data.data || []);
    } catch { }
  }

  async function loadComposeStatus(challengeId: string) {
    try {
      const { data } = await api.get(`/admin/challenges/${challengeId}/compose`);
      if (data.success) {
        setComposeStatus(data.data.composeStatus || 'none');
        setComposeImage(data.data.dockerImage || '');
      }
    } catch { }
  }

  function closeForm() {
    setSearchParams({});
    setEditId(null);
    setForm(defaultForm);
    setActiveTab('details');
    setFiles([]);
    setComposeStatus('none');
    setComposeImage('');
    setHints([]);
    setNewHint('');
    setEditingHintId(null);
  }

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.dockerImage) delete (payload as any).dockerImage;
      if (!payload.attachmentUrl) delete (payload as any).attachmentUrl;
      if (editId) {
        await api.put(`/admin/challenges/${editId}`, payload);
      } else {
        await api.post('/admin/challenges', payload);
      }
      closeForm();
      await loadChallenges();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save challenge');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/challenges/${id}`);
      setDeleteId(null);
      await loadChallenges();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete challenge');
      setDeleteId(null);
    }
  }

  async function toggleActive(id: string) {
    await api.patch(`/admin/challenges/${id}/toggle`);
    setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
  }

  // File handlers
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editId) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/admin/challenges/${editId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadFiles(editId);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleFileDelete(fileId: string) {
    if (!editId) return;
    try {
      await api.delete(`/admin/challenges/${editId}/files/${fileId}`);
      await loadFiles(editId);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Delete failed');
    }
  }

  // Compose handlers
  async function handleComposeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editId) return;

    setBuildingCompose(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('compose', file);
      await api.post(`/admin/challenges/${editId}/compose`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10 * 60 * 1000,
      });
      await loadComposeStatus(editId);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Compose build failed');
      await loadComposeStatus(editId);
    } finally {
      setBuildingCompose(false);
      if (composeInputRef.current) composeInputRef.current.value = '';
    }
  }

  async function handleComposeDelete() {
    if (!editId) return;
    try {
      await api.delete(`/admin/challenges/${editId}/compose`);
      setComposeStatus('none');
      setComposeImage('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Delete compose failed');
    }
  }

  // Hint handlers
  async function handleAddHint() {
    if (!editId || !newHint.trim()) return;
    try {
      await api.post(`/admin/challenges/${editId}/hints`, {
        content: newHint.trim(),
        orderIndex: hints.length + 1,
      });
      setNewHint('');
      await refreshHints();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add hint');
    }
  }

  async function handleEditHint(hintId: string) {
    if (!editingHintContent.trim()) return;
    try {
      await api.put(`/admin/hints/${hintId}`, { content: editingHintContent.trim() });
      setEditingHintId(null);
      setEditingHintContent('');
      await refreshHints();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update hint');
    }
  }

  async function handleDeleteHint(hintId: string) {
    try {
      await api.delete(`/admin/hints/${hintId}`);
      await refreshHints();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete hint');
    }
  }

  async function refreshHints() {
    if (!editId) return;
    const { data } = await api.get('/admin/challenges');
    if (data.success) {
      const c = data.data.find((x: Challenge) => x.id === editId);
      if (c) setHints(c.hints || []);
    }
  }

  const showForm = searchParams.get('action') === 'add' || searchParams.get('action') === 'edit';
  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'files', label: 'Files' },
    { key: 'hints', label: 'Hints' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Challenges</h1>
        <button
          onClick={() => setSearchParams({ action: 'add' })}
          className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-button text-sm transition-duration-micro"
        >
          + Add Challenge
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-surface border border-border-default rounded-card mb-6">
          {/* Tabs */}
          <div className="flex border-b border-border-subtle">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium transition-duration-micro border-b-2 ${
                  activeTab === tab.key
                    ? 'text-accent border-accent'
                    : 'text-text-muted border-transparent hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm mx-6 mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary mb-4">
                  {editId ? 'Edit Challenge' : 'Add Challenge'}
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Title</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Points</label>
                    <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Order</label>
                    <input type="number" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) || 1 })}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" rows={3} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Flag</label>
                    <input type="text" value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Docker Image (optional)</label>
                    <input type="text" value={form.dockerImage} onChange={(e) => setForm({ ...form, dockerImage: e.target.value })}
                      placeholder="web-easy-1:latest"
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Attachment URL (optional)</label>
                    <input type="text" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                      className="w-full bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={loading || !form.title || !form.flag}
                    className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-button text-sm transition-duration-micro disabled:opacity-50">
                    {loading ? 'Saving...' : (editId ? 'Update Challenge' : 'Create Challenge')}
                  </button>
                  <button onClick={closeForm} className="text-text-muted hover:text-text-primary text-sm transition-duration-micro">Cancel</button>
                </div>
              </div>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Challenge Files</h2>

                {!editId ? (
                  <p className="text-text-muted text-sm">Save the challenge first before uploading files.</p>
                ) : (
                  <>
                    {/* File Attachments */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-medium text-text-primary">Attachments</h3>
                        <label className="bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-button text-sm cursor-pointer transition-duration-micro">
                          {uploading ? 'Uploading...' : '+ Upload File'}
                          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                      </div>

                      {files.length === 0 ? (
                        <p className="text-text-muted text-sm">No files uploaded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {files.map((f) => (
                            <div key={f.id} className="flex items-center justify-between bg-bg-muted/50 border border-border-subtle rounded-lg px-4 py-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-text-primary truncate">{f.filename}</span>
                                <span className="text-xs text-text-muted shrink-0">{formatSize(f.fileSize)}</span>
                              </div>
                              <button onClick={() => handleFileDelete(f.id)}
                                className="text-text-muted hover:text-danger text-sm ml-3 shrink-0 transition-duration-micro">
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Docker Compose */}
                    <div className="border-t border-border-subtle pt-6">
                      <h3 className="text-sm font-medium text-text-primary mb-3">Docker Compose</h3>

                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-button ${
                          composeStatus === 'ready' ? 'bg-success/20 text-success' :
                          composeStatus === 'building' ? 'bg-warning/20 text-warning' :
                          composeStatus === 'error' ? 'bg-danger/20 text-danger' :
                          'bg-text-disabled/20 text-text-disabled'
                        }`}>
                          {composeStatus === 'ready' ? 'Ready' :
                           composeStatus === 'building' ? 'Building...' :
                           composeStatus === 'error' ? 'Error' :
                           'Not Uploaded'}
                        </span>
                        {composeImage && (
                          <span className="text-xs text-text-muted font-mono">{composeImage}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {composeStatus === 'none' || composeStatus === 'error' ? (
                          <label className="bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-button text-sm cursor-pointer transition-duration-micro">
                            {buildingCompose ? 'Building...' : 'Upload ZIP'}
                            <input ref={composeInputRef} type="file" accept=".zip" className="hidden" onChange={handleComposeUpload} disabled={buildingCompose} />
                          </label>
                        ) : (
                          <button onClick={handleComposeDelete}
                            className="text-text-muted hover:text-danger text-sm transition-duration-micro">
                            Remove Compose
                          </button>
                        )}
                      </div>

                      {composeStatus === 'building' && (
                        <p className="text-xs text-text-muted mt-2">Building Docker image from Dockerfile...</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hints Tab */}
            {activeTab === 'hints' && (
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Hints</h2>

                {!editId ? (
                  <p className="text-text-muted text-sm">Save the challenge first before managing hints.</p>
                ) : (
                  <>
                    {/* Add hint */}
                    <div className="flex gap-3 mb-6">
                      <textarea value={newHint} onChange={(e) => setNewHint(e.target.value)}
                        placeholder="Add a hint..."
                        className="flex-1 bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" rows={2} />
                      <button onClick={handleAddHint} disabled={!newHint.trim()}
                        className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-button text-sm disabled:opacity-50 shrink-0 self-end">
                        Add Hint
                      </button>
                    </div>

                    {/* Hint list */}
                    {hints.length === 0 ? (
                      <p className="text-text-muted text-sm">No hints yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {hints.sort((a, b) => a.orderIndex - b.orderIndex).map((hint, i) => (
                          <div key={hint.id} className="bg-bg-muted/50 border border-border-subtle rounded-lg px-4 py-3">
                            {editingHintId === hint.id ? (
                              <div className="flex gap-3">
                                <textarea value={editingHintContent}
                                  onChange={(e) => setEditingHintContent(e.target.value)}
                                  className="flex-1 bg-bg-muted border border-border-default rounded-button px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" rows={2} />
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  <button onClick={() => handleEditHint(hint.id)}
                                    className="bg-success/20 text-success px-3 py-1 rounded-button text-xs">Save</button>
                                  <button onClick={() => { setEditingHintId(null); setEditingHintContent(''); }}
                                    className="text-text-muted px-3 py-1 text-xs">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <span className="text-xs font-mono text-text-muted mt-0.5 shrink-0">#{i + 1}</span>
                                  <p className="text-sm text-text-primary whitespace-pre-wrap">{hint.content}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button onClick={() => { setEditingHintId(hint.id); setEditingHintContent(hint.content); }}
                                    className="text-text-muted hover:text-text-primary text-xs transition-duration-micro">Edit</button>
                                  <button onClick={() => handleDeleteHint(hint.id)}
                                    className="text-text-muted hover:text-danger text-xs transition-duration-micro">Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-bg-surface border border-border-default rounded-card p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-text-primary mb-2">Delete Challenge</h3>
            <p className="text-text-secondary text-sm mb-4">Are you sure? This cannot be undone. Challenges with solves cannot be deleted.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="text-text-muted hover:text-text-primary text-sm px-3 py-2">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="bg-danger hover:bg-danger/80 text-white font-medium px-4 py-2 rounded-button text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge table */}
      <div className="bg-bg-surface border border-border-default rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Order</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Title</th>
              <th className="text-left text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Category</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Points</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Solves</th>
              <th className="text-center text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Active</th>
              <th className="text-right text-text-muted text-xs font-medium uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-muted/50">
                <td className="px-4 py-3 text-sm font-mono text-text-muted">{c.orderIndex}</td>
                <td className="px-4 py-3 text-sm text-text-primary">{c.title}</td>
                <td className="px-4 py-3 text-sm text-text-secondary">{c.category}</td>
                <td className="px-4 py-3 text-sm font-mono text-accent text-right">{c.points}</td>
                <td className="px-4 py-3 text-sm font-mono text-text-secondary text-right">{c._count?.solves ?? 0}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive(c.id)}
                    className={`text-xs px-2 py-1 rounded-button transition-duration-micro ${
                      c.isActive ? 'bg-success/20 text-success' : 'bg-text-disabled/20 text-text-disabled'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => { setSearchParams({ action: 'edit', id: c.id }); setActiveTab('details'); }}
                    className="text-text-muted hover:text-text-primary text-sm transition-duration-micro"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id)}
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
