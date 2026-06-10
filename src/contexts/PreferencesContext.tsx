import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Preferences,
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  formatCurrency as fmtCurrency,
  formatCurrencyCompact as fmtCurrencyCompact,
  formatDate as fmtDate,
} from '@/lib/preferences';

interface PreferencesContextType {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  formatCurrency: (amount: number) => string;
  formatCurrencyCompact: (amount: number) => string;
  formatDate: (date: Date | string | null | undefined) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function load(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(load);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences(prev => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota/availability errors */
        }
        return next;
      });
    },
    [],
  );

  const formatCurrency = useCallback(
    (amount: number) => fmtCurrency(amount, preferences.currency),
    [preferences.currency],
  );
  const formatCurrencyCompact = useCallback(
    (amount: number) => fmtCurrencyCompact(amount, preferences.currency),
    [preferences.currency],
  );
  const formatDate = useCallback(
    (date: Date | string | null | undefined) => fmtDate(date, preferences.dateFormat),
    [preferences.dateFormat],
  );

  return (
    <PreferencesContext.Provider value={{ preferences, setPreference, formatCurrency, formatCurrencyCompact, formatDate }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
