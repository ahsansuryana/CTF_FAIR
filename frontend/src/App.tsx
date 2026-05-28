import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { useReducedMotion } from './hooks/useReducedMotion';
import { ProtectedRoute } from './components/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const SetupWizardPage = lazy(() => import('./pages/SetupWizardPage').then(m => ({ default: m.SetupWizardPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ChallengeDetailPage = lazy(() => import('./pages/ChallengeDetailPage').then(m => ({ default: m.ChallengeDetailPage })));
const ScoreboardPage = lazy(() => import('./pages/ScoreboardPage').then(m => ({ default: m.ScoreboardPage })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminChallenges = lazy(() => import('./pages/admin/AdminChallenges').then(m => ({ default: m.AdminChallenges })));
const AdminParticipants = lazy(() => import('./pages/admin/AdminParticipants').then(m => ({ default: m.AdminParticipants })));
const AdminSubmissions = lazy(() => import('./pages/admin/AdminSubmissions').then(m => ({ default: m.AdminSubmissions })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-base">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spinner" />
    </div>
  );
}

function HomeRedirect() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

function LoginRedirect() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <AnimatedPage><LoginPage /></AnimatedPage>;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const pageTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] };

function AnimatedPage({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <>{children}</>;
  }
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={pageTransition}>
      {children}
    </motion.div>
  );
}

function App() {
  useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingSpinner />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/setup" element={<AnimatedPage><SetupWizardPage /></AnimatedPage>} />
        <Route path="/scoreboard" element={<AnimatedPage><ScoreboardPage /></AnimatedPage>} />

        <Route element={<ProtectedRoute requiredRole="PARTICIPANT" />}>
          <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
          <Route path="/challenge/:id" element={<AnimatedPage><ChallengeDetailPage /></AnimatedPage>} />
        </Route>

        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AnimatedPage><AdminDashboard /></AnimatedPage>} />
            <Route path="challenges" element={<AnimatedPage><AdminChallenges /></AnimatedPage>} />
            <Route path="participants" element={<AnimatedPage><AdminParticipants /></AnimatedPage>} />
            <Route path="submissions" element={<AnimatedPage><AdminSubmissions /></AnimatedPage>} />
            <Route path="logs" element={<AnimatedPage><AdminAuditLogs /></AnimatedPage>} />
            <Route path="settings" element={<AnimatedPage><AdminSettings /></AnimatedPage>} />
          </Route>
        </Route>

        <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
      </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default App;
