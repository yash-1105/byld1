import { useEffect, useState } from 'react';
import { MessageCircle, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DrawingComment {
  id: string;
  drawing_version_id: string;
  x_pct: number | string; // NUMERIC can arrive as a string from supabase-js
  y_pct: number | string;
  comment_text: string;
  created_by: string | null;
  created_at: string;
}

interface LayerUser {
  id: string;
  full_name?: string | null;
  email?: string | null;
}

interface Props {
  comments: DrawingComment[];
  users: LayerUser[];
  currentUserId: string | undefined;
  canModerate: boolean; // architects can delete anyone's pin
  placing: boolean;
  submitting: boolean;
  onAddComment: (x_pct: number, y_pct: number, text: string) => void;
  onDeleteComment: (id: string) => void;
}

const pct = (v: number | string) => Math.min(Math.max(Number(v), 0), 1) * 100;

export default function DrawingCommentLayer({
  comments, users, currentUserId, canModerate, placing, submitting, onAddComment, onDeleteComment,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState('');

  // Leaving placement mode abandons an unsubmitted draft pin.
  useEffect(() => {
    if (!placing) {
      setDraft(null);
      setDraftText('');
    }
  }, [placing]);

  const resolveName = (id: string | null) => {
    const u = users.find(x => x.id === id);
    return u?.full_name || u?.email || 'Unknown';
  };

  const handlePlaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing || draft) return;
    // Fraction of the overlay's own box — it hugs the rendered image exactly, so the
    // pin lands under the cursor no matter how large the preview renders.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
    setDraft({ x, y });
    setDraftText('');
  };

  const submitDraft = () => {
    if (!draft || !draftText.trim()) return;
    onAddComment(draft.x, draft.y, draftText.trim());
    setDraft(null);
    setDraftText('');
  };

  return (
    <div
      className={`absolute inset-0 ${placing ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onClick={handlePlaceClick}
    >
      {/* Existing pins */}
      {comments.map(c => {
        const isAuthor = c.created_by === currentUserId;
        const canDelete = isAuthor || canModerate;
        return (
          <Popover
            key={c.id}
            open={openId === c.id}
            onOpenChange={o => {
              setOpenId(o ? c.id : null);
              if (!o) setConfirmDeleteId(null);
            }}
          >
            <PopoverTrigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                className="absolute w-5 h-5 rounded-full gradient-primary text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-white/80 flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform"
                style={{ left: `${pct(c.x_pct)}%`, top: `${pct(c.y_pct)}%`, transform: 'translate(-50%, -50%)' }}
                title="View comment"
              >
                <MessageCircle className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" collisionPadding={12} onClick={e => e.stopPropagation()}>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{c.comment_text}</p>
              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-border/50">
                <div className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{resolveName(c.created_by)}</span>
                  {' · '}
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </div>
                {canDelete && (
                  confirmDeleteId === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setConfirmDeleteId(null); setOpenId(null); onDeleteComment(c.id); }}
                        className="text-[10px] px-2 py-1 rounded-md bg-destructive text-white font-medium"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        // Deleting your own pin is immediate; an architect removing
                        // someone else's gets a confirm step.
                        if (isAuthor) { setOpenId(null); onDeleteComment(c.id); }
                        else setConfirmDeleteId(c.id);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}

      {/* Draft pin + compose popover */}
      {draft && (
        <Popover open onOpenChange={o => { if (!o) { setDraft(null); setDraftText(''); } }}>
          <PopoverAnchor asChild>
            <div
              className="absolute w-5 h-5 rounded-full gradient-primary shadow-md shadow-primary/30 ring-2 ring-white/80 animate-pulse"
              style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          </PopoverAnchor>
          <PopoverContent className="w-64 p-3" collisionPadding={12} onClick={e => e.stopPropagation()}>
            <textarea
              autoFocus
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              placeholder="What's wrong here? e.g. fixture doesn't line up"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => { setDraft(null); setDraftText(''); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-medium hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={submitDraft}
                disabled={!draftText.trim() || submitting}
                className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Submit
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
