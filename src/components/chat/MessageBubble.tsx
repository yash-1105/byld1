import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Play, Pause, Download, Copy, Reply, Trash2, Check, CheckCheck } from 'lucide-react';
import { ChatMessage } from '@/services/chatService';
import ImageLightbox from './ImageLightbox';

interface Props {
  message: ChatMessage;
  isMe: boolean;
  onReply: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
  showAvatar: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function MessageBubble({ message, isMe, onReply, onDelete, showAvatar }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
    if (menuTimeout.current) clearTimeout(menuTimeout.current);
    menuTimeout.current = setTimeout(() => setShowMenu(false), 4000);
  };

  const handleCopy = () => {
    if (message.content) navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  const toggleAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio(message.file_url || '');
      audioRef.current = audio;
      audio.ontimeupdate = () => {
        if (audio.duration) setAudioProgress((audio.currentTime / audio.duration) * 100);
      };
      audio.onended = () => { setAudioPlaying(false); setAudioProgress(0); };
    }
    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Render message content based on type ───
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="cursor-pointer" onClick={() => setLightboxSrc(message.file_url)}>
            <img
              src={message.file_url || ''}
              alt="Shared image"
              className="max-w-[280px] max-h-[200px] rounded-xl object-cover"
              loading="lazy"
            />
            {message.content && (
              <p className="text-sm mt-1.5">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-[280px]">
            <video
              src={message.file_url || ''}
              controls
              className="rounded-xl w-full"
              preload="metadata"
            />
            {message.content && <p className="text-sm mt-1.5">{message.content}</p>}
          </div>
        );

      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={toggleAudio}
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                isMe ? 'bg-white/20 hover:bg-white/30' : 'bg-primary/10 hover:bg-primary/20'
              }`}
            >
              {audioPlaying
                ? <Pause className="w-4 h-4" />
                : <Play className="w-4 h-4 ml-0.5" />
              }
            </button>
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isMe ? 'bg-white/60' : 'bg-primary/60'}`}
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
              <span className="text-[10px] opacity-70">{formatDuration(message.duration)}</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <a
            href={message.file_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
              isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isMe ? 'bg-white/20' : 'bg-primary/10'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{message.content || 'File'}</div>
              <div className="text-[10px] opacity-60">{formatFileSize(message.file_size)}</div>
            </div>
            <Download className="w-4 h-4 opacity-60 flex-shrink-0" />
          </a>
        );

      default: // text
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <>
      <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
        {/* Avatar */}
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${
              isMe
                ? 'gradient-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {getInitials(message.sender?.full_name)}
            </div>
          )}
        </div>

        {/* Bubble */}
        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Reply preview */}
          {message.replyTo && (
            <div className={`text-[10px] px-3 py-1.5 mb-1 rounded-lg border-l-2 ${
              isMe
                ? 'bg-white/10 border-white/40 text-white/70'
                : 'bg-muted border-primary/40 text-muted-foreground'
            }`}>
              <span className="font-medium">{message.replyTo.sender?.full_name || 'Unknown'}</span>
              <p className="truncate">{message.replyTo.content || (message.replyTo.type === 'image' ? '📷 Photo' : '📎 File')}</p>
            </div>
          )}

          <motion.div
            onContextMenu={handleContextMenu}
            initial={message._optimistic ? { opacity: 0.6, scale: 0.95 } : { opacity: 0, y: 4 }}
            animate={{ opacity: message._failed ? 0.5 : 1, scale: 1, y: 0 }}
            className={`relative px-3.5 py-2.5 rounded-2xl ${
              isMe
                ? 'gradient-primary text-primary-foreground rounded-tr-md'
                : 'bg-muted text-foreground rounded-tl-md'
            } ${message._failed ? 'ring-2 ring-destructive/50' : ''}`}
          >
            {renderContent()}

            <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : ''}`}>
              <span className="text-[10px] opacity-50">{formatTime(message.created_at)}</span>
              {isMe && (
                message.is_read
                  ? <CheckCheck className="w-3 h-3 opacity-70" />
                  : <Check className="w-3 h-3 opacity-40" />
              )}
            </div>
          </motion.div>

          {/* Context menu */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute z-50 top-full mt-1 ${isMe ? 'right-10' : 'left-10'} bg-card border shadow-xl rounded-xl overflow-hidden min-w-[140px]`}
            >
              <button onClick={() => { onReply(message); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                <Reply className="w-3.5 h-3.5" /> Reply
              </button>
              {message.content && (
                <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              )}
              {isMe && (
                <button onClick={() => { onDelete(message.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
