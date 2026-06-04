import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquarePlus, Hash, User, Users, Loader2 } from 'lucide-react';
import { ConversationWithMeta, getConversations, subscribeToConversations } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  activeId: string | null;
  onSelect: (conv: ConversationWithMeta) => void;
  onNewChat: () => void;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getConversationName(conv: ConversationWithMeta, userId: string): string {
  if (conv.name) return conv.name;
  if (conv.type === 'direct') {
    const other = conv.members.find(m => m.user_id !== userId);
    return other?.full_name || 'Unknown';
  }
  return conv.members.map(m => m.full_name || 'Unknown').join(', ');
}

function getConversationAvatar(conv: ConversationWithMeta, userId: string): string {
  if (conv.type === 'direct') {
    const other = conv.members.find(m => m.user_id !== userId);
    return getInitials(other?.full_name || null);
  }
  return conv.name ? getInitials(conv.name) : '#';
}

function getLastMessagePreview(conv: ConversationWithMeta): string {
  if (!conv.lastMessage) return 'No messages yet';
  switch (conv.lastMessage.type) {
    case 'image': return '📷 Photo';
    case 'video': return '🎥 Video';
    case 'voice': return '🎤 Voice message';
    case 'file': return '📎 File';
    default: return conv.lastMessage.content || '';
  }
}

type TabFilter = 'all' | 'direct' | 'group';

export default function ConversationList({ activeId, onSelect, onNewChat }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabFilter>('all');

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (e) {
      console.error('Failed to fetch conversations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Realtime subscription for new messages → re-fetch conversation list
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.id, () => {
      fetchConversations();
    });
    return unsub;
  }, [user]);

  const filtered = conversations.filter(c => {
    if (tab === 'direct' && c.type !== 'direct') return false;
    if (tab === 'group' && c.type !== 'group') return false;
    if (search) {
      const name = getConversationName(c, user?.id || '').toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'direct', label: 'Direct' },
    { key: 'group', label: 'Groups' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <button
            onClick={onNewChat}
            className="gradient-primary p-2 rounded-xl text-primary-foreground hover:opacity-90 transition-opacity"
            title="New conversation"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-2.5 w-40 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquarePlus className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No conversations yet</p>
            <button onClick={onNewChat} className="text-sm text-primary hover:underline mt-2">
              Start a new chat
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {filtered.map(conv => {
              const isActive = conv.id === activeId;
              const name = getConversationName(conv, user?.id || '');
              const avatar = getConversationAvatar(conv, user?.id || '');
              const preview = getLastMessagePreview(conv);
              const time = relativeTime(conv.lastMessage?.created_at || conv.created_at);

              return (
                <motion.button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-primary/10 shadow-sm'
                      : 'hover:bg-muted/60'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold ${
                      conv.type === 'group'
                        ? 'bg-primary/10 text-primary'
                        : 'gradient-primary text-primary-foreground'
                    }`}>
                      {conv.type === 'group' ? <Users className="w-5 h-5" /> : avatar}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        {name}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {preview}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
