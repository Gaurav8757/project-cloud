import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { disconnectSocket } from '@/lib/socket';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore();

  const login = async (email: string, password: string): Promise<void> => {
    const res = await authService.login({ email, password });
    setAuth(res.user, res.accessToken, res.refreshToken);
    toast.success(`Welcome back, ${res.user.name.split(' ')[0]} 👋`);
    navigate('/dashboard');
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    await authService.register({ name, email, password });
    toast.success('Account created. Please log in.');
    navigate('/login');
  };

  const logout = async (): Promise<void> => {
    const rt = useAuthStore.getState().refreshToken;
    try {
      if (rt) await authService.logout(rt);
    } catch {
      /* ignore */
    }
    disconnectSocket();
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  return { user, isAuthenticated, login, register, logout };
};
