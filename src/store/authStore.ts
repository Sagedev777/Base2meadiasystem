import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { useDataStore } from './dataStore';

interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  error:           string | null;
  login:      (email: string, password: string) => Promise<void>;
  logout:     () => void;
  clearError: () => void;
}

/**
 * Try the real backend API (port 4000).
 * Falls back gracefully to admin-only mock when backend is offline.
 */
async function attemptApiLogin(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
      signal:  AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken && data.user) {
      return { user: data.user as User, token: data.accessToken };
    }
    return null;
  } catch {
    // Backend offline — fall through to admin-only mock
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      error:           null,

      login: async (email, password) => {
        const apiResult = await attemptApiLogin(email, password);
        if (apiResult) {
          set({ user: apiResult.user, token: apiResult.token, isAuthenticated: true, error: null });
          useDataStore.getState().fetchFromBackend();
          return;
        }

        set({ error: 'Invalid email or password. Please verify your credentials or ensure the server is running.' });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'b2ma-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export function getRoleColor(role: Role): string {
  switch (role) {
    case 'admin':   return '#a855f7';
    case 'staff':   return '#3b82f6';
    case 'student': return '#22c55e';
    case 'parent':  return '#f97316';
    default:        return '#64748b';
  }
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'admin':   return 'Administrator';
    case 'staff':   return 'Staff / Teacher';
    case 'student': return 'Student';
    case 'parent':  return 'Parent';
    default:        return 'User';
  }
}
