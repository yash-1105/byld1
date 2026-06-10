import { cn } from '@/lib/utils';

interface UserAvatarProps {
  /** initials to show as fallback (e.g. user.avatar) */
  initials?: string;
  /** name used to derive initials if `initials` not provided */
  name?: string;
  /** uploaded profile photo URL */
  avatarUrl?: string;
  /** sizing/extra classes, e.g. "w-8 h-8 text-xs" */
  className?: string;
}

const deriveInitials = (name?: string) =>
  name ? name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

export default function UserAvatar({ initials, name, avatarUrl, className }: UserAvatarProps) {
  const label = initials ?? deriveInitials(name);
  return (
    <div
      className={cn(
        'rounded-full gradient-primary flex items-center justify-center font-semibold text-primary-foreground overflow-hidden shrink-0',
        className,
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name || 'avatar'} className="w-full h-full object-cover" />
      ) : (
        label
      )}
    </div>
  );
}
