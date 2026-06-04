import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'assistant', content: "Hi! I'm your BYLD AI assistant. Ask me about your projects, tasks, or budget." }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { user } = useAuth();
  const { projects, tasks, budgetItems, siteUpdates, notifications } = useData();

  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setStreaming(false);
    }
  }, [open]);

  const streamChat = async (history: AIMessage[]) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const context = {
      user: user ? { name: user.name, role: user.role } : undefined,
      projects,
      tasks,
      budgetItems,
      siteUpdates,
      notifications,
    };

    // Cap history at last 20 messages
    const trimmed = history.slice(-20);

    try {
      if (!API_KEY) {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
      }
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Add empty assistant message to be filled
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const systemPrompt = `You are the BYLD AI assistant, an expert construction management AI. 
      You are talking to: ${JSON.stringify(context.user)}. 
      Here is the current dashboard data:
      Projects: ${JSON.stringify(context.projects)}
      Tasks: ${JSON.stringify(context.tasks)}
      Budget: ${JSON.stringify(context.budgetItems)}
      Updates: ${JSON.stringify(context.siteUpdates)}
      
      Please assist the user concisely and accurately based ONLY on this provided data. Keep responses relatively short.`;

      const geminiHistory = trimmed.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      
      const lastMessage = geminiHistory.pop()?.parts[0].text || '';

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I will act as the BYLD AI assistant and answer questions based on the provided dashboard data.' }] },
          ...geminiHistory
        ]
      });

      const result = await chat.sendMessageStream(lastMessage);
      
      let assistantSoFar = '';
      for await (const chunk of result.stream) {
        if (abortRef.current?.signal.aborted) break;
        assistantSoFar += chunk.text();
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { ...last, content: assistantSoFar };
          }
          return next;
        });
      }
    } catch (err: any) {
      toast({ title: 'AI error', description: err.message || 'Something went wrong. Try again.', variant: 'destructive' });
      throw err;
    }
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    const next: AIMessage[] = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setInput('');
    setStreaming(true);
    try {
      await streamChat(next);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error(e);
        // Remove the empty assistant placeholder if present
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.content === '') return prev.slice(0, -1);
          return prev;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
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
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-1">
                        <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </motion.div>
              ))}
              {streaming && messages[messages.length - 1]?.role === 'user' && (
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
