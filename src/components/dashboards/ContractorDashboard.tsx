import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ArrowRight, Flag, CircleAlert, Clock, ChevronRight,
  AlertTriangle, Truck, GanttChart, Camera, ListChecks, Sparkles,
  Activity, Users, MessageSquare,
} from 'lucide-react';
import {
  C, Tile, Eyebrow, TileTitle, Donut, SegmentBar, WeekStrip, Striped, WeekDay,
  BentoHeader, BentoGrid, useAnalyzeDialog, monoDate,
} from './bento/BentoKit';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function ContractorDashboard() {
  const { tasks, siteUpdates, projects, purchaseOrders } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setOpen, dialog } = useAnalyzeDialog();

  const today = new Date();

  const myTasks = tasks.filter(t => t.assignee === user?.id);
  const pending   = myTasks.filter(t => t.status !== 'done');
  const urgent    = myTasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
  const done      = myTasks.filter(t => t.status === 'done');
  const completionRate = myTasks.length > 0 ? Math.round((done.length / myTasks.length) * 100) : 0;

  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const dueThisWeek = pending.filter(t => t.deadline && new Date(t.deadline) <= weekAhead);
  const overdue     = pending.filter(t => t.deadline && new Date(t.deadline) < today);

  // Procurement: orders committed but not yet delivered
  const projectIds = new Set(projects.map(p => p.id));
  const pendingDeliveries = purchaseOrders.filter(po =>
    projectIds.has(po.projectId) && ['approved', 'ordered', 'in_transit'].includes(po.status));
  const overdueDeliveries = pendingDeliveries.filter(po =>
    po.expectedDelivery && new Date(po.expectedDelivery) < today);

  // hero = project of soonest pending task (fallback: first project the contractor has tasks in)
  const soonestPending = pending
    .filter(t => t.deadline)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];
  const heroProjectId = soonestPending?.projectId || myTasks[0]?.projectId;
  const hero = projects.find(p => p.id === heroProjectId) || null;
  const heroNextTask = hero
    ? myTasks.filter(t => t.projectId === hero.id && t.status !== 'done' && t.deadline && new Date(t.deadline) >= today)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    : null;

  // needs-you list: overdue tasks first, then urgent
  const needs = [
    ...overdue.map(t => {
      const days = Math.abs(Math.ceil((new Date(t.deadline).getTime() - today.getTime()) / 86400000));
      return { id: t.id, title: t.title, caption: `OVERDUE · ${days} DAY${days !== 1 ? 'S' : ''}`, attention: true };
    }),
    ...urgent.filter(t => !overdue.find(o => o.id === t.id))
      .map(t => ({ id: t.id, title: t.title, caption: 'URGENT', attention: true })),
  ].slice(0, 4);

  // AI insight (derived from real signals)
  const aiRisk = overdueDeliveries.length > 0
    ? `${overdueDeliveries.length} delivery${overdueDeliveries.length !== 1 ? ' orders are' : ' order is'} past its expected date — chase the vendor to keep work moving.`
    : overdue.length > 0
    ? `${overdue.length} of your task${overdue.length !== 1 ? 's are' : ' is'} overdue — prioritise these to avoid timeline slip.`
    : urgent.length > 0
    ? `${urgent.length} urgent task${urgent.length !== 1 ? 's need' : ' needs'} attention this week.`
    : 'No critical risks detected. Run a full analysis for opportunities and forecasts.';
  const riskCount = (overdueDeliveries.length > 0 ? 1 : 0) + (overdue.length > 0 ? 1 : 0) + (urgent.length > 0 ? 1 : 0);

  // this week on site
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const week: WeekDay[] = WEEKDAYS.map((wd, i) => {
    const day = new Date(monday.getTime() + i * 86400000);
    const dayTasks = myTasks.filter(t => t.deadline && sameDay(new Date(t.deadline), day));
    const dayUpdates = siteUpdates.filter(u => sameDay(new Date(u.createdAt), day));
    const milestone = dayUpdates.find(u => u.type === 'milestone') || dayTasks.find(t => t.priority === 'urgent');
    const label = (dayTasks[0]?.title || dayUpdates[0]?.title || (milestone as any)?.title || '');
    const short = label ? label.split(' ').slice(0, 2).join(' ') : '';
    const isToday = sameDay(day, today);
    return {
      wd,
      kind: isToday ? 'today' : milestone && day > today ? 'milestone' : short ? 'event' : 'empty',
      label: short,
      dim: i === 6 && !short && !isToday,
    };
  });

  const latestUpdate = siteUpdates.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const updatePhotos = (latestUpdate?.images || []).slice(0, 2);
  const timeAgoH = latestUpdate
    ? Math.max(1, Math.round((today.getTime() - new Date(latestUpdate.createdAt).getTime()) / 3600000)) : null;

  // recent activity feed (real: site updates + my tasks)
  const ago = (ts: number) => {
    const h = Math.round((today.getTime() - ts) / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  };
  const activity = [
    ...siteUpdates.map(u => ({ id: u.id, label: u.title, sub: 'Site update', ts: new Date(u.createdAt).getTime(), tone: C.sage })),
    ...myTasks.slice(0, 8).map(t => ({ id: `t-${t.id}`, label: t.title, sub: 'Task', ts: new Date(t.createdAt).getTime(), tone: t.priority === 'urgent' ? C.sage : C.mono })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 5);

  // team members across the contractor's projects
  const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const teamMembers = [...new Set(projects.filter(p => myTasks.some(t => t.projectId === p.id)).flatMap(p => p.team || []))].filter(Boolean);

  return (
    <>
      {dialog}
      <BentoHeader
        name={user?.name?.split(' ')[0] || 'Contractor'}
        summary={
          pending.length > 0
            ? <>{pending.length} task{pending.length !== 1 ? 's' : ''} pending{overdue.length > 0 ? ` · ${overdue.length} overdue` : ''}{pendingDeliveries.length > 0 ? ` · ${pendingDeliveries.length} pending deliver${pendingDeliveries.length !== 1 ? 'ies' : 'y'}` : ''}</>
            : 'No pending tasks — great work!'
        }
        onNewTask={() => navigate('/tasks')}
        onAnalyze={() => setOpen(true)}
      />

      <BentoGrid>
        {/* Hero project */}
        <Tile className="col-span-2 lg:col-span-5 lg:row-span-2 !p-0 overflow-hidden flex flex-col"
          onClick={hero ? () => navigate(`/projects/${hero.id}`) : undefined}>
          <Striped className="h-[110px] sm:h-[188px]"
            label={hero ? `RENDER · ${hero.name.toUpperCase()}` : undefined}>
            <span className="absolute top-3 left-3 font-mono text-[10px] px-2 py-1 rounded-md"
              style={{ background: 'rgba(30,36,25,0.85)', color: C.onDarkText }}>
              PHASE · {(hero?.status || 'planning').toUpperCase()}
            </span>
          </Striped>
          <div className="p-[16px_17px_18px] flex-1">
            <div className="flex items-center justify-between">
              <div className="font-display font-semibold text-[19px] tracking-[-0.01em]">{hero?.name || 'No project'}</div>
              <ArrowUpRight size={18} style={{ color: C.mono }} />
            </div>
            <div className="font-body text-[12px] mt-0.5" style={{ color: C.muted2 }}>
              {hero?.address || hero?.description?.slice(0, 48) || '—'}
            </div>
            <div className="flex items-center justify-between mt-[18px] mb-[7px]">
              <Eyebrow>PROGRESS</Eyebrow>
              <span className="font-display font-semibold text-[13px]">{hero?.progress ?? 0}%</span>
            </div>
            <div className="h-[7px] rounded-[4px] overflow-hidden" style={{ background: C.tint }}>
              <div className="h-full rounded-[4px]" style={{ width: `${hero?.progress ?? 0}%`, background: C.sage }} />
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3.5" style={{ borderTop: `1px solid ${C.tint}` }}>
              <Flag size={14} style={{ color: C.sage }} />
              <span className="font-body text-[12.5px]" style={{ color: C.textStrong }}>
                {heroNextTask ? `Next: ${heroNextTask.title}` : 'No upcoming task'}
              </span>
              {heroNextTask && <span className="font-mono text-[11px] ml-auto" style={{ color: C.mono }}>{monoDate(new Date(heroNextTask.deadline))}</span>}
            </div>
          </div>
        </Tile>

        {/* Needs you */}
        <Tile className="col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 mb-3.5">
            <CircleAlert size={16} style={{ color: C.sage }} />
            <TileTitle>Needs you</TileTitle>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[5px] ml-auto" style={{ background: C.tintSage, color: C.sage }}>
              {needs.length}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {needs.length === 0 && <div className="font-body text-[12.5px] py-4 text-center" style={{ color: C.mono }}>All caught up.</div>}
            {needs.map(n => (
              <div key={n.id} className="flex items-center gap-[11px] p-2.5 rounded-[10px]" style={{ border: `1px solid ${C.tint}` }}>
                <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: C.tintSage, color: C.sage }}>
                  <Clock size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-medium text-[12.5px] truncate">{n.title}</div>
                  <div className="font-mono text-[10px]" style={{ color: C.sage }}>{n.caption}</div>
                </div>
                <ChevronRight size={15} style={{ color: C.faint3 }} className="shrink-0 cursor-pointer" onClick={() => navigate('/tasks')} />
              </div>
            ))}
          </div>
        </Tile>

        {/* AI insights */}
        <Tile dark className="col-span-2 lg:col-span-3 flex flex-col" onClick={() => setOpen(true)}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} style={{ color: C.sageLight }} />
            <span className="font-display font-semibold text-[12.5px]">AI Insights</span>
          </div>
          <Eyebrow color={C.sageLight} className="mb-1.5">{riskCount} RISK{riskCount !== 1 ? 'S' : ''} FLAGGED</Eyebrow>
          <div className="font-body text-[12.5px] leading-[1.45] flex-1" style={{ color: C.onDark }}>{aiRisk}</div>
          <div className="flex items-center justify-between mt-3.5 pt-3" style={{ borderTop: `1px solid ${C.onDarkBorder}` }}>
            <span className="font-body text-[11.5px]" style={{ color: C.onDarkText }}>View analysis</span>
            <ArrowRight size={15} style={{ color: C.sageLight }} />
          </div>
        </Tile>

        {/* Completion ring */}
        <Tile className="col-span-1 lg:col-span-4">
          <Donut percent={completionRate} center={`${completionRate}%`} label="COMPLETION RATE"
            sub={`${done.length} of ${myTasks.length} task${myTasks.length !== 1 ? 's' : ''}`} />
        </Tile>

        {/* Tasks complete */}
        <Tile className="col-span-1 lg:col-span-3">
          <div className="flex items-center justify-between mb-3.5">
            <Eyebrow>TASKS COMPLETE</Eyebrow>
            <ListChecks size={15} style={{ color: C.faint3 }} />
          </div>
          <div className="font-display font-semibold text-[30px] leading-none">
            {done.length}<span className="text-[20px]" style={{ color: C.faint3 }}>/{myTasks.length}</span>
          </div>
          <SegmentBar total={myTasks.length} done={done.length} />
          <div className="font-body text-[11.5px] mt-2.5" style={{ color: C.muted2 }}>{dueThisWeek.length} due this week</div>
        </Tile>

        {/* Overdue + Deliveries pair */}
        <div className="col-span-2 grid grid-cols-2 gap-3 lg:col-span-3 lg:flex lg:flex-col lg:gap-[13px]">
          <Tile className="flex-1 !p-[14px_16px] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: C.tintSage, color: C.sage }}><AlertTriangle size={18} /></div>
            <div>
              <div className="font-display font-semibold text-[22px] leading-none">{overdue.length}</div>
              <Eyebrow className="mt-[3px] block tracking-[0.05em]">OVERDUE</Eyebrow>
            </div>
          </Tile>
          <Tile className="flex-1 !p-[14px_16px] flex items-center gap-3.5" onClick={() => navigate('/procurement')}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: C.tint, color: C.muted }}><Truck size={18} /></div>
            <div>
              <div className="font-display font-semibold text-[22px] leading-none">{pendingDeliveries.length}</div>
              <Eyebrow className="mt-[3px] block tracking-[0.05em]">DELIVERIES</Eyebrow>
            </div>
          </Tile>
        </div>

        {/* This week on site */}
        <Tile className="col-span-2 lg:col-span-9 !p-[16px_18px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GanttChart size={16} style={{ color: C.muted }} />
              <TileTitle>This week on site</TileTitle>
            </div>
            <span className="font-mono text-[11px]" style={{ color: C.mono }}>
              {monoDate(monday)} — {monoDate(new Date(monday.getTime() + 6 * 86400000))}
            </span>
          </div>
          <WeekStrip days={week} />
        </Tile>

        {/* Site updates */}
        <Tile className="col-span-2 lg:col-span-4" onClick={() => navigate('/site-updates')}>
          <div className="flex items-center gap-2 mb-3.5">
            <Camera size={16} style={{ color: C.muted }} />
            <TileTitle>Site updates</TileTitle>
            {timeAgoH && <span className="font-mono text-[11px] ml-auto" style={{ color: C.mono }}>{timeAgoH}h ago</span>}
          </div>
          {latestUpdate ? (
            <>
              <div className="flex gap-2.5">
                {updatePhotos.length > 0
                  ? updatePhotos.map((src, i) => (
                      <div key={i} className="flex-1 h-[74px] rounded-[9px] bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
                    ))
                  : [0, 1].map(i => <Striped key={i} className="flex-1 h-[74px] rounded-[9px]" label={i === 0 ? 'PHOTO · SITE' : 'PHOTO · WORK'} />)}
              </div>
              <div className="font-body text-[12px] leading-[1.4] mt-2.5" style={{ color: C.textStrong }}>
                {latestUpdate.title}{latestUpdate.description ? ` — ${latestUpdate.description}` : ''}
              </div>
            </>
          ) : (
            <div className="font-body text-[12.5px] py-6 text-center" style={{ color: C.mono }}>No site updates yet.</div>
          )}
        </Tile>

        {/* Recent activity */}
        <Tile className="col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 mb-3.5">
            <Activity size={16} style={{ color: C.muted }} />
            <TileTitle>Recent activity</TileTitle>
            <span className="font-mono text-[11px] ml-auto cursor-pointer" style={{ color: C.mono }} onClick={() => navigate('/timeline')}>View all</span>
          </div>
          {activity.length > 0 ? (
            <div className="flex flex-col gap-3">
              {activity.map(a => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.tone }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-[12.5px] truncate" style={{ color: C.textStrong }}>{a.label}</div>
                    <div className="font-mono text-[10px] mt-px" style={{ color: C.mono }}>{a.sub.toUpperCase()} · {ago(a.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-body text-[12.5px] py-6 text-center" style={{ color: C.mono }}>No recent activity.</div>
          )}
        </Tile>

        {/* Team & messaging */}
        <Tile className="col-span-2 lg:col-span-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3.5">
            <Users size={16} style={{ color: C.muted }} />
            <TileTitle>Team</TileTitle>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[5px] ml-auto" style={{ background: C.tint, color: C.muted }}>
              {teamMembers.length}
            </span>
          </div>
          {teamMembers.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {teamMembers.slice(0, 8).map((m, i) => (
                <div key={i} className="flex items-center gap-2 pr-2.5 rounded-full" style={{ background: C.canvas }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-display font-semibold text-[11px]" style={{ background: C.tintSage, color: C.sage }}>
                    {initials(m)}
                  </div>
                  <span className="font-body text-[12px]" style={{ color: C.textStrong }}>{m.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-body text-[12.5px] py-3" style={{ color: C.mono }}>No team members yet.</div>
          )}
          <button onClick={() => navigate('/chat')}
            className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] font-body font-medium text-[12.5px]"
            style={{ background: C.ink, color: C.onDarkText }}>
            <MessageSquare size={14} /> Message the team
          </button>
        </Tile>
      </BentoGrid>
    </>
  );
}
