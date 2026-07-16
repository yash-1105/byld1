import { useRef, useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import type { SiteUpdateComment } from './shared';

interface ThreadUser {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

// Two surfaces render comments: the dark full-screen story viewer and the light archive card.
// Keeping the row markup + input here means they never drift apart visually — only the palette
// changes via `variant`.
type Variant = 'dark' | 'light';

function useVariantStyles(variant: Variant) {
  const dark = variant === 'dark';
  return {
    name: dark ? 'text-white' : 'text-foreground',
    text: dark ? 'text-white/85' : 'text-foreground/90',
    time: dark ? 'text-white/45' : 'text-muted-foreground',
    fallbackBubble: dark
      ? 'bg-white/15 text-white'
      : 'gradient-primary text-primary-foreground',
    trash: dark ? 'text-white/40 hover:text-white' : 'text-muted-foreground/40 hover:text-destructive',
    empty: dark ? 'text-white/50' : 'text-muted-foreground',
    inputWrap: dark
      ? 'bg-white/10 border-white/15 focus-within:border-white/30'
      : 'bg-background border-border focus-within:ring-2 focus-within:ring-primary/20',
    input: dark ? 'text-white placeholder:text-white/40' : 'text-foreground placeholder:text-muted-foreground',
    sendActive: dark ? 'bg-white text-black' : 'gradient-primary text-primary-foreground',
    sendIdle: dark ? 'bg-white/10 text-white/30' : 'bg-muted text-muted-foreground/50',
  };
}

function CommentAvatar({ person, variant }: { person: ThreadUser | undefined; variant: Variant }) {
  const s = useVariantStyles(variant);
  const name = person?.full_name || person?.email;
  if (person?.avatar_url) {
    return <img src={person.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${s.fallbackBubble}`}>
      {getInitials(name)}
    </div>
  );
}

export function CommentThread({
  comments,
  users,
  currentUserId,
  currentUserRole,
  onDelete,
  variant,
  emptyLabel = 'No comments yet. Be the first to reply.',
}: {
  comments: SiteUpdateComment[];
  users: ThreadUser[];
  currentUserId: string | undefined;
  currentUserRole?: string;
  onDelete: (id: string) => void;
  variant: Variant;
  emptyLabel?: string;
}) {
  const s = useVariantStyles(variant);

  if (comments.length === 0) {
    return <p className={`text-xs ${s.empty} py-2`}>{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map(c => {
        const author = users.find(u => u.id === c.created_by);
        const name = author?.full_name || author?.email || 'Team';
        const canDelete = c.created_by === currentUserId || currentUserRole === 'architect';
        const rel = c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : '';
        return (
          <div key={c.id} className="flex items-start gap-2.5 group">
            <CommentAvatar person={author} variant={variant} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold ${s.name}`}>{name}</span>
                <span className={`text-[10px] ${s.time}`}>{rel}</span>
              </div>
              <p className={`text-xs leading-relaxed mt-0.5 break-words ${s.text}`}>{c.comment_text}</p>
            </div>
            {canDelete && (
              <button
                onClick={() => onDelete(c.id)}
                className={`shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${s.trash}`}
                title="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CommentComposer({
  variant,
  placeholder = 'Add a comment…',
  onSubmit,
  onFocus,
  onBlur,
  autoFocus,
}: {
  variant: Variant;
  placeholder?: string;
  onSubmit: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}) {
  const s = useVariantStyles(variant);
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const trimmed = text.trim();

  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
    // Release focus so the story viewer resumes auto-advance the instant a reply is sent
    // (harmless on the inline archive surface, which ignores focus).
    inputRef.current?.blur();
  };

  return (
    <div className={`flex items-center gap-2 rounded-full border pl-4 pr-1.5 py-1.5 transition-colors ${s.inputWrap}`}>
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`flex-1 min-w-0 bg-transparent text-sm outline-none ${s.input}`}
      />
      <button
        type="button"
        onMouseDown={e => e.preventDefault() /* keep input focused so blur-resume doesn't race the click */}
        onClick={submit}
        disabled={!trimmed}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${trimmed ? s.sendActive : s.sendIdle}`}
        title="Send"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
