import { getConversations, createConversation, sendMessage } from '@/services/chatService';
import type { DirectoryUser, ProjectMemberRow } from '@/lib/aiContext';

/** Clients who are members of the given project, resolved to {id, name}. */
export function findProjectClients(
  projectId: string,
  users: DirectoryUser[],
  projectMembers: ProjectMemberRow[],
): { id: string; name: string }[] {
  const memberIds = new Set(
    projectMembers.filter(m => m.project_id === projectId).map(m => m.user_id),
  );
  return users
    .filter(u => memberIds.has(u.id) && u.role === 'client')
    .map(u => ({ id: u.id, name: u.full_name || u.email || 'Client' }));
}

/**
 * Deliver a client update via chat: reuse an existing direct conversation with
 * the client (preferring one tied to the project), or create one.
 */
export async function sendClientUpdate(
  senderId: string,
  projectId: string,
  clientId: string,
  content: string,
): Promise<string> {
  const conversations = await getConversations(senderId);
  const directsWithClient = conversations.filter(
    c => c.type === 'direct' && c.members.some(m => m.user_id === clientId),
  );
  const existing =
    directsWithClient.find(c => c.project_id === projectId) ?? directsWithClient[0];

  const convId =
    existing?.id ?? (await createConversation(projectId, 'direct', null, [senderId, clientId]));

  await sendMessage(convId, senderId, 'text', content);
  return convId;
}
