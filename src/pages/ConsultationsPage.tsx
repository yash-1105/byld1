import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Star, MessageCircle, Loader2, Users, Briefcase, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { createConversation, getConversations } from '@/services/chatService';

// ─── Types ────────────────────────────────────────────────
interface ConsultantUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
  bio?: string | null;
  specialty?: string | null;
}

interface RequestConvo {
  id: string;
  name: string | null;
  otherUser: { full_name: string | null; avatar_url: string | null; id: string };
  lastMessage: string;
  lastTime: string;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getRandomSpecialty(seed: string): string {
  const specialties = [
    'Structural Engineering', 'Environmental Compliance', 'MEP Systems',
    'Fire Safety', 'Geotechnical Analysis', 'Facade Consulting',
    'Acoustics & Vibration', 'Interior Design', 'Landscape Architecture',
    'Civil & Infrastructure', 'Quantity Surveying', 'Project Management'
  ];
  const idx = seed.charCodeAt(0) % specialties.length;
  return specialties[idx];
}

// ─── Main Page ────────────────────────────────────────────
export default function ConsultationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'marketplace'>('requests');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consultations</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage requests and find expert consultants</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'requests'
              ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Consultation Requests
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'marketplace'
              ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Consultant Marketplace
        </button>
      </div>

      {activeTab === 'requests' && <RequestsTab user={user} navigate={navigate} setActiveTab={setActiveTab} />}
      {activeTab === 'marketplace' && <MarketplaceTab user={user} navigate={navigate} />}
    </div>
  );
}

// ─── Requests Tab ─────────────────────────────────────────
function RequestsTab({ user, navigate, setActiveTab }: {
  user: any;
  navigate: (to: string) => void;
  setActiveTab: (tab: 'requests' | 'marketplace') => void;
}) {
  const [convos, setConvos] = useState<RequestConvo[]>([]);
  const [loading, setLoading] = useState(true);
  const isConsultant = user?.role === 'consultant';

  useEffect(() => {
    if (!user?.id) return;
    const fetchConvos = async () => {
      setLoading(true);
      try {
        const all = await getConversations(user.id);
        const relevantConvos: RequestConvo[] = [];
        for (const conv of all) {
          if (conv.type !== 'dm') continue;
          const other = conv.members.find(m => m.user_id !== user.id);
          if (!other) continue;
          const { data: otherUser } = await supabase
            .from('users')
            .select('role, full_name, avatar_url')
            .eq('id', other.user_id)
            .single();
          if (!otherUser) continue;
          // Consultants see people reaching out TO them (other is NOT consultant)
          // Non-consultants see their chats WITH consultants (other IS consultant)
          const shouldInclude = isConsultant
            ? otherUser.role !== 'consultant'
            : otherUser.role === 'consultant';
          if (!shouldInclude) continue;
          relevantConvos.push({
            id: conv.id,
            name: conv.name,
            otherUser: { full_name: otherUser.full_name, avatar_url: otherUser.avatar_url, id: other.user_id },
            lastMessage: conv.lastMessage?.content || 'No messages yet',
            lastTime: conv.lastMessage?.created_at ? new Date(conv.lastMessage.created_at).toLocaleDateString() : ''
          });
        }
        setConvos(relevantConvos);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConvos();
  }, [user?.id, isConsultant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (convos.length === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-2xl p-12 text-center space-y-4">
        <MessageSquare className="w-12 h-12 mx-auto opacity-20" />
        {isConsultant ? (
          <div>
            <p className="font-semibold text-foreground">No incoming requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">When clients or architects reach out to you, their messages will appear here.</p>
          </div>
        ) : (
          <>
            <div>
              <p className="font-semibold text-foreground">No consultation requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">Browse the Consultant Marketplace to start a conversation with an expert.</p>
            </div>
            <button
              onClick={() => setActiveTab('marketplace')}
              className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Find a Consultant
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      {isConsultant ? (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            {convos.length}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              {convos.length === 1 ? '1 person is reaching out to you' : `${convos.length} people are reaching out to you`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Click any conversation below to reply via Chat</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="w-4 h-4" />
          <span>{convos.length} active consultation{convos.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="space-y-3">
        {convos.map((conv, i) => (
          <motion.button
            key={conv.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate('/chat')}
            className="w-full text-left bg-card border border-border/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/20 group"
          >
            <div className="flex items-center gap-4">
              {conv.otherUser.avatar_url ? (
                <img src={conv.otherUser.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                  {getInitials(conv.otherUser.full_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {conv.otherUser.full_name || (isConsultant ? 'Client' : 'Consultant')}
                  </span>
                  <span className="text-xs text-muted-foreground">{conv.lastTime}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{conv.lastMessage}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Marketplace Tab ──────────────────────────────────────
function MarketplaceTab({ user, navigate }: { user: any; navigate: (to: string) => void }) {
  const [consultants, setConsultants] = useState<ConsultantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantUser | null>(null);

  useEffect(() => {
    const fetchConsultants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'consultant');
      if (!error && data) setConsultants(data);
      setLoading(false);
    };
    fetchConsultants();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return consultants;
    const q = search.toLowerCase();
    return consultants.filter(c =>
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.specialty?.toLowerCase().includes(q)
    );
  }, [consultants, search]);

  const handleStartChat = async (consultant: ConsultantUser) => {
    if (!user?.id) return;
    setStarting(consultant.id);
    try {
      // Check if a DM conversation already exists between these two users
      const existingConvos = await getConversations(user.id);
      const existing = existingConvos.find(conv =>
        conv.type === 'dm' &&
        conv.members.some(m => m.user_id === consultant.id) &&
        conv.members.some(m => m.user_id === user.id)
      );

      if (existing) {
        toast.success(`Opening existing chat with ${consultant.full_name}`);
      } else {
        await createConversation(null, 'dm', null, [user.id, consultant.id]);
        toast.success(`Chat started with ${consultant.full_name}!`);
      }
      navigate('/chat');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start chat');
    } finally {
      setStarting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search consultants by name or specialty..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          {consultants.length === 0 ? (
            <div>
              <p className="font-semibold text-foreground">No consultants registered yet</p>
              <p className="text-sm text-muted-foreground mt-1">Users with the "consultant" role will appear here automatically.</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No consultants match your search.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => {
            const specialty = c.specialty || getRandomSpecialty(c.id || c.email || '');
            const initials = getInitials(c.full_name);
            const isStarting = starting === c.id;
            const isSelf = c.id === user?.id;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-base font-bold text-primary-foreground">
                      {initials}
                    </div>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-success/10 text-success font-semibold border border-success/20">
                    Available
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{c.full_name || 'Consultant'}</h3>
                  <p className="text-xs text-primary font-medium mt-0.5 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {specialty}
                  </p>
                  {c.email && (
                    <p className="text-xs text-muted-foreground mt-1">{c.email}</p>
                  )}
                  {c.bio && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.bio}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                  <button
                    onClick={() => setSelectedConsultant(c)}
                    className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                  >
                    View Profile
                  </button>
                  <button
                    disabled={isStarting || isSelf}
                    onClick={() => handleStartChat(c)}
                    className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    {isSelf ? 'You' : isStarting ? 'Starting...' : 'Start Chat'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedConsultant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedConsultant(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {selectedConsultant.avatar_url ? (
                    <img src={selectedConsultant.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                      {getInitials(selectedConsultant.full_name)}
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-foreground text-lg">{selectedConsultant.full_name || 'Consultant'}</h2>
                    <p className="text-sm text-primary font-medium">{selectedConsultant.specialty || getRandomSpecialty(selectedConsultant.id)}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold mt-1 inline-block">Available</span>
                  </div>
                </div>
                <button onClick={() => setSelectedConsultant(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span>Role: <span className="text-foreground font-medium capitalize">{selectedConsultant.role}</span></span>
                </div>
                {selectedConsultant.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span>{selectedConsultant.email}</span>
                  </div>
                )}
                {selectedConsultant.bio && (
                  <p className="text-muted-foreground bg-muted/30 rounded-xl p-4 text-xs leading-relaxed">{selectedConsultant.bio}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-border/40">
                <button onClick={() => setSelectedConsultant(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Close
                </button>
                <button
                  disabled={starting === selectedConsultant.id || selectedConsultant.id === user?.id}
                  onClick={() => { handleStartChat(selectedConsultant); setSelectedConsultant(null); }}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" /> Chat Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
