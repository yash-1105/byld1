import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Sparkles, RefreshCw, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, subDays, isAfter, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Range = 'today' | '7d' | 'custom';

interface Props {
  compact?: boolean;
}

export default function AISummaryPanel({ compact = false }: Props) {
  const { siteUpdates } = useData();
  const [range, setRange] = useState<Range>('7d');
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [count, setCount] = useState<number | null>(null);

  const generate = async () => {
    if (range === 'custom' && (!from || !to)) {
      toast.error('Pick both a start and end date');
      return;
    }
    setLoading(true);
    try {
      let filteredUpdates = siteUpdates;
      const now = new Date();
      if (range === 'today') {
        filteredUpdates = siteUpdates.filter(u => isSameDay(new Date(u.createdAt), now));
      } else if (range === '7d') {
        const sevenDaysAgo = subDays(now, 7);
        filteredUpdates = siteUpdates.filter(u => isAfter(new Date(u.createdAt), sevenDaysAgo));
      } else if (range === 'custom' && from && to) {
        filteredUpdates = siteUpdates.filter(u => {
          const d = new Date(u.createdAt);
          return d >= from && d <= to;
        });
      }

      if (filteredUpdates.length === 0) {
        setSummary('No site updates found in this date range.');
        setCount(0);
        return;
      }

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `You are an expert construction project manager AI.
Create an executive communication summary for the following site updates.
Format it in Markdown using bullet points, bold text for emphasis, and clear headings if necessary.
Keep it concise, professional, and easy to read. Do not include a greeting or sign-off.

Site Updates:
${JSON.stringify(filteredUpdates)}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      setSummary(text);
      setCount(filteredUpdates.length);
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to generate summary';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">AI Communication Summary</h3>
            <p className="text-xs text-muted-foreground">Executive digest of site updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {range === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('h-9 text-xs', !from && 'text-muted-foreground')}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    {from ? format(from, 'MMM d') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('h-9 text-xs', !to && 'text-muted-foreground')}>
                    <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                    {to ? format(to, 'MMM d') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={to} onSelect={setTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </>
          )}

          <Button onClick={generate} disabled={loading} size="sm" className="gradient-primary text-primary-foreground h-9 text-xs">
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating</>
            ) : summary ? (
              <><RefreshCw className="w-3.5 h-3.5" /> Refresh</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Generate Summary</>
            )}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {!loading && summary && (
        <div className="rounded-xl bg-background/40 border border-border/60 p-4">
          {count !== null && (
            <div className="text-xs text-muted-foreground mb-2">Based on {count} update{count === 1 ? '' : 's'}</div>
          )}
          <div className={cn('prose prose-sm max-w-none dark:prose-invert', compact && 'text-sm')}>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {!loading && !summary && (
        <div className="text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 text-center">
          Click <span className="font-medium text-foreground">Generate Summary</span> to produce an AI digest of recent site activity.
        </div>
      )}
    </motion.div>
  );
}