import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Link as LinkIcon, Unlink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CalendarConnection } from '@/types/calendar';

export default function CalendarIntegration() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<CalendarConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConnection = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_connections')
        .select('id, user_id, google_account_email, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setConnection(data as CalendarConnection | null);
    } catch (error) {
      console.error('Error fetching calendar connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase.functions.invoke('google-calendar-auth-url', {
        body: { userId: user.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Failed to initiate Google Calendar connection. Ensure Edge Functions are deployed.');
      console.error(error);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setConnection(null);
      toast.success('Google Calendar disconnected');
    } catch (error) {
      toast.error('Failed to disconnect Google Calendar');
    }
  };

  return (
    <div className="border border-border/60 rounded-xl p-5 bg-card relative overflow-hidden mt-4">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#4285F4]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#EA4335]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#f8f9fa] border border-[#dadce0] flex items-center justify-center shrink-0">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">Google Calendar</h4>
              {connection ? (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-[#0F9D58]/10 text-[#0F9D58] px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" /> Not Connected
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-0.5">
              {connection
                ? `Showing meetings from ${connection.google_account_email}`
                : 'See your upcoming meetings on the dashboard.'}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isLoading ? (
            <div className="w-24 h-9 bg-muted animate-pulse rounded-lg" />
          ) : connection ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 border border-border rounded-lg hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all text-muted-foreground"
            >
              <Unlink className="w-4 h-4" /> Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 text-sm font-medium px-5 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all shadow-sm"
            >
              <LinkIcon className="w-4 h-4" /> Connect Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
