import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { useReducedMotion } from './hooks/useReducedMotion';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SetupWizardPage } from './pages/SetupWizardPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChallengeDetailPage } from './pages/ChallengeDetailPage';
import { ScoreboardPage } from './pages/ScoreboardPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminChallenges } from './pages/admin/AdminChallenges';
import { AdminParticipants } from './pages/admin/AdminParticipants';
import { AdminSubmissions } from './pages/admin/AdminSubmissions';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

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
    </AnimatePresence>
  );
}

export default App;
