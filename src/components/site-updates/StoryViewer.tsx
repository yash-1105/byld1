import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Volume2, VolumeX, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getInitials, isVideoUrl } from '@/lib/utils';
import { parseUpdate, typeConfig, type StoryGroup } from './shared';

interface ViewerUser {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface Props {
  groups: StoryGroup[];
  startGroupIndex: number;
  users: ViewerUser[];
  currentUserId: string | undefined;
  projectName?: string;
  onClose: () => void;
  onSeen: (id: string) => void;
  onDelete: (id: string) => void;
}

const IMAGE_DURATION_MS = 5000;
const TAP_MAX_MS = 250;

interface StoryItem {
  update: StoryGroup['items'][number];
  url: string;
}

export default function StoryViewer({ groups, startGroupIndex, users, currentUserId, projectName, onClose, onSeen, onDelete }: Props) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [itemIdx, setItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const elapsedRef = useRef(0);
  const durationRef = useRef(IMAGE_DURATION_MS);
  const rafRef = useRef<number | null>(null);
  const pointerDownAtRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const advancingRef = useRef(false);

  const group = groups[groupIdx];
  // One story segment per media file — an update with three photos plays as three segments.
  const flatItems: StoryItem[] = useMemo(
    () => (group ? group.items.flatMap(u => (u.media_urls || []).map(url => ({ update: u, url }))) : []),
    [group],
  );
  const current = flatItems[itemIdx];

  // Deletion (or any upstream data change) can shrink or empty the current group — clamp
  // or bail out instead of rendering a stale index.
  useEffect(() => {
    if (!group || flatItems.length === 0) {
      if (groupIdx < groups.length - 1) {
        setGroupIdx(g => g + 1);
        setItemIdx(0);
      } else {
        onClose();
      }
      return;
    }
    if (itemIdx >= flatItems.length) setItemIdx(flatItems.length - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, flatItems.length, itemIdx, groupIdx, groups.length]);

  const flatCountOf = useCallback(
    (g: StoryGroup) => g.items.reduce((n, u) => n + (u.media_urls?.length || 0), 0),
    [],
  );

  const goNext = useCallback((markSeen = true) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setTimeout(() => { advancingRef.current = false; }, 50);
    if (markSeen && current) onSeen(current.update.id);
    setConfirmingDelete(false);
    if (itemIdx < flatItems.length - 1) {
      setItemIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setItemIdx(0);
    } else {
      onClose();
    }
  }, [current, itemIdx, flatItems.length, groupIdx, groups.length, onSeen, onClose]);

  const goPrev = useCallback(() => {
    setConfirmingDelete(false);
    if (itemIdx > 0) {
      setItemIdx(i => i - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx(g => g - 1);
      setItemIdx(Math.max(0, flatCountOf(prevGroup) - 1));
    } else {
      // At the very first item — restart it.
      elapsedRef.current = 0;
      setProgress(0);
      const v = videoRef.current;
      if (v) v.currentTime = 0;
    }
  }, [itemIdx, groupIdx, groups, flatCountOf]);

  // Reset the clock only when the item itself changes — not on pause/resume.
  useEffect(() => {
    elapsedRef.current = 0;
    durationRef.current = IMAGE_DURATION_MS;
    setProgress(0);
  }, [current]);

  // Progress engine: images advance on a pause-aware clock; videos follow their own playhead.
  useEffect(() => {
    if (!current) return;

    const isVideo = isVideoUrl(current.url);
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      if (!paused) {
        if (isVideo) {
          const v = videoRef.current;
          if (v && v.duration > 0) {
            setProgress(Math.min(v.currentTime / v.duration, 1));
            if (v.ended || v.currentTime >= v.duration - 0.05) {
              goNext();
              return;
            }
          }
        } else {
          elapsedRef.current += delta;
          const p = Math.min(elapsedRef.current / durationRef.current, 1);
          setProgress(p);
          if (p >= 1) {
            goNext();
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [current, paused, goNext]);

  // Pause/resume must also drive the video element itself.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else void v.play().catch(() => { /* autoplay policy — user can tap */ });
  }, [paused, current]);

  // Keyboard: arrows navigate, Escape closes, Space pauses.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
      else if (e.key === ' ') {
        e.preventDefault();
        setPaused(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  if (!group || !current) return null;

  const poster = users.find(u => u.id === group.userId);
  const posterName = group.userId === currentUserId ? 'Your story' : (poster?.full_name || poster?.email || 'Team');
  const parsed = parseUpdate(current.update);
  const cfg = typeConfig[parsed.type] || typeConfig.progress;
  const isVideo = isVideoUrl(current.url);
  const isOwner = current.update.posted_by === currentUserId;
  const relTime = current.update.created_at
    ? formatDistanceToNow(new Date(current.update.created_at), { addSuffix: true })
    : '';

  const handleZonePointerDown = () => {
    pointerDownAtRef.current = performance.now();
    setPaused(true);
  };
  const handleZonePointerUp = (zone: 'prev' | 'next') => {
    const downAt = pointerDownAtRef.current;
    pointerDownAtRef.current = null;
    setPaused(false);
    if (downAt !== null && performance.now() - downAt < TAP_MAX_MS) {
      if (zone === 'prev') goPrev();
      else goNext();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onTouchStart={e => { touchStartYRef.current = e.touches[0].clientY; }}
        onTouchEnd={e => {
          const startY = touchStartYRef.current;
          touchStartYRef.current = null;
          if (startY !== null && e.changedTouches[0].clientY - startY > 80) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="relative w-full h-full sm:w-[420px] sm:h-[92vh] sm:rounded-3xl overflow-hidden bg-black"
        >
          {/* Media */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isVideo ? (
              <video
                key={current.url}
                ref={videoRef}
                src={current.url}
                muted={muted}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onLoadedMetadata={e => {
                  const d = e.currentTarget.duration;
                  durationRef.current = Number.isFinite(d) && d > 0 ? d * 1000 : IMAGE_DURATION_MS;
                }}
              />
            ) : (
              <img key={current.url} src={current.url} alt={parsed.title} className="w-full h-full object-contain" />
            )}
          </div>

          {/* Tap zones (below the header/controls) */}
          <div className="absolute inset-0 z-10 flex">
            <div
              className="w-1/3 h-full"
              onPointerDown={handleZonePointerDown}
              onPointerUp={() => handleZonePointerUp('prev')}
              onPointerLeave={() => { pointerDownAtRef.current = null; setPaused(false); }}
            />
            <div
              className="w-2/3 h-full"
              onPointerDown={handleZonePointerDown}
              onPointerUp={() => handleZonePointerUp('next')}
              onPointerLeave={() => { pointerDownAtRef.current = null; setPaused(false); }}
            />
          </div>

          {/* Top chrome */}
          <div className="absolute top-0 inset-x-0 z-20 p-3 bg-gradient-to-b from-black/70 to-transparent">
            {/* Segmented progress */}
            <div className="flex gap-1 mb-2.5">
              {flatItems.map((_, i) => (
                <div key={i} className="h-[3px] flex-1 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: i < itemIdx ? '100%' : i === itemIdx ? `${progress * 100}%` : '0%' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              {poster?.avatar_url ? (
                <img src={poster.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                  {getInitials(poster?.full_name || poster?.email)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{posterName}</div>
                <div className="text-[11px] text-white/60">{relTime}</div>
              </div>
              {isOwner && (
                confirmingDelete ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setConfirmingDelete(false); setPaused(false); onDelete(current.update.id); }}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-destructive text-white font-medium"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => { setConfirmingDelete(false); setPaused(false); }}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/15 text-white font-medium"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setConfirmingDelete(true); setPaused(true); }}
                    className="w-8 h-8 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                    title="Delete this update"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}
              {isVideo && (
                <button
                  onClick={() => setMuted(m => !m)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                  title={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom scrim: title / description / type */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-4 pt-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{parsed.type}</span>
              {projectName && (
                <span className="text-[10px] text-white/60 flex items-center gap-1"><MapPin className="w-3 h-3" /> {projectName}</span>
              )}
            </div>
            <h3 className="text-white font-semibold text-sm">{parsed.title}</h3>
            {parsed.description && <p className="text-white/75 text-xs mt-1 leading-relaxed line-clamp-3">{parsed.description}</p>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
