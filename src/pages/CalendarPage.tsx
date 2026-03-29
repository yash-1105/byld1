import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const { tasks } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.deadline.startsWith(dateStr));
  };

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Deadlines and scheduled tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'month' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>Month</button>
          <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'week' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>Week</button>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-semibold text-foreground">{monthName}</h2>
          <button onClick={next} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-7 gap-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div key={i} className={`min-h-[80px] p-1.5 border border-border/50 rounded-lg ${!day ? 'bg-transparent border-transparent' : 'hover:bg-muted/50 transition-colors'}`}>
                {day && (
                  <>
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'gradient-primary text-primary-foreground' : 'text-foreground'}`}>
                      {day}
                    </div>
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate ${
                        t.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>{t.title.slice(0, 20)}</div>
                    ))}
                    {dayTasks.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayTasks.length - 2} more</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
