import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquarePlus, Users, User, Search, Loader2 } from 'lucide-react';
import Portal from '@/components/ui/portal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createConversation } from '@/services/chatService';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (convId: string) => void;
}

interface UserItem {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function NewConversationModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (!open) return;
    fetchUsers();
    setSelected(new Set());
    setGroupName('');
    setSearch('');
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('id, full_name, email, role');
    setUsers((data || []).filter(u => u.id !== user?.id));
    setLoading(false);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  });

  const toggleUser = (id: string) => {
    if (tab === 'direct') {
      setSelected(new Set([id]));
    } else {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelected(next);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    if (selected.size === 0) { toast.error('Select at least one member'); return; }
    if (tab === 'group' && !groupName.trim()) { toast.error('Enter a group name'); return; }

    setCreating(true);
    try {
      const memberIds = [user.id, ...Array.from(selected)];
      const type = tab === 'direct' ? 'direct' : 'group';
      const name = tab === 'direct' ? null : groupName.trim();
      const convId = await createConversation(null, type, name, memberIds);
      toast.success(tab === 'direct' ? 'Chat created' : 'Group created');
      onCreated(convId);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create conversation');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <Portal>
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
        className="fixed left-1/2 top-1/2 w-full max-w-md bg-card border shadow-2xl rounded-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">New Conversation</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/60">
          <button
            onClick={() => { setTab('direct'); setSelected(new Set()); }}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'direct' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <User className="w-4 h-4" /> Direct Message
          </button>
          <button
            onClick={() => { setTab('group'); setSelected(new Set()); }}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'group' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-4 h-4" /> Group Chat
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-hidden flex flex-col">
          {tab === 'group' && (
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No users found</div>
            ) : (
              filtered.map(u => {
                const isSelected = selected.has(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      isSelected ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {getInitials(u.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{u.full_name || u.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{u.role}</div>
                    </div>
                    {tab === 'group' && (
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                      }`}>
                        {isSelected && <span className="text-xs">✓</span>}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/30 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || selected.size === 0}
              className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
              {tab === 'direct' ? 'Start Chat' : 'Create Group'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
    </Portal>
  );
}
