import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, userRoleName } from '@/store/auth.store';

export function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  if (userRoleName(user) !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
