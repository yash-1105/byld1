import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, ArrowRight, Flag, CircleAlert, Clock, ChevronRight,
  MessageSquare, FileText, Calendar, ListChecks, Sparkles,
  Activity, Users,
} from 'lucide-react';
import {
  C, Tile, Eyebrow, TileTitle, Donut,
  BentoHeader, BentoGrid, useAnalyzeDialog, monoDate,
} from './bento/BentoKit';

export default function ConsultantDashboard() {
  const { tasks, projects } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setOpen, dialog } = useAnalyzeDialog();
  const { activeProjectId } = useActiveProject();

  const today = new Date();

  // A selected project scopes the consultant's task list (and everything derived from it);
  // 'all' keeps the aggregate across every project they're assigned to.
  const myTasks = tasks.filter(t => t.assignee === user?.id && (activeProjectId === 'all' || t.projectId === activeProjectId));
  const activeRequests = myTasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const pendingReview  = myTasks.filter(t => t.status === 'review');
  const completed      = myTasks.filter(t => t.status === 'done');
  const urgent         = myTasks.filter(t => t.priority === 'urgent' && t.status !== 'done');

  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const dueSoon = myTasks.filter(t =>
    t.status !== 'done' && t.deadline &&
    new Date(t.deadline) >= today && new Date(t.deadline) <= weekAhead
  );

  const completionRate = myTasks.length > 0 ? Math.round((completed.length / myTasks.length) * 100) : 0;

  // Projects this consultant is assigned to (has tasks in) — the aggregate 'all' set.
  const myProjectIds = [...new Set(myTasks.map(t => t.projectId))];
  const assignedProjects = projects.filter(p => myProjectIds.includes(p.id));
  // When a project is selected, scope to just it (accessible projects only); fall back to
  // the aggregate if the selection isn't one of theirs.
  const scopedProjects = projects.filter(p => p.id === activeProjectId);
  const myProjects = activeProjectId === 'all'
    ? assignedProjects
    : (scopedProjects.length > 0 ? scopedProjects : assignedProjects);

  // hero = the selected/first project; next = soonest upcoming task in that project
  const hero = myProjects[0] || null;
  const heroNextTask = hero
    ? myTasks.filter(t => t.projectId === hero.id && t.status !== 'done' && t.deadline && new Date(t.deadline) >= today)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
    : null;

  // needs-you list: urgent first, then due-soon
  const needs = [
    ...urgent.map(t => ({ id: t.id, title: t.title, caption: 'URGENT' })),
    ...dueSoon.filter(t => !urgent.find(u => u.id === t.id))
      .map(t => ({ id: t.id, title: t.title, caption: 'DUE SOON' })),
  ].slice(0, 4);

  // AI insight (derived from real signals)
  const aiRisk = urgent.length > 0
    ? `${urgent.length} urgent request${urgent.length !== 1 ? 's need' : ' needs'} a response — clients are waiting on your input.`
    : pendingReview.length > 0
    ? `${pendingReview.length} request${pendingReview.length !== 1 ? 's are' : ' is'} pending review — close these out to keep work flowing.`
    : dueSoon.length > 0
    ? `${dueSoon.length} request${dueSoon.length !== 1 ? 's are' : ' is'} due this week.`
    : 'No critical risks detected. Run a full analysis for opportunities and forecasts.';
  const riskCount = (urgent.length > 0 ? 1 : 0) + (pendingReview.length > 0 ? 1 : 0) + (dueSoon.length > 0 ? 1 : 0);

  const dotColor = (status: string) =>
    status === 'done' ? C.sage : status === 'review' || status === 'in_progress' ? C.sageLight : C.faint3;

  // recent activity feed (real: my tasks — no site updates for consultants)
  const ago = (ts: number) => {
    const h = Math.round((today.getTime() - ts) / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  };
  const activity = [
    ...myTasks.map(t => ({ id: `t-${t.id}`, label: t.title, sub: 'Task', ts: new Date(t.createdAt).getTime(), tone: t.priority === 'urgent' ? C.sage : C.mono })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 5);

  // team members across the consultant's projects
  const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const teamMembers = [...new Set(myProjects.flatMap(p => p.team || []))].filter(Boolean);

  return (
    <>
      {dialog}
      <BentoHeader
        name={user?.name?.split(' ')[0] || 'Consultant'}
        summary={
          <>
            {activeRequests.length > 0
              ? `${activeRequests.length} active request${activeRequests.length !== 1 ? 's' : ''}${urgent.length > 0 ? ` · ${urgent.length} urgent` : ''}`
              : 'No active requests right now'}
            {' · '}{myProjects.length} project{myProjects.length !== 1 ? 's' : ''} assigned
          </>
        }
        onAnalyze={() => setOpen(true)}
      />

      <BentoGrid>
        {/* Hero project */}
        <Tile className="col-span-2 lg:col-span-5 lg:row-span-2 !p-0 overflow-hidden flex flex-col"
          onClick={hero ? () => navigate(`/projects/${hero.id}`) : undefined}>
          <div className="relative flex items-end h-[110px] sm:h-[188px]"
            style={{ background: `repeating-linear-gradient(135deg, ${C.hairStrong} 0 11px, ${C.canvas} 11px 22px)` }}>
            {hero && <span className="font-mono text-[10px] tracking-[0.06em] p-[7px]" style={{ color: C.faint }}>RENDER · {hero.name.toUpperCase()}</span>}
            <span className="absolute top-3 left-3 font-mono text-[10px] px-2 py-1 rounded-md"
              style={{ background: 'rgba(30,36,25,0.85)', color: C.onDarkText }}>
              PHASE · {(hero?.status || 'planning').toUpperCase()}
            </span>
          </div>
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
          <Donut percent={completionRate} center={`${completionRate}%`} label="SUCCESS RATE"
            sub={`${completed.length} of ${myTasks.length} task${myTasks.length !== 1 ? 's' : ''}`} />
        </Tile>

        {/* Active requests */}
        <Tile className="col-span-1 lg:col-span-3">
          <div className="flex items-center justify-between mb-3.5">
            <Eyebrow>ACTIVE REQUESTS</Eyebrow>
            <MessageSquare size={15} style={{ color: C.faint3 }} />
          </div>
          <div className="font-display font-semibold text-[30px] leading-none">{activeRequests.length}</div>
          <div className="font-body text-[11.5px] mt-2.5" style={{ color: C.muted2 }}>{dueSoon.length} due this week</div>
        </Tile>

        {/* Pending review + Projects pair */}
        <div className="col-span-2 grid grid-cols-2 gap-3 lg:col-span-3 lg:flex lg:flex-col lg:gap-[13px]">
          <Tile className="flex-1 !p-[14px_16px] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: C.tintSage, color: C.sage }}><ListChecks size={18} /></div>
            <div>
              <div className="font-display font-semibold text-[22px] leading-none">{pendingReview.length}</div>
              <Eyebrow className="mt-[3px] block tracking-[0.05em]">PENDING REVIEW</Eyebrow>
            </div>
          </Tile>
          <Tile className="flex-1 !p-[14px_16px] flex items-center gap-3.5" onClick={() => navigate('/projects')}>
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: C.tint, color: C.muted }}><FileText size={18} /></div>
            <div>
              <div className="font-display font-semibold text-[22px] leading-none">{myProjects.length}</div>
              <Eyebrow className="mt-[3px] block tracking-[0.05em]">PROJECTS</Eyebrow>
            </div>
          </Tile>
        </div>

        {/* Consultation queue */}
        <Tile className="col-span-2 lg:col-span-9 !p-[16px_18px]">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} style={{ color: C.muted }} />
              <TileTitle>Consultation queue</TileTitle>
            </div>
            <span className="font-mono text-[11px] cursor-pointer" style={{ color: C.mono }} onClick={() => navigate('/tasks')}>ALL TASKS</span>
          </div>
          {myTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {myTasks.slice(0, 5).map(t => {
                const project = projects.find(p => p.id === t.projectId);
                return (
                  <div key={t.id} className="flex items-center gap-[11px] p-2.5 rounded-[10px]" style={{ border: `1px solid ${C.tint}` }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor(t.status) }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-medium text-[12.5px] truncate">{t.title}</div>
                      <div className="font-mono text-[10px]" style={{ color: C.mono }}>{project?.name || '—'}</div>
                    </div>
                    {t.deadline && <span className="font-mono text-[11px] shrink-0" style={{ color: C.mono }}>{monoDate(new Date(t.deadline))}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="font-body text-[12.5px] py-6 text-center" style={{ color: C.mono }}>No consultation requests assigned.</div>
          )}
        </Tile>

        {/* This week */}
        <Tile className="col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 mb-3.5">
            <Calendar size={16} style={{ color: C.muted }} />
            <TileTitle>This week</TileTitle>
          </div>
          {dueSoon.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {dueSoon.slice(0, 4).map(t => {
                const daysLeft = Math.ceil((new Date(t.deadline).getTime() - today.getTime()) / 86400000);
                return (
                  <div key={t.id} className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: daysLeft <= 2 ? C.sage : C.sageLight }} />
                    <span className="font-body text-[12.5px] truncate flex-1" style={{ color: C.textStrong }}>{t.title}</span>
                    <span className="font-mono text-[11px] shrink-0" style={{ color: daysLeft <= 2 ? C.sage : C.mono }}>
                      {daysLeft === 0 ? 'TODAY' : daysLeft === 1 ? '1 DAY' : `${daysLeft} DAYS`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="font-body text-[12.5px] py-6 text-center" style={{ color: C.mono }}>Nothing due soon.</div>
          )}
        </Tile>

        {/* Recent activity */}
        <Tile className="col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 mb-3.5">
            <Activity size={16} style={{ color: C.muted }} />
            <TileTitle>Recent activity</TileTitle>
            <span className="font-mono text-[11px] ml-auto cursor-pointer" style={{ color: C.mono }} onClick={() => navigate('/tasks')}>View all</span>
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
