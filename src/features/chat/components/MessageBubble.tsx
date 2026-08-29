import { Check, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import type { ChatMessage, User } from '@/types/index';
import { Avatar } from '@/components/ui/index';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  sender: User;
  showAvatar: boolean;
}

export function MessageBubble({ message, isOwn, sender, showAvatar }: MessageBubbleProps) {
  const isRead = message.readBy.length >= 2;
  const isDelivered = message.readBy.length >= 1;

  return (
    <div className={`${styles.wrapper}${isOwn ? ` ${styles.own}` : ''}`}>
      <div className={styles.avatarSlot}>
        {!isOwn && showAvatar && (
          <Avatar initials={sender.avatarInitials} color={sender.avatarColor} size="xs" name={sender.name} />
        )}
      </div>

      <div className={styles.bubble}>
        {!isOwn && showAvatar && (
          <span className={styles.senderName}>{sender.name}</span>
        )}

        <div className={styles.content}>
          {message.content}
          {message.attachments.length > 0 && (
            <div className={styles.attachments}>
              {message.attachments.map((att) => (
                <span key={att.id} className={styles.attachChip}>
                  <Paperclip size={11} />
                  {att.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.meta}>
          <span className={styles.time}>{format(new Date(message.sentAt), 'HH:mm')}</span>
          {isOwn && (
            <span className={`${styles.receipts}${isRead ? ` ${styles.read}` : ''}`}>
              {isDelivered ? (
                <span style={{ display: 'flex' }}>
                  <Check size={12} />
                  <Check size={12} style={{ marginLeft: -6 }} />
                </span>
              ) : (
                <Check size={12} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
