import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation } from '@/types/index';
import type { DirectoryUser } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Avatar, Modal } from '@/components/ui/index';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  loading?: boolean;
  userMap: Record<string, DirectoryUser>;
  onSelect: (id: string) => void;
  onStartDM: (userId: string) => void;
}

// Always returns a displayable stub, even if the other participant is missing from the
// directory (e.g. suspended) — a conversation should never silently disappear from the list
// just because we can't resolve a name for the other side.
function getOtherParticipant(conv: Conversation, currentUserId: string, userMap: Record<string, DirectoryUser>): DirectoryUser {
  const otherId = conv.participantIds.find((id) => id !== currentUserId) ?? '';
  return (
    userMap[otherId] ?? {
      id: otherId,
      name: otherId ? `User ${otherId.slice(0, 6)}` : 'Unknown user',
      email: '',
      avatarInitials: otherId.slice(0, 2).toUpperCase() || '?',
      avatarColor: '#4F6EF7',
      isOnline: false,
    }
  );
}

function getUnreadCount(conv: Conversation, currentUserId: string): number {
  return conv.messages.filter((m) => m.senderId !== currentUserId && !m.readBy.includes(currentUserId)).length;
}

export function ConversationList({ conversations, activeId, loading, userMap, onSelect, onStartDM }: ConversationListProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [search, setSearch] = useState('');
  const [newMsgOpen, setNewMsgOpen] = useState(false);

  if (!currentUser) return null;

  const filtered = conversations.filter((conv) => {
    if (conv.type === 'dm') {
      const other = getOtherParticipant(conv, currentUser.id, userMap);
      return other?.name.toLowerCase().includes(search.toLowerCase()) ?? false;
    }
    return (conv.name ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const sortedConvs = [...filtered].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );

  function handleNewDM(userId: string) {
    const existing = conversations.find(
      (c) => c.type === 'dm' && c.participantIds.includes(userId) && c.participantIds.includes(currentUser!.id)
    );
    if (existing) {
      onSelect(existing.id);
    } else {
      onStartDM(userId);
    }
    setNewMsgOpen(false);
  }

  const otherUsers = Object.values(userMap).filter((u) => u.id !== currentUser.id);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.title}>Messages</h2>
          <button className={styles.newBtn} onClick={() => setNewMsgOpen(true)}>
            <Plus size={12} />
            New
          </button>
        </div>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {loading && <p className={styles.emptySearch}>Loading conversations…</p>}
        {!loading && sortedConvs.length === 0 && (
          <p className={styles.emptySearch}>No conversations found</p>
        )}
        {sortedConvs.map((conv) => {
          const isActive = conv.id === activeId;
          const unread = getUnreadCount(conv, currentUser.id);
          const lastMsg = conv.messages[conv.messages.length - 1];
          const preview = lastMsg ? lastMsg.content.slice(0, 40) + (lastMsg.content.length > 40 ? '…' : '') : '';
          const timeAgo = formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true });

          if (conv.type === 'dm') {
            const other = getOtherParticipant(conv, currentUser.id, userMap);
            return (
              <div
                key={conv.id}
                className={`${styles.item}${isActive ? ` ${styles.active}` : ''}`}
                onClick={() => onSelect(conv.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(conv.id)}
              >
                <Avatar initials={other.avatarInitials} color={other.avatarColor} size="sm" online={other.isOnline} name={other.name} />
                <div className={styles.itemBody}>
                  <div className={styles.itemTopRow}>
                    <span className={styles.itemName}>{other.name}</span>
                    <span className={styles.itemTime}>{timeAgo}</span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemPreview}>{preview}</span>
                    {unread > 0 && <span className={styles.badge}>{unread}</span>}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={conv.id}
              className={`${styles.item}${isActive ? ` ${styles.active}` : ''}`}
              onClick={() => onSelect(conv.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(conv.id)}
            >
              <div className={styles.groupIcon}><Users size={16} /></div>
              <div className={styles.itemBody}>
                <div className={styles.itemTopRow}>
                  <span className={styles.itemName}>{conv.name || 'Untitled conversation'}</span>
                  <span className={styles.itemTime}>{timeAgo}</span>
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles.itemPreview}>{preview}</span>
                  {unread > 0 && <span className={styles.badge}>{unread}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={newMsgOpen} onClose={() => setNewMsgOpen(false)} title="New Message">
        <div className={styles.modalBody}>
          {otherUsers.map((user) => (
            <div key={user.id} className={styles.userOption} onClick={() => handleNewDM(user.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleNewDM(user.id)}>
              <Avatar initials={user.avatarInitials} color={user.avatarColor} size="sm" online={user.isOnline} name={user.name} />
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
