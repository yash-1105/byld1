import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export interface SiteUpdateRaw {
  id: string;
  content: string | null;
  created_at: string | null;
  media_urls: string[] | null;
  posted_by: string | null;
  project_id: string | null;
  type?: string;
}

export interface ParsedUpdate {
  title: string;
  description: string;
  type: 'progress' | 'milestone' | 'issue';
  taggedUserIds: string[];
}

// A comment belongs to the underlying site_updates row, so it travels with that update from
// the 24h Stories view into the Archive feed — the story viewer and the archive cards both
// look comments up by site_update_id.
export interface SiteUpdateComment {
  id: string;
  site_update_id: string;
  comment_text: string;
  created_by: string | null;
  created_at: string;
}

export const typeConfig = {
  progress: { icon: <Clock className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', dot: 'bg-primary' },
  milestone: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', dot: 'bg-success' },
  issue: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', dot: 'bg-destructive' },
};

export function parseUpdate(u: SiteUpdateRaw): ParsedUpdate {
  try {
    const parsed = JSON.parse(u.content || '{}');
    return {
      title: parsed.title || u.content?.slice(0, 50) || 'Update',
      description: parsed.description || '',
      type: (parsed.type as ParsedUpdate['type']) || 'progress',
      taggedUserIds: parsed.taggedUserIds || [],
    };
  } catch {
    return { title: u.content?.slice(0, 50) || 'Update', description: u.content || '', type: 'progress', taggedUserIds: [] };
  }
}

// The single privacy rule for site updates: private (tagged) updates are visible only to
// the poster and the tagged members. Used by the Archive feed, the stories tray, and the
// story viewer so all three can never drift apart.
export function canViewUpdate(u: SiteUpdateRaw, userId: string | undefined): boolean {
  const parsed = parseUpdate(u);
  if (parsed.taggedUserIds && parsed.taggedUserIds.length > 0) {
    return u.posted_by === userId || (!!userId && parsed.taggedUserIds.includes(userId));
  }
  return true;
}

export interface StoryGroup {
  userId: string;
  items: SiteUpdateRaw[]; // oldest → newest, so a stack plays chronologically
}

const STORY_WINDOW_MS = 24 * 60 * 60 * 1000;

// Active stories = media updates from the last 24h the viewer is allowed to see,
// grouped per poster. The current user's own group always sorts first; everyone
// else is ordered by their most recent story, newest first.
export function buildStoryGroups(updates: SiteUpdateRaw[], currentUserId: string | undefined): StoryGroup[] {
  const now = Date.now();
  const active = updates.filter(u =>
    (u.media_urls?.length ?? 0) > 0 &&
    u.created_at !== null &&
    now - new Date(u.created_at).getTime() < STORY_WINDOW_MS &&
    canViewUpdate(u, currentUserId)
  );

  const byUser = new Map<string, SiteUpdateRaw[]>();
  for (const u of active) {
    const key = u.posted_by || 'unknown';
    const list = byUser.get(key) ?? [];
    list.push(u);
    byUser.set(key, list);
  }

  const groups: StoryGroup[] = [...byUser.entries()].map(([userId, items]) => ({
    userId,
    items: items.sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()),
  }));

  const latestOf = (g: StoryGroup) => new Date(g.items[g.items.length - 1].created_at!).getTime();
  groups.sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return latestOf(b) - latestOf(a);
  });

  return groups;
}
