import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { useData } from '@/contexts/DataContext';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { getModel } from '@/lib/ai';
import { compactContext, computePortfolioMetrics, type WorkspaceSlices } from '@/lib/aiContext';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: AIMessage = {
  role: 'assistant',
  content: "Hi! I'm your BYLD AI assistant. Ask me about your projects, tasks, budget, approvals, or orders.",
};

const STORAGE_PREFIX = 'byld.ai.assistant.v1:';
const MAX_STORED = 50;
const MAX_SENT = 20;

const roleGuidance: Record<UserRole, string> = {
  architect: 'They run the studio. Emphasize portfolio health, approvals awaiting decisions, budget risk, and team workload.',
  contractor: 'They execute on site. Emphasize their assigned tasks, deadlines, procurement and deliveries, and site activity. Avoid studio-level financial commentary.',
  client: "They are the paying client. Be reassuring and non-technical. Emphasize progress, milestones, and items awaiting their approval. Never speculate about internal margins or other clients' data.",
  consultant: 'They advise on specific projects. Emphasize consultations, open questions, and relevant project status.',
};

const roleSuggestions: Record<UserRole, string[]> = {
  architect: ['What needs my attention today?', 'Any budget risks across projects?', 'Which approvals are waiting the longest?', 'Who is overloaded with tasks?'],
  contractor: ['What are my overdue tasks?', 'Any deliveries expected this week?', "What's happening on site?", 'What should I work on next?'],
  client: ['What progress happened this week?', "What's awaiting my approval?", 'How is the budget tracking?', 'When is the next milestone?'],
  consultant: ['What is the project status?', 'Any open items that need my input?', 'Summarize recent site activity', 'Any overdue items?'],
};

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const {
    projects, tasks, budgetItems, siteUpdates, notifications,
    approvals, purchaseOrders, reimbursements, users, projectMembers,
  } = useData();

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null;

  // Restore per-user conversation history once the user is known.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
    setMessages([GREETING]);
  }, [storageKey]);

  // Persist history (debounced; skipped while streaming so we don't write every chunk).
  useEffect(() => {
    if (!storageKey || streaming) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_STORED)));
      } catch {
        // quota exceeded — drop persistence silently
      }
    }, 500);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [messages, streaming, storageKey]);

  useEffect(() => {
    if (!open && abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setStreaming(false);
    }
  }, [open]);

  const clearConversation = () => {
    setMessages([GREETING]);
    if (storageKey) localStorage.removeItem(storageKey);
  };

  const streamChat = async (history: AIMessage[]) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const slices: WorkspaceSlices = {
      projects, tasks, siteUpdates, budgetItems,
      approvals, purchaseOrders, reimbursements, users, projectMembers,
    };
    const metrics = computePortfolioMetrics(slices);
    const compact = compactContext(slices);
    const recentNotifications = notifications.slice(0, 15).map(n => ({
      title: n.title, message: n.message, type: n.type, date: n.createdAt?.slice(0, 10),
    }));

    const systemInstruction = `You are BYLD AI, the assistant inside BYLD, a construction project-management app.
You are speaking with ${user?.name ?? 'a user'}, whose role is "${user?.role ?? 'unknown'}".
${user ? roleGuidance[user.role] : ''}

Ground every answer ONLY in the WORKSPACE DATA below. If the data doesn't contain the answer, say so plainly — never invent projects, people, or numbers.
Monetary amounts are in USD base units; repeat them as given and label them USD.
Be concise. Use short markdown lists where they help. Today's date: ${format(new Date(), 'yyyy-MM-dd')}.

PRE-COMPUTED METRICS (trust these numbers; do not recompute):
${JSON.stringify(metrics)}

WORKSPACE DATA:
${JSON.stringify({ ...compact, recentNotifications })}`;

    const trimmed = history.slice(-MAX_SENT);

    try {
      const model = getModel({ systemInstruction });

      // Add empty assistant message to be filled
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const geminiHistory = trimmed.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // Gemini requires chat history to start with a 'user' turn — drop the
      // leading assistant greeting (and any other leading model turns).
      while (geminiHistory.length && geminiHistory[0].role === 'model') {
        geminiHistory.shift();
      }

      const lastMessage = geminiHistory.pop()?.parts[0].text || '';

      const chat = model.startChat({ history: geminiHistory });

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      toast({ title: 'AI error', description: message, variant: 'destructive' });
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

  const suggestions = user ? roleSuggestions[user.role] : roleSuggestions.consultant;

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
            className={
              isMobile
                ? 'fixed inset-0 z-50 glass-card shadow-2xl flex flex-col overflow-hidden rounded-none'
                : 'fixed bottom-24 right-6 z-50 w-96 h-[min(600px,calc(100vh-8rem))] glass-card shadow-2xl flex flex-col overflow-hidden'
            }
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border gradient-primary flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary-foreground">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">BYLD AI</span>
                </div>
                <p className="text-xs text-primary-foreground/70 mt-0.5">Grounded in your project data</p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={clearConversation}
                    title="Clear conversation"
                    className="p-2 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isMobile && (
                  <button
                    onClick={() => setOpen(false)}
                    title="Close"
                    className="p-2 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
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
            <div className="p-3 border-t border-border flex gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
