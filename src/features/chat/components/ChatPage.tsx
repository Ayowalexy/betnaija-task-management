import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Users } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { getUserById, USERS } from '../../../mocks/users';
import { Avatar } from '../../../components/ui/index';
import { useChat } from '../hooks/useChat';
import { ConversationList } from './ConversationList';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import styles from './ChatPage.module.css';

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d');
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { conversations, activeConversation, setActiveConversation, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length]);

  if (!currentUser) return null;

  function getConvName() {
    if (!activeConversation) return '';
    if (activeConversation.type === 'group') return activeConversation.name ?? 'Group';
    const other = USERS.find(
      (u) => activeConversation.participantIds.includes(u.id) && u.id !== currentUser!.id
    );
    return other?.name ?? 'Unknown';
  }

  function getConvSub() {
    if (!activeConversation) return '';
    if (activeConversation.type === 'group') {
      return `${activeConversation.participantIds.length} members`;
    }
    const other = USERS.find(
      (u) => activeConversation.participantIds.includes(u.id) && u.id !== currentUser!.id
    );
    return other?.isOnline ? 'Online' : 'Offline';
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: NonNullable<typeof activeConversation>['messages'] }[] = [];
  if (activeConversation) {
    for (const msg of activeConversation.messages) {
      const dateKey = format(new Date(msg.sentAt), 'yyyy-MM-dd');
      const group = groupedMessages.find((g) => g.date === dateKey);
      if (group) group.msgs.push(msg);
      else groupedMessages.push({ date: dateKey, msgs: [msg] });
    }
  }

  const dmOther = activeConversation?.type === 'dm'
    ? USERS.find((u) => activeConversation.participantIds.includes(u.id) && u.id !== currentUser.id)
    : null;

  return (
    <div className={styles.page}>
      <ConversationList
        conversations={conversations}
        activeId={activeConversation?.id ?? null}
        onSelect={setActiveConversation}
      />

      <div className={styles.main}>
        {activeConversation ? (
          <>
            <div className={styles.topBar}>
              {activeConversation.type === 'dm' && dmOther ? (
                <Avatar initials={dmOther.avatarInitials} color={dmOther.avatarColor} size="sm" online={dmOther.isOnline} name={dmOther.name} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="var(--color-text-secondary)" />
                </div>
              )}
              <div className={styles.topBarInfo}>
                <div className={styles.topBarName}>{getConvName()}</div>
                <div className={styles.topBarSub}>{getConvSub()}</div>
              </div>
            </div>

            <div className={styles.messages}>
              {groupedMessages.map(({ date, msgs }) => (
                <div key={date}>
                  <div className={styles.dateSeparator}>
                    <span className={styles.dateSeparatorText}>{formatDateSeparator(date)}</span>
                  </div>
                  {msgs.map((msg, idx) => {
                    const sender = getUserById(msg.senderId);
                    if (!sender) return null;
                    const isOwn = msg.senderId === currentUser.id;
                    const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                    const showAvatar = !isOwn && prevMsg?.senderId !== msg.senderId;
                    return (
                      <MessageBubble key={msg.id} message={msg} isOwn={isOwn} sender={sender} showAvatar={showAvatar} />
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <MessageInput onSend={sendMessage} />
          </>
        ) : (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyIcon}><MessageSquare size={28} /></div>
            <p className={styles.emptyTitle}>Select a conversation</p>
            <p className={styles.emptyDesc}>Choose from your conversations on the left or start a new message.</p>
          </div>
        )}
      </div>
    </div>
  );
}
