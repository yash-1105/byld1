import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'architect' | 'contractor' | 'client' | 'consultant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  studio_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = React.useRef<User | null>(null);

  useEffect(() => {
    // Function to fetch the public user profile from the database
    const fetchProfile = async (userId: string, email: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error || !data) {
        console.error('Error fetching user profile:', error);
        setUser(null);
        userRef.current = null;
      } else {
        const profile = {
          id: data.id,
          name: data.full_name,
          email: data.email,
          role: (data.role || 'client').toLowerCase() as UserRole,
          avatar: data.avatar_url || undefined,
          studio_name: data.studio_name || undefined,
        };
        setUser(profile);
        userRef.current = profile;
      }
      setLoading(false);
    };

    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        userRef.current = null;
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // If we get SIGNED_IN but we already have a user in memory, it's just a tab focus event
        // so we shouldn't show the full page loader.
        if (event === 'SIGNED_IN' && !userRef.current) {
          setLoading(true);
        } else if (event === 'SIGNED_OUT') {
          setLoading(true);
        }
        
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          userRef.current = null;
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
