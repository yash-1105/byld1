import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AvailabilityStatus } from '@/components/team/AvailabilityDot';

export type UserRole = 'architect' | 'contractor' | 'client' | 'consultant';
export type { AvailabilityStatus };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;      // initials, derived from name (fallback when no photo)
  avatarUrl?: string;   // uploaded profile photo URL
  studio_name?: string;
  availabilityStatus: AvailabilityStatus;
}

export interface ProfileUpdate {
  name?: string;
  studio_name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<{ error?: string }>;
  updateAvailability: (status: AvailabilityStatus) => Promise<{ error?: string }>;
  isAuthenticated: boolean;
}

/** Two-letter initials from a name (or email), uppercased. */
const initialsFrom = (value: string) =>
  value.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

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
        const profile: User = {
          id: data.id,
          name: data.full_name,
          email: data.email,
          role: (data.role || 'client').toLowerCase() as UserRole,
          avatar: initialsFrom(data.full_name || data.email || ''),
          avatarUrl: data.avatar_url || undefined,
          studio_name: data.studio_name || undefined,
          availabilityStatus: (data.availability_status || 'available') as AvailabilityStatus,
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

  const updateProfile = async (updates: ProfileUpdate): Promise<{ error?: string }> => {
    const current = userRef.current;
    if (!current) return { error: 'Not signed in' };

    const dbUpdates: Record<string, string | null> = {};
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.studio_name !== undefined) dbUpdates.studio_name = updates.studio_name || null;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl || null;

    const { error } = await supabase.from('users').update(dbUpdates).eq('id', current.id);
    if (error) return { error: error.message };

    const next: User = {
      ...current,
      ...(updates.name !== undefined ? { name: updates.name, avatar: initialsFrom(updates.name) } : {}),
      ...(updates.studio_name !== undefined ? { studio_name: updates.studio_name || undefined } : {}),
      ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl || undefined } : {}),
    };
    setUser(next);
    userRef.current = next;
    return {};
  };

  // Availability status — users only ever set their OWN (mirror updateProfile's shape).
  const updateAvailability = async (status: AvailabilityStatus): Promise<{ error?: string }> => {
    const current = userRef.current;
    if (!current) return { error: 'Not signed in' };

    const { error } = await supabase.from('users').update({ availability_status: status }).eq('id', current.id);
    if (error) return { error: error.message };

    const next: User = { ...current, availabilityStatus: status };
    setUser(next);
    userRef.current = next;
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateProfile, updateAvailability, isAuthenticated: !!user }}>
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
