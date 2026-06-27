import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Users, Wifi, WifiOff } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuthStore } from '../../../store/authStore';
import { chatApi } from '../../../api/chat';
import type { ChatToken } from '../../../api/chat';
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

  // Stream.io connection state
  const [chatToken, setChatToken] = useState<ChatToken | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    chatApi.getToken().then((token) => {
      setChatToken(token);
      setConnectionStatus('connected');
    }).catch(() => {
      setConnectionStatus('error');
    });
  }, []);

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
    const otherId = activeConversation.participantIds.find((id) => id !== currentUser!.id);
    return otherId ?? 'Unknown';
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

  // Build minimal User stub for display (no users-by-id API available for chat)
  function makeUserStub(id: string) {
    return {
      id,
      name: id,
      email: '',
      role: 'team_member' as const,
      departmentId: null,
      status: 'active' as const,
      avatarInitials: id.slice(0, 2).toUpperCase(),
      avatarColor: '#4F6EF7',
      joinDate: '',
      lastLogin: null,
      isOnline: false,
      isFirstLogin: false,
      notificationPrefs: { email: true, teams: false, whatsapp: false },
    };
  }

  const dmOtherStub = dmOtherId ? makeUserStub(dmOtherId) : null;

  return (
    <div className={styles.page}>
      <ConversationList
        conversations={conversations}
        activeId={activeConversation?.id ?? null}
        onSelect={setActiveConversation}
      />

      <div className={styles.main}>
        {/* Stream.io connection status banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          fontSize: 'var(--font-size-xs)',
          color: connectionStatus === 'connected' ? 'var(--color-success)' : connectionStatus === 'error' ? 'var(--color-error)' : 'var(--color-text-secondary)',
          background: 'var(--color-bg-subtle)',
          borderBottom: '1px solid var(--color-border-default)',
        }}>
          {connectionStatus === 'connected' ? (
            <><Wifi size={12} /> Chat powered by Stream.io — connected{chatToken ? ` (key: ${chatToken.apiKey.slice(0, 8)}…)` : ''}</>
          ) : connectionStatus === 'error' ? (
            <><WifiOff size={12} /> Stream.io connection unavailable</>
          ) : (
            <><Wifi size={12} /> Connecting to Stream.io…</>
          )}
        </div>

        {activeConversation ? (
          <>
            <div className={styles.topBar}>
              {activeConversation.type === 'dm' && dmOtherStub ? (
                <Avatar initials={dmOtherStub.avatarInitials} color={dmOtherStub.avatarColor} size="sm" name={dmOtherStub.name} />
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
                    const senderStub = makeUserStub(msg.senderId);
                    const isOwn = msg.senderId === currentUser.id;
                    const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                    const showAvatar = !isOwn && prevMsg?.senderId !== msg.senderId;
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={isOwn}
                        sender={senderStub}
                        showAvatar={showAvatar}
                      />
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
