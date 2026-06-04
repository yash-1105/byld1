import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────
export interface ConversationWithMeta {
  id: string;
  project_id: string | null;
  type: string | null;
  name: string | null;
  created_at: string | null;
  members: { user_id: string; role: string | null; full_name: string | null; avatar_url: string | null }[];
  lastMessage?: { content: string | null; type: string | null; created_at: string | null; sender_id: string | null };
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  type: string | null;
  content: string | null;
  file_url: string | null;
  file_size: number | null;
  duration: number | null;
  reply_to_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
  // Joined
  sender?: { full_name: string | null; avatar_url: string | null; role: string | null };
  replyTo?: ChatMessage | null;
  // Optimistic
  _optimistic?: boolean;
  _failed?: boolean;
}

// ─── Conversations ───────────────────────────────────────

export async function getConversations(userId: string): Promise<ConversationWithMeta[]> {
  // 1. Get conversation IDs where this user is a member
  const { data: memberships, error: memErr } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);
  if (memErr) throw memErr;
  if (!memberships || memberships.length === 0) return [];

  const convIds = memberships.map(m => m.conversation_id).filter(Boolean) as string[];

  // 2. Fetch conversations
  const { data: convos, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .in('id', convIds)
    .order('created_at', { ascending: false });
  if (convErr) throw convErr;

  // 3. Fetch all members for these conversations (with user info)
  const { data: allMembers } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, role')
    .in('conversation_id', convIds);

  // 4. Fetch user info for all members
  const memberUserIds = [...new Set((allMembers || []).map(m => m.user_id).filter(Boolean))] as string[];
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, role')
    .in('id', memberUserIds);
  const userMap = new Map((users || []).map(u => [u.id, u]));

  // 5. Fetch last message per conversation
  const results: ConversationWithMeta[] = [];
  for (const conv of convos || []) {
    const members = (allMembers || [])
      .filter(m => m.conversation_id === conv.id)
      .map(m => {
        const u = userMap.get(m.user_id || '');
        return { user_id: m.user_id || '', role: m.role, full_name: u?.full_name || null, avatar_url: u?.avatar_url || null };
      });

    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('content, type, created_at, sender_id')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .eq('is_read', false)
      .neq('sender_id', userId);

    results.push({
      ...conv,
      members,
      lastMessage: lastMsgs?.[0] || undefined,
      unreadCount: count || 0,
    });
  }

  // Sort by last message time
  results.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.created_at || '';
    const bTime = b.lastMessage?.created_at || b.created_at || '';
    return bTime.localeCompare(aTime);
  });

  return results;
}

// ─── Messages ────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data: msgs, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  // Fetch senders
  const senderIds = [...new Set((msgs || []).map(m => m.sender_id).filter(Boolean))] as string[];
  const { data: senders } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, role')
    .in('id', senderIds);
  const senderMap = new Map((senders || []).map(s => [s.id, s]));

  // Fetch reply-to messages
  const replyIds = (msgs || []).map(m => m.reply_to_id).filter(Boolean) as string[];
  let replyMap = new Map<string, ChatMessage>();
  if (replyIds.length > 0) {
    const { data: replies } = await supabase
      .from('messages')
      .select('*')
      .in('id', replyIds);
    replyMap = new Map((replies || []).map(r => [r.id, r as ChatMessage]));
  }

  return (msgs || []).map(m => ({
    ...m,
    sender: senderMap.get(m.sender_id || '') || undefined,
    replyTo: replyMap.get(m.reply_to_id || '') || null,
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  type: string,
  content: string | null,
  fileUrl: string | null = null,
  replyToId: string | null = null,
  fileSize: number | null = null,
  duration: number | null = null,
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      type,
      content,
      file_url: fileUrl,
      file_size: fileSize,
      duration,
      reply_to_id: replyToId,
      is_read: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw error;
}

export async function markAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId);
  if (error) throw error;
}

// ─── File Uploads ────────────────────────────────────────

export async function uploadChatFile(
  file: File,
  conversationId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  // Supabase JS SDK doesn't support upload progress natively,
  // so we simulate it with a quick ramp
  if (onProgress) onProgress(10);

  const { error } = await supabase.storage
    .from('chat-media')
    .upload(path, file);
  if (error) throw error;

  if (onProgress) onProgress(90);

  const { data: { publicUrl } } = supabase.storage
    .from('chat-media')
    .getPublicUrl(path);

  if (onProgress) onProgress(100);

  return publicUrl;
}

// ─── Conversations CRUD ──────────────────────────────────

export async function createConversation(
  projectId: string | null,
  type: string,
  name: string | null,
  memberIds: string[]
): Promise<string> {
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({ project_id: projectId, type, name })
    .select()
    .single();
  if (convErr) throw convErr;

  const memberRows = memberIds.map(uid => ({
    conversation_id: conv.id,
    user_id: uid,
    role: 'member',
  }));

  const { error: memErr } = await supabase
    .from('conversation_members')
    .insert(memberRows);
  if (memErr) throw memErr;

  return conv.id;
}

// ─── Realtime ────────────────────────────────────────────

export function subscribeToMessages(
  conversationId: string,
  callback: (msg: any) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => callback(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => callback({ ...payload.old, _deleted: true })
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToConversations(
  userId: string,
  callback: () => void
) {
  // Listen to all new messages — the callback will re-fetch conversations
  const channel = supabase
    .channel(`conv-updates:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
