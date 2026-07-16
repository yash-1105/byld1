import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Paperclip, Mic, Send, X, Image, Film, FileUp, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChatMessage,
  ConversationWithMeta,
  getMessages,
  sendMessage,
  deleteMessage,
  markAsRead,
  uploadChatFile,
  subscribeToMessages,
} from '@/services/chatService';
import MessageBubble from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import PhotoAnnotator from './PhotoAnnotator';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  conversation: ConversationWithMeta;
  onBack?: () => void;
}

function getConversationName(conv: ConversationWithMeta, userId: string): string {
  if (conv.name) return conv.name;
  if (conv.type === 'direct') {
    const other = conv.members.find(m => m.user_id !== userId);
    return other?.full_name || 'Unknown';
  }
  return conv.members.map(m => m.full_name || 'Unknown').join(', ');
}

function groupByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const d = msg.created_at ? new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : 'Unknown';
    if (d !== currentDate) {
      currentDate = d;
      groups.push({ date: d, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function ChatWindow({ conversation, onBack }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Photo markup: shared annotator state for both entry points (new photo & annotate-a-reply).
  const [annotatorSrc, setAnnotatorSrc] = useState<string | null>(null);
  const [annotatorReplyTo, setAnnotatorReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  // Fetch messages
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getMessages(conversation.id);
        setMessages(data);
        if (user) markAsRead(conversation.id, user.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [conversation.id, user]);

  // Scroll on messages change
  useEffect(() => { scrollToBottom(); }, [messages.length]);

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeToMessages(conversation.id, async (payload: any) => {
      if (payload._deleted) {
        setMessages(prev => prev.filter(m => m.id !== payload.id));
        return;
      }
      // Don't add duplicates (optimistic messages)
      setMessages(prev => {
        if (prev.some(m => m.id === payload.id)) return prev;
        // Fetch sender info
        return prev;
      });
      // Re-fetch to get full sender info
      const data = await getMessages(conversation.id);
      setMessages(data);
      if (user && payload.sender_id !== user.id) {
        markAsRead(conversation.id, user.id);
      }
    });
    return unsub;
  }, [conversation.id, user]);

  // ─── Send text ───
  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    const text = input.trim();
    setInput('');

    // Optimistic
    const optimisticMsg: ChatMessage = {
      id: `opt-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user.id,
      type: 'text',
      content: text,
      file_url: null,
      file_size: null,
      duration: null,
      reply_to_id: replyTo?.id || null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: { full_name: user.name, avatar_url: user.avatar || null, role: user.role },
      replyTo: replyTo,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyTo(null);
    scrollToBottom();

    try {
      setSending(true);
      await sendMessage(conversation.id, user.id, 'text', text, null, replyTo?.id || null);
    } catch {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, _failed: true } : m));
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ─── Send file ───
  const handleFileUpload = async (
    file: File,
    type: 'image' | 'video' | 'file',
    // Optional — only the annotate-a-photo reply flow passes this; every other
    // caller omits it, keeping the previous `null` (unthreaded) behavior intact.
    replyToId: string | null = null,
  ) => {
    if (!user) return;
    setShowAttach(false);
    setUploading(true);

    // Optimistic
    const optimisticMsg: ChatMessage = {
      id: `opt-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: user.id,
      type,
      content: file.name,
      file_url: type === 'image' ? URL.createObjectURL(file) : null,
      file_size: file.size,
      duration: null,
      reply_to_id: replyToId,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: { full_name: user.name, avatar_url: user.avatar || null, role: user.role },
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const url = await uploadChatFile(file, conversation.id, pct => setUploadProgress(pct));
      await sendMessage(conversation.id, user.id, type, file.name, url, replyToId, file.size);
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, _failed: true } : m));
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ─── Voice message ───
  const handleVoiceSend = async (blob: Blob, duration: number) => {
    if (!user) return;
    setUploading(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const url = await uploadChatFile(file, conversation.id);
      await sendMessage(conversation.id, user.id, 'voice', null, url, null, blob.size, duration);
    } catch (e: any) {
      toast.error(`Voice send failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ─── Delete ───
  const handleDelete = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await deleteMessage(msgId);
    } catch {
      toast.error('Failed to delete');
      const data = await getMessages(conversation.id);
      setMessages(data);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const f = e.target.files?.[0];
    if (f) {
      if (type === 'image') {
        // Photos open the markup editor first; video/file upload directly (unchanged).
        setShowAttach(false);
        setAnnotatorReplyTo(null);
        setAnnotatorSrc(URL.createObjectURL(f));
      } else {
        handleFileUpload(f, type);
      }
    }
    e.target.value = '';
  };

  const convName = getConversationName(conversation, user?.id || '');
  const dateGroups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
          conversation.type === 'group' ? 'bg-primary/10 text-primary' : 'gradient-primary text-primary-foreground'
        }`}>
          {conversation.type === 'group' ? <Users className="w-5 h-5" /> : convName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{convName}</div>
          <div className="text-xs text-muted-foreground">
            {conversation.members.length} member{conversation.members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="space-y-4 py-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="space-y-1.5">
                  <div className={`h-10 rounded-2xl bg-muted animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
                  <div className="h-2 w-12 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 opacity-30" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">Say hello! 👋</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dateGroups.map((group, gi) => (
              <div key={gi}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border">{group.date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {/* Messages */}
                <div className="space-y-2">
                  {group.messages.map((msg, mi) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                    const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isMe={isMe}
                        onReply={setReplyTo}
                        onDelete={handleDelete}
                        showAvatar={showAvatar}
                        onAnnotateReply={(url, original) => {
                          setAnnotatorReplyTo(original);
                          setAnnotatorSrc(url);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="bg-primary/5 rounded-xl p-3 flex items-center gap-3 border border-primary/10">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <div className="flex-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="bg-primary/5 rounded-xl p-3 flex items-center gap-3 border-l-2 border-primary">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-primary">{replyTo.sender?.full_name || 'Unknown'}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {replyTo.content || (replyTo.type === 'image' ? '📷 Photo' : '📎 File')}
                </div>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-muted rounded-md transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="p-3 pr-20 lg:pr-24 border-t border-border/60">
        {isRecording ? (
          <VoiceRecorder
            onSend={handleVoiceSend}
            onCancel={() => setIsRecording(false)}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        ) : (
          <div className="flex items-center gap-2">
            {/* Attach */}
            <div className="relative">
              <button
                onClick={() => setShowAttach(s => !s)}
                className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showAttach && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 8 }}
                    className="absolute bottom-full left-0 mb-2 bg-card border shadow-xl rounded-xl overflow-hidden min-w-[160px] z-10"
                  >
                    <button onClick={() => imageInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors">
                      <Image className="w-4 h-4 text-green-500" /> Photo
                    </button>
                    <button onClick={() => videoInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors">
                      <Film className="w-4 h-4 text-blue-500" /> Video
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors">
                      <FileUp className="w-4 h-4 text-orange-500" /> File
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hidden file inputs */}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileInput(e, 'image')} />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileInput(e, 'video')} />
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileInput(e, 'file')} />

            {/* Text input */}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />

            {/* Mic */}
            <button
              onClick={() => setIsRecording(true)}
              className="p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="gradient-primary p-2.5 rounded-xl text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Photo markup editor — shared by the new-photo and annotate-a-reply flows */}
      <AnimatePresence>
        {annotatorSrc && (
          <PhotoAnnotator
            imageSrc={annotatorSrc}
            onCancel={() => {
              if (annotatorSrc.startsWith('blob:')) URL.revokeObjectURL(annotatorSrc);
              setAnnotatorSrc(null);
              setAnnotatorReplyTo(null);
            }}
            onSend={(file) => {
              const replyId = annotatorReplyTo?.id ?? null;
              if (annotatorSrc.startsWith('blob:')) URL.revokeObjectURL(annotatorSrc);
              setAnnotatorSrc(null);
              setAnnotatorReplyTo(null);
              void handleFileUpload(file, 'image', replyId);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
