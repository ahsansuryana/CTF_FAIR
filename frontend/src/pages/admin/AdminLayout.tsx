import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', end: true },
  { to: '/admin/challenges', label: 'Challenges', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/admin/participants', label: 'Participants', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/admin/submissions', label: 'Submissions', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { to: '/admin/logs', label: 'Audit Log', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [eventName, setEventName] = useState('');
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/event/info').then(({ data }) => {
      if (data.success && data.data?.name) {
        setEventName(data.data.name);
        document.title = `${data.data.name} | Admin`;
      }
    }).catch(() => {});
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside
        className={`bg-bg-surface border-r border-border-subtle flex flex-col transition-all duration-250 ${
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
        }`}
      >
        <div className="p-4 border-b border-border-subtle">
          <h2 className={`font-mono text-accent font-semibold ${collapsed ? 'text-center text-sm' : 'text-base'} truncate`}>
            {collapsed ? eventName.charAt(0) || 'E' : eventName || 'Event'}
          </h2>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-button text-sm transition-duration-micro ${
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-muted'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-border-subtle">
          {!collapsed && (
            <div className="px-3 py-2 text-xs text-text-muted truncate">{user?.username}</div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full px-3 py-2 text-text-muted hover:text-text-primary text-sm transition-duration-micro text-left"
          >
            {collapsed ? '→' : 'Collapse'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-text-muted hover:text-danger text-sm transition-duration-micro text-left"
          >
            {collapsed
              ? <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              : 'Logout'}
          </button>
          {!collapsed && (
            <p className="px-3 py-2 text-text-muted text-xs border-t border-border-subtle mt-2 pt-2">Powered by CTF FAIR</p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
