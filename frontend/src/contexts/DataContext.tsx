import React, { createContext, useContext, useState, useCallback } from 'react';
import { Project, Task, SiteUpdate, BudgetItem, Message, Notification, initialProjects, initialTasks, initialSiteUpdates, initialBudgetItems, initialMessages, initialNotifications } from '@/data/mockData';

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  siteUpdates: SiteUpdate[];
  budgetItems: BudgetItem[];
  messages: Message[];
  notifications: Notification[];
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addSiteUpdate: (u: Omit<SiteUpdate, 'id'>) => void;
  addBudgetItem: (b: Omit<BudgetItem, 'id'>) => void;
  addMessage: (m: Omit<Message, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [siteUpdates, setSiteUpdates] = useState<SiteUpdate[]>(initialSiteUpdates);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initialBudgetItems);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const addProject = useCallback((p: Omit<Project, 'id' | 'createdAt'>) => {
    setProjects(prev => [...prev, { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addTask = useCallback((t: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [...prev, { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const addSiteUpdate = useCallback((u: Omit<SiteUpdate, 'id'>) => {
    setSiteUpdates(prev => [{ ...u, id: crypto.randomUUID() }, ...prev]);
  }, []);

  const addBudgetItem = useCallback((b: Omit<BudgetItem, 'id'>) => {
    setBudgetItems(prev => [...prev, { ...b, id: crypto.randomUUID() }]);
  }, []);

  const addMessage = useCallback((m: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...m, id: crypto.randomUUID() }]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <DataContext.Provider value={{
      projects, tasks, siteUpdates, budgetItems, messages, notifications,
      addProject, updateProject, addTask, updateTask, deleteTask,
      addSiteUpdate, addBudgetItem, addMessage, markNotificationRead, markAllNotificationsRead,
    }}>
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
