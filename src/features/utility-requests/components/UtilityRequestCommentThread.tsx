import { useState, useRef } from 'react';
import { Send, Bold, Italic, List, Code, Paperclip, Smile, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UtilityRequestComment } from '@/types/index.js';
import { Avatar } from '@/components/ui/index.js';
import { Button } from '@/components/ui/index.js';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { useUtilityRequestStore } from '@/store/utilityRequestStore.js';
import { useAuthStore } from '@/store/authStore.js';
import { getUserById, USERS } from '@/mocks/users.js';
import styles from './UtilityRequestCommentThread.module.css';

const REACTIONS = ['👍', '❤️', '😂', '🎉'];

interface CommentItemProps {
  comment: UtilityRequestComment;
  currentUserId: string | null;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
}

function CommentItem({ comment, currentUserId, onEdit, onDelete, onReact }: CommentItemProps) {
  const author = getUserById(comment.authorId);
  const [showReactions, setShowReactions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwn = currentUserId === comment.authorId;

  function submitEdit() {
    if (editContent.trim()) {
      onEdit(comment.id, editContent);
      setEditing(false);
    }
  }

  if (!author) return null;

  return (
    <div className={styles.comment}>
      <Avatar initials={author.avatarInitials} color={author.avatarColor} size="sm" name={author.name} />
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{author.name}</span>
          <span className={styles.commentTime}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            {comment.isEdited && <span className={styles.editedTag}> (edited)</span>}
          </span>
        </div>
        {editing ? (
          <div className={styles.editBox}>
            <textarea
              className={styles.editTextarea}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className={styles.editActions}>
              <Button size="sm" onClick={submitEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditContent(comment.content); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className={styles.commentContent}>{comment.content}</p>
        )}
        {comment.attachments.length > 0 && (
          <div className={styles.attachments}>
            {comment.attachments.map((a) => (
              <span key={a.id} className={styles.attachChip}>
                <Paperclip size={11} aria-hidden="true" />{a.name}
              </span>
            ))}
          </div>
        )}
        {comment.reactions.length > 0 && (
          <div className={styles.reactions}>
            {comment.reactions.map((r) => (
              <button key={r.emoji} type="button" className={styles.reactionBtn} onClick={() => onReact(comment.id, r.emoji)}>
                {r.emoji} {r.userIds.length}
              </button>
            ))}
          </div>
        )}
        <div className={styles.commentActions}>
          <button type="button" className={styles.actionBtn} onClick={() => setShowReactions((v) => !v)} aria-label="React">
            <Smile size={12} />
          </button>
          {showReactions && (
            <div className={styles.reactionPicker}>
              {REACTIONS.map((e) => (
                <button key={e} type="button" className={styles.emojiBtn} onClick={() => { onReact(comment.id, e); setShowReactions(false); }}>{e}</button>
              ))}
            </div>
          )}
          {isOwn && (
            <>
              <button type="button" className={styles.actionBtn} onClick={() => setEditing(true)} aria-label="Edit"><Pencil size={12} /></button>
              <button type="button" className={`${styles.actionBtn} ${styles.danger}`} onClick={() => setConfirmDelete(true)} aria-label="Delete"><Trash2 size={12} /></button>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { onDelete(comment.id); setConfirmDelete(false); }}
        title="Delete comment"
        description="Are you sure you want to delete this comment? This cannot be undone."
        danger
        confirmLabel="Delete"
      />
    </div>
  );
}

interface CommentInputProps {
  onSubmit: (content: string) => void;
}

function CommentInput({ onSubmit }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    const atIdx = val.lastIndexOf('@');
    if (atIdx !== -1) {
      const query = val.slice(atIdx + 1).toLowerCase();
      if (!query.includes(' ')) setMentionQuery(query);
      else setMentionQuery(null);
    } else {
      setMentionQuery(null);
    }
  }

  function insertFormat(prefix: string, suffix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = content.slice(s, e);
    const next = content.slice(0, s) + prefix + selected + suffix + content.slice(e);
    setContent(next);
    setTimeout(() => { el.setSelectionRange(s + prefix.length, e + prefix.length); el.focus(); }, 0);
  }

  function insertMention(name: string) {
    const atIdx = content.lastIndexOf('@');
    setContent(content.slice(0, atIdx) + `@${name} `);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  function handleSubmit() {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
    setMentionQuery(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  }

  const mentionUsers = mentionQuery !== null
    ? USERS.filter((u) => u.name.toLowerCase().includes(mentionQuery)).slice(0, 5)
    : [];

  return (
    <div className={styles.inputArea}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('**', '**')} title="Bold"><Bold size={13} /></button>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('_', '_')} title="Italic"><Italic size={13} /></button>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('- ', '')} title="List"><List size={13} /></button>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('`', '`')} title="Code"><Code size={13} /></button>
      </div>
      <div className={styles.inputRow}>
        <div className={styles.textareaWrap}>
          <textarea
            ref={textareaRef}
            className={styles.commentTextarea}
            placeholder="Write a comment… (Ctrl+Enter to send)"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          {mentionUsers.length > 0 && (
            <div className={styles.mentionDropdown}>
              {mentionUsers.map((u) => (
                <button key={u.id} type="button" className={styles.mentionItem} onClick={() => insertMention(u.name)}>
                  <Avatar initials={u.avatarInitials} color={u.avatarColor} size="xs" name={u.name} />
                  {u.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={!content.trim()} leftIcon={<Send size={14} />}>Send</Button>
      </div>
    </div>
  );
}

interface UtilityRequestCommentThreadProps {
  requestId: string;
  comments: UtilityRequestComment[];
}

export function UtilityRequestCommentThread({ requestId, comments }: UtilityRequestCommentThreadProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const addComment = useUtilityRequestStore((s) => s.addComment);
  const updateRequest = useUtilityRequestStore((s) => s.updateRequest);
  const requests = useUtilityRequestStore((s) => s.requests);
  const request = requests.find((r) => r.id === requestId);

  function handleSubmit(content: string) {
    if (!currentUser) return;
    const comment: UtilityRequestComment = {
      id: `urc-${requestId}-${Date.now()}`,
      requestId,
      authorId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      isEdited: false,
      reactions: [],
      attachments: [],
    };
    addComment(requestId, comment);
  }

  function handleEdit(commentId: string, content: string) {
    if (!request) return;
    const updated = request.comments.map((c) =>
      c.id === commentId ? { ...c, content, isEdited: true, updatedAt: new Date().toISOString() } : c
    );
    updateRequest(requestId, { comments: updated });
  }

  function handleDelete(commentId: string) {
    if (!request) return;
    updateRequest(requestId, { comments: request.comments.filter((c) => c.id !== commentId) });
  }

  function handleReact(commentId: string, emoji: string) {
    if (!request || !currentUser) return;
    const updated = request.comments.map((c) => {
      if (c.id !== commentId) return c;
      const existing = c.reactions.find((r) => r.emoji === emoji);
      let reactions;
      if (existing) {
        const hasReacted = existing.userIds.includes(currentUser.id);
        reactions = c.reactions.map((r) =>
          r.emoji === emoji
            ? { ...r, userIds: hasReacted ? r.userIds.filter((id) => id !== currentUser.id) : [...r.userIds, currentUser.id] }
            : r
        ).filter((r) => r.userIds.length > 0);
      } else {
        reactions = [...c.reactions, { emoji, userIds: [currentUser.id] }];
      }
      return { ...c, reactions };
    });
    updateRequest(requestId, { comments: updated });
  }

  return (
    <div className={styles.thread}>
      <h3 className={styles.threadTitle}>Conversation</h3>
      <div className={styles.commentList}>
        {comments.length === 0 && (
          <p className={styles.empty}>No comments yet. Be the first to respond.</p>
        )}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            currentUserId={currentUser?.id ?? null}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReact={handleReact}
          />
        ))}
      </div>
      <CommentInput onSubmit={handleSubmit} />
    </div>
  );
}
