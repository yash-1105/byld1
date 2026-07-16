import { Plus } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { StoryGroup } from './shared';

interface TrayUser {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface Props {
  groups: StoryGroup[];
  user: { id: string } | null;
  users: TrayUser[];
  seenIds: Set<string>;
  onPostClick: () => void;
  onOpenViewer: (groupIndex: number) => void;
}

function Avatar({ person, name }: { person: TrayUser | undefined; name: string }) {
  if (person?.avatar_url) {
    return <img src={person.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />;
  }
  return (
    <div className="w-full h-full rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
      {getInitials(name)}
    </div>
  );
}

function Bubble({
  person, name, hasUnseen, showPlus, onClick, onPlusClick,
}: {
  person: TrayUser | undefined;
  name: string;
  hasUnseen: boolean;
  showPlus: boolean;
  onClick: () => void;
  onPlusClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 shrink-0 w-[72px] group">
      <div className="relative">
        <div className={`w-16 h-16 rounded-full p-[2.5px] transition-transform group-active:scale-95 ${hasUnseen ? 'gradient-primary' : 'bg-border'}`}>
          <div className="w-full h-full rounded-full bg-background p-[2px]">
            <Avatar person={person} name={name} />
          </div>
        </div>
        {showPlus && (
          <span
            onClick={onPlusClick}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full gradient-primary text-primary-foreground flex items-center justify-center border-2 border-background shadow-sm"
          >
            <Plus className="w-3 h-3" />
          </span>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground truncate w-full text-center leading-tight">{name}</span>
    </button>
  );
}

export default function StoriesTray({ groups, user, users, seenIds, onPostClick, onOpenViewer }: Props) {
  const findUser = (id: string) => users.find(u => u.id === id);
  const nameOf = (id: string) => {
    const u = findUser(id);
    return u?.full_name || u?.email || 'Team';
  };
  const hasUnseen = (g: StoryGroup) => g.items.some(item => !seenIds.has(item.id));

  const ownGroupIndex = groups.findIndex(g => g.userId === user?.id);
  const ownGroup = ownGroupIndex >= 0 ? groups[ownGroupIndex] : null;
  const otherGroups = groups.filter(g => g.userId !== user?.id);

  return (
    <div className="soft-card px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-none">
        {/* "Your Story" is always first — it doubles as the fast posting entry point */}
        <Bubble
          person={user ? findUser(user.id) : undefined}
          name="Your story"
          hasUnseen={ownGroup ? hasUnseen(ownGroup) : false}
          showPlus
          onClick={() => (ownGroup ? onOpenViewer(ownGroupIndex) : onPostClick())}
          onPlusClick={ownGroup ? (e) => { e.stopPropagation(); onPostClick(); } : undefined}
        />
        {otherGroups.map(g => (
          <Bubble
            key={g.userId}
            person={findUser(g.userId)}
            name={nameOf(g.userId)}
            hasUnseen={hasUnseen(g)}
            showPlus={false}
            onClick={() => onOpenViewer(groups.indexOf(g))}
          />
        ))}
      </div>
    </div>
  );
}
