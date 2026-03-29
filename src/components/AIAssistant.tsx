import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'What is the project status?',
  'How many tasks are pending?',
  'Show budget summary',
  'Any overdue items?',
];

const mockResponses: Record<string, string> = {
  'status': 'Skyline Tower is **65% complete** and on track. Harbor View Residences is in the design phase at 30% progress. Green Valley Mall awaits approval at 15%.',
  'task': 'You have **3 tasks** in progress, **3 tasks** in the to-do queue, and **1 task** under review. 2 tasks are marked as urgent priority.',
  'budget': 'Total portfolio budget: **$42.5M**. Current expenditure: **$13.2M** (31%). Skyline Tower has the highest utilization at 65% of its $12.5M budget.',
  'overdue': 'There is **1 overdue task**: "MEP coordination drawings" was due on April 1st. Additionally, there are 2 pending approvals requiring attention.',
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('status') || lower.includes('progress')) return mockResponses['status'];
  if (lower.includes('task') || lower.includes('pending')) return mockResponses['task'];
  if (lower.includes('budget') || lower.includes('cost') || lower.includes('money')) return mockResponses['budget'];
  if (lower.includes('overdue') || lower.includes('delay') || lower.includes('late')) return mockResponses['overdue'];
  return `Based on your current portfolio, everything looks on track. Skyline Tower is 65% complete with 8 active tasks. Let me know if you need specific details about any project.`;
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m your BYLD AI assistant. Ask me about your projects, tasks, or budget.' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: getResponse(msg) }]);
      setTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] glass-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border gradient-primary">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">BYLD AI</span>
              </div>
              <p className="text-xs text-primary-foreground/70 mt-0.5">Powered by AI</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    m.role === 'user' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex gap-1 px-3.5 py-2.5 bg-muted rounded-2xl w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map(s => (
                  <button key={s} onClick={() => handleSend(s)} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button onClick={() => handleSend()} className="gradient-primary p-2 rounded-xl text-primary-foreground hover:opacity-90">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
