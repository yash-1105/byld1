import { useState, useCallback } from 'react';

export const NOTIF_STORAGE_KEY = 'byld.notifications.v1';

export interface NotificationPrefs {
  // channels
  email: boolean;
  push: boolean;
  // construction events
  approvals: boolean;
  budgetAlerts: boolean;
  taskAssignments: boolean;
  siteUpdates: boolean;
}

export const DEFAULT_NOTIFS: NotificationPrefs = {
  email: true,
  push: true,
  approvals: true,
  budgetAlerts: true,
  taskAssignments: true,
  siteUpdates: false,
};

/**
 * Local, per-device notification preferences. These are stored preferences
 * only — the demo does not actually send emails or push notifications.
 */
export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => {
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
      return raw ? { ...DEFAULT_NOTIFS, ...JSON.parse(raw) } : DEFAULT_NOTIFS;
    } catch {
      return DEFAULT_NOTIFS;
    }
  });

  const toggle = useCallback((key: keyof NotificationPrefs) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { prefs, toggle };
}
