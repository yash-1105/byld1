import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ConversationWithMeta, getConversations } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import NewConversationModal from '@/components/chat/NewConversationModal';

export default function ChatPage() {
  const [activeConv, setActiveConv] = useState<ConversationWithMeta | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Deep link: /chat?conversation=<id> opens that conversation directly.
  const targetConvId = searchParams.get('conversation');
  useEffect(() => {
    if (!targetConvId || !user) return;
    let cancelled = false;
    getConversations(user.id)
      .then(convos => {
        if (cancelled) return;
        const match = convos.find(c => c.id === targetConvId);
        if (match) {
          setActiveConv(match);
          setMobileShowChat(true);
        }
      })
      .catch(() => { /* list still renders normally */ })
      .finally(() => {
        if (!cancelled) setSearchParams({}, { replace: true });
      });
    return () => { cancelled = true; };
  }, [targetConvId, user?.id]);

  const handleSelect = (conv: ConversationWithMeta) => {
    setActiveConv(conv);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const handleNewChatCreated = (convId: string) => {
    // The conversation list will auto-refresh via realtime.
    // For now just close the modal. User can click on the new conversation.
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-8rem)] overflow-hidden">
      {/* Left Panel — Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 glass-card overflow-hidden ${mobileShowChat ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
        <ConversationList
          activeId={activeConv?.id || null}
          onSelect={handleSelect}
          onNewChat={() => setShowNewChat(true)}
        />
      </div>

      {/* Right Panel — Chat Window or Empty State */}
      <div className={`flex-1 glass-card overflow-hidden ml-0 md:ml-3 ${mobileShowChat ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
        {activeConv ? (
          <ChatWindow
            conversation={activeConv}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-5">
              <MessageSquare className="w-9 h-9 opacity-30" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Your Messages</h3>
            <p className="text-sm max-w-xs text-center">
              Select a conversation from the list or start a new chat to begin messaging your team.
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-5 gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start a Conversation
            </button>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreated={handleNewChatCreated}
      />
    </div>
  );
}
