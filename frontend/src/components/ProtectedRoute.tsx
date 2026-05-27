import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  requiredRole?: 'ADMIN' | 'PARTICIPANT';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    const redirect = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
