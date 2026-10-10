import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Location } from '../types';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  locations: Location[];
  currentLocationId: number | 'ALL';
  setCurrentLocationId: (id: number | 'ALL') => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLoginAs: (role: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState<number | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfileAndLocations = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      if (me.location_id) {
        setCurrentLocationId(me.location_id);
      }
      const locs = await api.getLocations();
      setLocations(locs);
    } catch (err) {
      console.error('Failed to load profile/locations:', err);
      clearAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfileAndLocations();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      if (res.user.location_id) {
        setCurrentLocationId(res.user.location_id);
      }
      const locs = await api.getLocations();
      setLocations(locs);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (role: string) => {
    const creds: Record<string, { email: string; pass: string }> = {
      owner: { email: 'admin@sesame-erp.com', pass: 'admin123' },
      factory_mgr: { email: 'factory.mgr@sesame-erp.com', pass: 'sesame123' },
      prod_mgr: { email: 'production.mgr@sesame-erp.com', pass: 'sesame123' },
      store_mgr: { email: 'store.mgr@sesame-erp.com', pass: 'sesame123' },
      sufala_blr: { email: 'sufala.blr@sesame-erp.com', pass: 'sesame123' },
      sufala_mys: { email: 'sufala.mys@sesame-erp.com', pass: 'sesame123' },
      b2b_mgr: { email: 'b2b.mgr@sesame-erp.com', pass: 'sesame123' },
      quality_mgr: { email: 'quality.mgr@sesame-erp.com', pass: 'sesame123' },
      hr_mgr: { email: 'hr.mgr@sesame-erp.com', pass: 'sesame123' },
      auditor: { email: 'auditor@sesame-erp.com', pass: 'sesame123' },
    };
    const cred = creds[role] || creds.owner;
    await login(cred.email, cred.pass);
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
    setCurrentLocationId('ALL');
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        locations,
        currentLocationId,
        setCurrentLocationId,
        isLoading,
        login,
        quickLoginAs,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
