import { useState, useRef, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Send, Hash } from 'lucide-react';

const channels = [
  { key: 'skyline-tower', label: 'Skyline Tower' },
  { key: 'harbor-view', label: 'Harbor View' },
  { key: 'general', label: 'General' },
];

export default function ChatPage() {
  const { messages, addMessage } = useData();
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState('skyline-tower');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const channelMessages = messages.filter(m => m.channel === activeChannel);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    addMessage({
      channel: activeChannel,
      sender: user.name,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      avatar: user.avatar || 'U',
    });
    setInput('');
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Channels */}
      <div className="w-52 flex-shrink-0 glass-card p-3 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Channels</div>
        {channels.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveChannel(c.key)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeChannel === c.key ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Hash className="w-3.5 h-3.5" /> {c.label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <div className="font-semibold text-foreground flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            {channels.find(c => c.key === activeChannel)?.label}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {channelMessages.map(m => {
            const isMe = m.sender === user?.name;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${isMe ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {m.avatar}
                </div>
                <div className={`max-w-md ${isMe ? 'text-right' : ''}`}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {m.sender} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'gradient-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    {m.content}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={handleSend} className="gradient-primary p-2.5 rounded-xl text-primary-foreground hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
