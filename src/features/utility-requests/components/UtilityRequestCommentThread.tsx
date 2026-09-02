import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Channel as StreamChannel, LocalMessage } from 'stream-chat';
import { Send, Bold, Italic, List, Code, Paperclip, Smile, Pencil, Trash2, ArrowDown, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/index.js';
import { Button } from '@/components/ui/index.js';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { useAuthStore } from '@/store/authStore.js';
import { useToast } from '@/hooks/useToast.js';
import { utilityRequestsApi } from '@/api/utility-requests.js';
import { filesApi } from '@/api/files.js';
import { getStreamClient } from '@/lib/streamChat.js';
import { renderMarkdown } from '@/lib/renderMarkdown.js';
import styles from './UtilityRequestCommentThread.module.css';

// Stream's reaction.type only allows alphanumeric/underscore/dash/dot — raw emoji glyphs
// are rejected with a 400. Map each picker emoji to a safe type and back for display.
const REACTION_EMOJI_TO_TYPE: Record<string, string> = {
  '👍': 'thumbs_up',
  '❤️': 'heart',
  '😂': 'laugh',
  '🎉': 'party',
};
const REACTION_TYPE_TO_EMOJI: Record<string, string> = Object.fromEntries(
  Object.entries(REACTION_EMOJI_TO_TYPE).map(([emoji, type]) => [type, emoji]),
);
const REACTIONS = Object.keys(REACTION_EMOJI_TO_TYPE);
const DEFAULT_AVATAR_COLOR = '#4F6EF7';
const NEAR_BOTTOM_THRESHOLD_PX = 80;

interface ThreadMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  attachments: { id: string; name: string; url: string }[];
  reactions: { emoji: string; count: number; reactedByMe: boolean }[];
}

function mapMessage(m: LocalMessage): ThreadMessage {
  const user = m.user as (LocalMessage['user'] & { avatarColor?: string }) | undefined;
  const authorName = user?.name ?? `User ${(user?.id ?? '').slice(0, 6)}`;
  const authorColor = user?.avatarColor ?? DEFAULT_AVATAR_COLOR;
  const ownTypes = new Set((m.own_reactions ?? []).map((r) => r.type));
  const reactionCounts = m.reaction_counts ?? {};
  const createdAt = m.created_at instanceof Date ? m.created_at.toISOString() : (m.created_at ?? new Date().toISOString());
  const updatedAt = m.updated_at instanceof Date ? m.updated_at.toISOString() : m.updated_at;

  return {
    id: m.id,
    authorId: user?.id ?? '',
    authorName,
    authorInitials: authorName.slice(0, 2).toUpperCase(),
    authorColor,
    content: m.text ?? '',
    createdAt,
    isEdited: !!updatedAt && updatedAt !== createdAt,
    attachments: (m.attachments ?? [])
      .filter((a) => a.asset_url)
      .map((a) => ({ id: a.asset_url!, name: a.title ?? 'Attachment', url: a.asset_url! })),
    reactions: Object.entries(reactionCounts).map(([type, count]) => ({
      emoji: REACTION_TYPE_TO_EMOJI[type] ?? type,
      count: count ?? 0,
      reactedByMe: ownTypes.has(type),
    })),
  };
}

interface CommentItemProps {
  comment: ThreadMessage;
  currentUserId: string | null;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReact: (id: string, emoji: string) => Promise<void>;
}

interface EditState {
  active: boolean;
  content: string;
}

function CommentItem({ comment, currentUserId, onEdit, onDelete, onReact }: CommentItemProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [edit, setEdit] = useState<EditState>({ active: false, content: comment.content });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwn = currentUserId === comment.authorId;

  async function submitEdit() {
    if (edit.content.trim()) {
      await onEdit(comment.id, edit.content);
      setEdit((s) => ({ ...s, active: false }));
    }
  }

  return (
    <div className={styles.comment}>
      <Avatar initials={comment.authorInitials} color={comment.authorColor} size="sm" name={comment.authorName} />
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>{comment.authorName}</span>
          <span className={styles.commentTime}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            {comment.isEdited && <span className={styles.editedTag}> (edited)</span>}
          </span>
        </div>
        {edit.active ? (
          <div className={styles.editBox}>
            <textarea
              className={styles.editTextarea}
              value={edit.content}
              onChange={(e) => setEdit((s) => ({ ...s, content: e.target.value }))}
              rows={3}
              autoFocus
            />
            <div className={styles.editActions}>
              <Button size="sm" onClick={submitEdit}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEdit({ active: false, content: comment.content })}>Cancel</Button>
            </div>
          </div>
        ) : (
          <p className={styles.commentContent}>{renderMarkdown(comment.content)}</p>
        )}
        {comment.attachments.length > 0 && (
          <div className={styles.attachments}>
            {comment.attachments.map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className={styles.attachChip}>
                <Paperclip size={11} aria-hidden="true" />{a.name}
              </a>
            ))}
          </div>
        )}
        {comment.reactions.length > 0 && (
          <div className={styles.reactions}>
            {comment.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                className={`${styles.reactionBtn} ${r.reactedByMe ? styles.reactionBtnActive : ''}`}
                onClick={() => onReact(comment.id, r.emoji)}
              >
                {r.emoji} {r.count}
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
              <button type="button" className={styles.actionBtn} onClick={() => setEdit((s) => ({ ...s, active: true }))} aria-label="Edit"><Pencil size={12} /></button>
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
  onSubmit: (content: string, files: File[]) => Promise<void>;
  onTyping: () => void;
}

interface ComposerState {
  content: string;
  files: File[];
  sending: boolean;
}

const INITIAL_COMPOSER: ComposerState = { content: '', files: [], sending: false };

function CommentInput({ onSubmit, onTyping }: CommentInputProps) {
  const [composer, setComposer] = useState<ComposerState>(INITIAL_COMPOSER);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function insertFormat(prefix: string, suffix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = composer.content.slice(s, e);
    const next = composer.content.slice(0, s) + prefix + selected + suffix + composer.content.slice(e);
    setComposer((c) => ({ ...c, content: next }));
    setTimeout(() => { el.setSelectionRange(s + prefix.length, e + prefix.length); el.focus(); }, 0);
  }

  async function handleSubmit() {
    if (!composer.content.trim() || composer.sending) return;
    setComposer((c) => ({ ...c, sending: true }));
    try {
      await onSubmit(composer.content.trim(), composer.files);
      setComposer((c) => ({ ...c, content: '', files: [], sending: false }));
    } finally {
      setComposer((c) => ({ ...c, sending: false }));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) setComposer((c) => ({ ...c, files: [...c.files, ...picked] }));
    e.target.value = '';
  }

  return (
    <div className={styles.inputArea}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('**', '**')} title="Bold"><Bold size={13} /></button>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('_', '_')} title="Italic"><Italic size={13} /></button>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('- ', '')} title="List"><List size={13} /></button>
        <button type="button" className={styles.toolBtn} onClick={() => insertFormat('`', '`')} title="Code"><Code size={13} /></button>
        <button type="button" className={styles.toolBtn} onClick={() => fileInputRef.current?.click()} title="Attach file">
          <Paperclip size={13} />
        </button>
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilePick} />
      </div>
      {composer.files.length > 0 && (
        <div className={styles.stagedFiles}>
          {composer.files.map((f, i) => (
            <span key={`${f.name}-${i}`} className={styles.stagedFileChip}>
              {f.name}
              <button type="button" onClick={() => setComposer((c) => ({ ...c, files: c.files.filter((_, idx) => idx !== i) }))} aria-label={`Remove ${f.name}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.inputRow}>
        <div className={styles.textareaWrap}>
          <textarea
            ref={textareaRef}
            className={styles.commentTextarea}
            placeholder="Write a comment… (Ctrl+Enter to send)"
            value={composer.content}
            onChange={(e) => { setComposer((c) => ({ ...c, content: e.target.value })); onTyping(); }}
            onKeyDown={handleKeyDown}
            rows={3}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!composer.content.trim() || composer.sending} loading={composer.sending} leftIcon={<Send size={14} />}>Send</Button>
      </div>
    </div>
  );
}

interface UtilityRequestCommentThreadProps {
  requestId: string;
}

interface ConnectionState {
  channel: StreamChannel | null;
  loading: boolean;
}

interface ScrollState {
  isNearBottom: boolean;
  showNewMessagePill: boolean;
}

export function UtilityRequestCommentThread({ requestId }: UtilityRequestCommentThreadProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();
  const [connection, setConnection] = useState<ConnectionState>({ channel: null, loading: true });
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  const listRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState<ScrollState>({ isNearBottom: true, showNewMessagePill: false });
  const prevCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setConnection((c) => ({ ...c, loading: true }));
    utilityRequestsApi.getChatAccess(requestId)
      .then(({ channelId }) => {
        if (cancelled) return;
        const ch = getStreamClient().channel('team', channelId);
        return ch.watch().then(() => {
          if (cancelled) return;
          setConnection({ channel: ch, loading: false });
        });
      })
      .catch(() => {
        if (!cancelled) {
          setConnection((c) => ({ ...c, loading: false }));
          toast({ type: 'error', message: 'Failed to load conversation.' });
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    const ch = connection.channel;
    if (!ch) return;
    const events = [
      'message.new', 'message.updated', 'message.deleted',
      'reaction.new', 'reaction.deleted', 'reaction.updated',
      'typing.start', 'typing.stop',
    ] as const;
    events.forEach((e) => ch.on(e, bump));
    return () => { events.forEach((e) => ch.off(e, bump)); };
  }, [connection.channel, bump]);

  const comments = useMemo(
    () => (connection.channel?.state.messages ?? []).map(mapMessage),
    // tick forces recomputation when the channel's internal state mutates in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connection.channel, tick],
  );

  const typingNames = useMemo(() => {
    if (!connection.channel) return [];
    return Object.values(connection.channel.state.typing ?? {})
      .map((e) => e.user)
      .filter((u): u is NonNullable<typeof u> => !!u && u.id !== currentUser?.id)
      .map((u) => (u.name as string | undefined) ?? 'Someone');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.channel, tick, currentUser?.id]);

  // Auto-scroll on new messages only if already near the bottom; otherwise surface a pill.
  useEffect(() => {
    const grew = comments.length > prevCountRef.current;
    prevCountRef.current = comments.length;
    if (!grew) return;
    if (scroll.isNearBottom) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    } else {
      setScroll((s) => ({ ...s, showNewMessagePill: true }));
    }
  }, [comments.length, scroll.isNearBottom]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
    setScroll((s) => ({ ...s, isNearBottom: nearBottom, showNewMessagePill: nearBottom ? false : s.showNewMessagePill }));
  }

  function scrollToBottom() {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    setScroll((s) => ({ ...s, showNewMessagePill: false }));
  }

  const handleTyping = useCallback(() => {
    void connection.channel?.keystroke();
  }, [connection.channel]);

  async function uploadFiles(files: File[]) {
    const uploaded = await Promise.all(files.map((f) => filesApi.upload(f, 'utility-request-comment', { requestId })));
    return uploaded.map((a) => ({ type: 'file', asset_url: a.url, title: a.name }));
  }

  async function handleSubmit(content: string, files: File[]) {
    if (!connection.channel) return;
    try {
      const attachments = files.length ? await uploadFiles(files) : undefined;
      await connection.channel.sendMessage({ text: content, attachments });
      void connection.channel.stopTyping();
      void utilityRequestsApi.logChatEvent(requestId, 'commented').catch(() => {});
    } catch {
      toast({ type: 'error', message: 'Failed to post comment.' });
    }
  }

  async function handleEdit(commentId: string, content: string) {
    try {
      await getStreamClient().updateMessage({ id: commentId, text: content });
      void utilityRequestsApi.logChatEvent(requestId, 'comment_edited').catch(() => {});
    } catch {
      toast({ type: 'error', message: 'Failed to update comment.' });
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await getStreamClient().deleteMessage(commentId);
      void utilityRequestsApi.logChatEvent(requestId, 'comment_deleted').catch(() => {});
    } catch {
      toast({ type: 'error', message: 'Failed to delete comment.' });
    }
  }

  async function handleReact(commentId: string, emoji: string) {
    if (!connection.channel) return;
    const type = REACTION_EMOJI_TO_TYPE[emoji] ?? emoji;
    const message = connection.channel.state.messages.find((m) => m.id === commentId);
    const alreadyReacted = (message?.own_reactions ?? []).some((r) => r.type === type);
    try {
      if (alreadyReacted) {
        await connection.channel.deleteReaction(commentId, type);
      } else {
        await connection.channel.sendReaction(commentId, { type });
      }
    } catch {
      toast({ type: 'error', message: 'Failed to toggle reaction.' });
    }
  }

  return (
    <div className={styles.thread}>
      <h3 className={styles.threadTitle}>Conversation</h3>
      <div className={styles.commentListWrap}>
        <div className={styles.commentList} ref={listRef} onScroll={handleScroll}>
          {connection.loading && <p className={styles.empty}>Loading conversation…</p>}
          {!connection.loading && comments.length === 0 && (
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
        {scroll.showNewMessagePill && (
          <button type="button" className={styles.newMessagePill} onClick={scrollToBottom}>
            <ArrowDown size={12} /> New messages
          </button>
        )}
      </div>
      {typingNames.length > 0 && (
        <p className={styles.typingIndicator}>
          {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
        </p>
      )}
      <CommentInput onSubmit={handleSubmit} onTyping={handleTyping} />
    </div>
  );
}
