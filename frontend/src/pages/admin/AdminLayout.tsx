import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEventStore } from '../../store/eventStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const eventName = useEventStore((s) => s.eventName);
  const loadEventInfo = useEventStore((s) => s.loadEventInfo);
  const prefersReduced = useReducedMotion();
  loadEventInfo();

  useEffect(() => {
    if (!prefersReduced) return;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, prefersReduced]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border-subtle flex items-center gap-3">
        <div className={`font-mono text-accent font-semibold leading-tight ${collapsed ? 'text-center text-sm flex-1' : 'text-base flex-1'} truncate`}>
          {collapsed ? (eventName || 'E').charAt(0) : eventName || 'Admin'}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-text-primary hover:bg-bg-muted transition-duration-micro flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-button text-sm transition-duration-micro ${
                isActive
                  ? 'bg-accent-subtle text-accent font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-muted'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border-subtle space-y-0.5">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-text-muted truncate flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {user.username}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-button text-sm transition-duration-micro text-text-muted hover:text-danger ${collapsed ? 'justify-center w-full' : 'w-full'}`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
        {!collapsed && (
          <p className="px-3 py-2 text-text-muted text-[10px] border-t border-border-subtle mt-2 pt-2">Powered by CTF FAIR</p>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-bg-surface border-r border-border-subtle transition-all duration-250 overflow-hidden ${
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-sidebar bg-bg-surface border-r border-border-subtle flex flex-col transition-transform duration-250 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded text-text-secondary hover:text-text-primary hover:bg-bg-muted transition-duration-micro"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-mono text-accent font-semibold text-sm truncate max-w-[200px]">{eventName || 'Admin'}</span>
          <div className="w-8" />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
