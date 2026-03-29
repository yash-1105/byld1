import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const initialConsultations = [
  { id: '1', project: 'Harbor View Residences', topic: 'Structural Assessment', from: 'Sarah Chen', status: 'pending' as const, date: '2025-03-28', messages: [{ sender: 'Sarah Chen', text: 'Could you review the structural calculations for the foundation?', time: '10:30 AM' }] },
  { id: '2', project: 'Green Valley Mall', topic: 'Environmental Compliance', from: 'Sarah Chen', status: 'in_progress' as const, date: '2025-03-25', messages: [{ sender: 'Sarah Chen', text: 'Need your input on the environmental impact assessment.', time: '2:15 PM' }] },
];

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState(initialConsultations);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const handleReply = () => {
    if (!reply.trim() || !selected) return;
    setConsultations(prev => prev.map(c => c.id === selected ? {
      ...c,
      status: 'in_progress' as const,
      messages: [...c.messages, { sender: 'You', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
    } : c));
    setReply('');
    toast.success('Reply sent');
  };

  const current = consultations.find(c => c.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consultations</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and respond to consultation requests</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        <div className="w-80 glass-card p-3 space-y-2 overflow-y-auto flex-shrink-0">
          {consultations.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${selected === c.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
            >
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
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.sender === 'You' ? 'justify-end' : ''}`}>
                    <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${m.sender === 'You' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
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
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Select a consultation to view
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
