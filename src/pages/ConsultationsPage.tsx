import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Plus, X, Search, Star } from 'lucide-react';
import { toast } from 'sonner';

const initialConsultations = [
  { id: '1', project: 'Harbor View Residences', topic: 'Structural Assessment', from: 'Sarah Chen', status: 'pending' as const, date: '2025-03-28', messages: [{ sender: 'Sarah Chen', text: 'Could you review the structural calculations for the foundation?', time: '10:30 AM' }] },
  { id: '2', project: 'Green Valley Mall', topic: 'Environmental Compliance', from: 'Sarah Chen', status: 'in_progress' as const, date: '2025-03-25', messages: [{ sender: 'Sarah Chen', text: 'Need your input on the environmental impact assessment.', time: '2:15 PM' }] },
];

const consultantMarketplace = [
  { id: 'c1', name: 'Dr. James Rivera', specialty: 'Structural Engineering', rating: 4.9, projects: 34, available: true },
  { id: 'c2', name: 'Emily Foster', specialty: 'Environmental Compliance', rating: 4.8, projects: 28, available: true },
  { id: 'c3', name: 'Ahmad Patel', specialty: 'MEP Systems', rating: 4.7, projects: 42, available: false },
  { id: 'c4', name: 'Maria Santos', specialty: 'Fire Safety', rating: 4.9, projects: 19, available: true },
  { id: 'c5', name: 'Robert Kim', specialty: 'Geotechnical Analysis', rating: 4.6, projects: 25, available: true },
];

export default function ConsultationsPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState(initialConsultations);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'marketplace'>('requests');
  const [searchMarket, setSearchMarket] = useState('');

  const handleReply = () => {
    if (!reply.trim() || !selected) return;
    setConsultations(prev => prev.map(c => c.id === selected ? {
      ...c, status: 'in_progress' as const,
      messages: [...c.messages, { sender: user?.name || 'You', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
    } : c));
    setReply('');
    toast.success('Reply sent');
  };

  const current = consultations.find(c => c.id === selected);
  const filteredMarket = consultantMarketplace.filter(c => c.name.toLowerCase().includes(searchMarket.toLowerCase()) || c.specialty.toLowerCase().includes(searchMarket.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consultations</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage requests and find expert consultants</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'requests' ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
          Consultation Requests
        </button>
        <button onClick={() => setActiveTab('marketplace')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'marketplace' ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
          Consultant Marketplace
        </button>
      </div>

      {activeTab === 'requests' && (
        <div className="flex gap-4 h-[calc(100vh-14rem)]">
          <div className="w-80 glass-card p-3 space-y-2 overflow-y-auto flex-shrink-0">
            {consultations.map(c => (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left p-4 rounded-lg transition-colors ${selected === c.id ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                <div className="text-sm font-medium text-foreground">{c.topic}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.project}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{c.from}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>{c.status}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex-1 glass-card flex flex-col overflow-hidden">
            {current ? (
              <>
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">{current.topic}</h3>
                  <div className="text-xs text-muted-foreground">{current.project} · {current.from}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {current.messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.sender === (user?.name || 'You') ? 'justify-end' : ''}`}>
                      <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${m.sender === (user?.name || 'You') ? 'gradient-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                        <div className="text-xs opacity-70 mb-1">{m.sender} · {m.time}</div>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="p-4 border-t border-border flex gap-2">
                  <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} placeholder="Type a reply..." className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  <button onClick={handleReply} className="gradient-primary p-2.5 rounded-xl text-primary-foreground hover:opacity-90"><Send className="w-4 h-4" /></button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Select a consultation to view
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={searchMarket} onChange={e => setSearchMarket(e.target.value)} placeholder="Search consultants by name or specialty..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarket.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {c.available ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">Available</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Busy</span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{c.specialty}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning fill-warning" /> {c.rating}</span>
                  <span>{c.projects} projects</span>
                </div>
                <button onClick={() => toast.success(`Consultation request sent to ${c.name}`)} className="w-full mt-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors" disabled={!c.available}>
                  {c.available ? 'Request Consultation' : 'Not Available'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
