import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Wifi, WifiOff } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { usersApi } from '@/api/users';
import type { DirectoryUser } from '@/api/users';
import type { User } from '@/types/index';
import { Avatar } from '@/components/ui/index';
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
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const connected = useChatStore((s) => s.connected);
  const { conversations, activeConversation, loading, typingNames, setActiveConversation, sendMessage, handleTyping, startDirectMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Deliberately the unscoped chat directory, not usersApi.list() — the latter is
  // department-scoped for dept_head callers, which would silently hide any cross-department
  // conversation (getOtherParticipant returning undefined) since chat needs to resolve anyone.
  const [userMap, setUserMap] = useState<Record<string, DirectoryUser>>({});

  useEffect(() => {
    void usersApi.listDirectory().then((users) => {
      setUserMap(Object.fromEntries(users.map((u) => [u.id, u])));
    });
  }, []);

  useEffect(() => {
    if (conversationId) setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length]);

  if (!currentUser) return null;

  async function handleStartDM(userId: string) {
    const id = await startDirectMessage(userId);
    setActiveConversation(id);
    navigate(`/chat/${id}`);
  }

  function getConvName() {
    if (!activeConversation) return '';
    if (activeConversation.type === 'group') return activeConversation.name ?? 'Group';
    const otherId = activeConversation.participantIds.find((id) => id !== currentUser!.id);
    return (otherId && userMap[otherId]?.name) ?? otherId ?? 'Unknown';
  }

  function getConvSub() {
    if (!activeConversation) return '';
    if (activeConversation.type === 'group') {
      return `${activeConversation.participantIds.length} members`;
    }
    return 'Direct Message';
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

  const dmOtherId = activeConversation?.type === 'dm'
    ? activeConversation.participantIds.find((id) => id !== currentUser.id)
    : null;
  const dmOtherUser = dmOtherId ? userMap[dmOtherId] : null;

  function userStub(id: string): User {
    const known = userMap[id];
    return {
      id,
      name: known?.name ?? id,
      email: known?.email ?? '',
      role: 'team_member',
      departmentId: null,
      status: 'active',
      avatarInitials: known?.avatarInitials ?? id.slice(0, 2).toUpperCase(),
      avatarColor: known?.avatarColor ?? '#4F6EF7',
      joinDate: '',
      lastLogin: null,
      isOnline: known?.isOnline ?? false,
      isFirstLogin: false,
      notificationPrefs: { email: true, teams: false, whatsapp: false },
    };
  }

  return (
    <div className={styles.page}>
      <ConversationList
        conversations={conversations}
        activeId={activeConversation?.id ?? null}
        loading={loading}
        userMap={userMap}
        onSelect={(id) => { setActiveConversation(id); navigate(`/chat/${id}`); }}
        onStartDM={handleStartDM}
      />

      <div className={styles.main}>
        {/* Stream connection status banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          fontSize: 'var(--font-size-xs)',
          color: connected ? 'var(--color-success)' : 'var(--color-text-secondary)',
          background: 'var(--color-bg-subtle)',
          borderBottom: '1px solid var(--color-border-default)',
        }}>
          {connected ? (
            <><Wifi size={12} /> Connected</>
          ) : (
            <><WifiOff size={12} /> Connecting to chat…</>
          )}
        </div>

        {activeConversation ? (
          <>
            <div className={styles.topBar}>
              {activeConversation.type === 'dm' && dmOtherUser ? (
                <Avatar initials={dmOtherUser.avatarInitials} color={dmOtherUser.avatarColor} size="sm" name={dmOtherUser.name} online={dmOtherUser.isOnline} />
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
                    const sender = userStub(msg.senderId);
                    const isOwn = msg.senderId === currentUser.id;
                    const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                    const showAvatar = !isOwn && prevMsg?.senderId !== msg.senderId;
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={isOwn}
                        sender={sender}
                        showAvatar={showAvatar}
                      />
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {typingNames.length > 0 && (
              <p className={styles.typingIndicator}>
                {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
              </p>
            )}
            <MessageInput onSend={sendMessage} onTyping={handleTyping} />
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
