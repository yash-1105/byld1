import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserRole = 'architect' | 'contractor' | 'client' | 'consultant';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const demoUsers: Record<UserRole, User> = {
  architect: { id: '1', name: 'Sarah Chen', email: 'sarah@byld.io', role: 'architect', avatar: 'SC' },
  contractor: { id: '2', name: 'Mike Johnson', email: 'mike@byld.io', role: 'contractor', avatar: 'MJ' },
  client: { id: '3', name: 'David Park', email: 'david@byld.io', role: 'client', avatar: 'DP' },
  consultant: { id: '4', name: 'Lisa Wang', email: 'lisa@byld.io', role: 'consultant', avatar: 'LW' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('byld_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((role: UserRole) => {
    const u = demoUsers[role];
    setUser(u);
    localStorage.setItem('byld_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('byld_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
