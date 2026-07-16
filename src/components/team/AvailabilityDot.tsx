import { cn } from '@/lib/utils';

export type AvailabilityStatus = 'available' | 'busy' | 'away' | 'offline';

// Single source of truth for the status colors + labels — reused by the header dropdown menu.
export const STATUS_META: Record<AvailabilityStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: '#22c55e' }, // green
  busy: { label: 'Busy', color: '#ef4444' },           // red
  away: { label: 'Away', color: '#f59e0b' },           // amber
  offline: { label: 'Offline', color: '#9ca3af' },     // grey
};

export const STATUS_OPTIONS: AvailabilityStatus[] = ['available', 'busy', 'away', 'offline'];

// A small colored dot with a ring so it stays visible composed over any avatar background.
// It is only the dot — callers position it (e.g. absolute bottom-right of an avatar).
export default function AvailabilityDot({
  status,
  className,
}: {
  status: AvailabilityStatus;
  className?: string;
}) {
  const meta = STATUS_META[status] || STATUS_META.offline;
  return (
    <span
      className={cn('block w-3 h-3 rounded-full ring-2 ring-background', className)}
      style={{ backgroundColor: meta.color }}
      title={meta.label}
      aria-label={meta.label}
    />
  );
}
