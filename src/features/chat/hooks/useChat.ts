import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Channel as StreamChannel, Event as StreamEvent } from 'stream-chat';
import type { Conversation, ChatMessage, Attachment } from '@/types/index';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { getStreamClient } from '@/lib/streamChat';
import { filesApi } from '@/api/files';

function mapAttachments(raw: unknown): Attachment[] {
  const list = (raw as { asset_url?: string; title?: string; mime_type?: string }[] | undefined) ?? [];
  return list
    .filter((a) => a.asset_url)
    .map((a) => ({
      id: a.asset_url!,
      name: a.title ?? 'Attachment',
      type: a.mime_type ?? 'application/octet-stream',
      sizeBytes: 0,
      url: a.asset_url!,
    }));
}

function channelToConversation(channel: StreamChannel): Conversation {
  const members = Object.values(channel.state.members ?? {});
  const participantIds = members
    .map((m) => m.user?.id)
    .filter((id): id is string => !!id);

  const readState = channel.state.read ?? {};

  const messages: ChatMessage[] = (channel.state.messages ?? []).map((m) => {
    const sentAt = new Date(m.created_at as unknown as string).toISOString();
    const sentAtMs = new Date(sentAt).getTime();
    const readBy = Object.entries(readState)
      .filter(([, r]) => r.last_read && new Date(r.last_read).getTime() >= sentAtMs)
      .map(([uid]) => uid);
    return {
      id: m.id,
      conversationId: channel.id ?? '',
      senderId: m.user?.id ?? '',
      content: m.text ?? '',
      sentAt,
      readBy,
      attachments: mapAttachments(m.attachments),
    };
  });

  const lastMessageAt = channel.state.last_message_at
    ? new Date(channel.state.last_message_at).toISOString()
    : messages.length
      ? messages[messages.length - 1].sentAt
      : new Date((channel.data?.created_at as unknown as string) ?? Date.now()).toISOString();

  return {
    id: channel.id ?? '',
    type: channel.type === 'team' ? 'group' : 'dm',
    name: (channel.data as { name?: string } | undefined)?.name ?? null,
    participantIds,
    messages,
    lastMessageAt,
  };
}

interface UseChatReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loading: boolean;
  typingNames: string[];
  setActiveConversation: (id: string | null) => void;
  sendMessage: (content: string, files?: File[]) => void;
  handleTyping: () => void;
  startDirectMessage: (userId: string) => Promise<string>;
}

const RELEVANT_CLIENT_EVENTS = new Set([
  'message.new',
  'message.updated',
  'message.deleted',
  'notification.message_new',
  'notification.added_to_channel',
  'notification.mark_read',
  'channel.updated',
]);

export function useChat(): UseChatReturn {
  const currentUser = useAuthStore((s) => s.currentUser);
  const connected = useChatStore((s) => s.connected);
  const currentUserId = currentUser?.id ?? '';

  const [state, setState] = useState({ channels: [] as StreamChannel[], loading: true });
  const { channels, loading } = state;
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  // Load the channel list and keep it live.
  useEffect(() => {
    if (!currentUser || !connected) return;
    let cancelled = false;
    const client = getStreamClient();

    client.queryChannels(
      { members: { $in: [currentUser.id] }, type: { $in: ['messaging', 'team'] } },
      { last_message_at: -1 },
      { watch: true, state: true },
    ).then((chs) => {
      if (cancelled) return;
      setState({ channels: chs, loading: false });
    }).catch(() => {
      if (!cancelled) setState((s) => ({ ...s, loading: false }));
    });

    function sortByRecency(chs: StreamChannel[]): StreamChannel[] {
      return [...chs].sort((a, b) => {
        const at = a.state.last_message_at ? new Date(a.state.last_message_at).getTime() : 0;
        const bt = b.state.last_message_at ? new Date(b.state.last_message_at).getTime() : 0;
        return bt - at;
      });
    }

    function handleClientEvent(event: StreamEvent) {
      if (!RELEVANT_CLIENT_EVENTS.has(event.type)) return;

      // A brand-new conversation started by someone else arrives as notification.message_new
      // (or notification.added_to_channel) for a channel this client was never watching, so it
      // isn't in `channels` yet — re-sorting the existing list (below) silently drops it. Fetch
      // and watch it, then merge it in, mirroring how startDirectMessage adds it on the sender's side.
      if (
        (event.type === 'notification.message_new' || event.type === 'notification.added_to_channel') &&
        event.channel?.id &&
        event.channel?.type
      ) {
        const ch = client.channel(event.channel.type, event.channel.id);
        void ch.watch().then(() => {
          setState((s) => ({ ...s, channels: sortByRecency(s.channels.some((c) => c.id === ch.id) ? s.channels : [ch, ...s.channels]) }));
          bump();
        });
        return;
      }

      bump();
      setState((s) => ({ ...s, channels: sortByRecency(s.channels) }));
    }
    const sub = client.on(handleClientEvent);

    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, [currentUser, connected, bump]);

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  // Watch the active channel for new messages, typing activity, and mark it read.
  useEffect(() => {
    if (!activeChannel) return;
    activeChannel.on('message.new', bump);
    activeChannel.on('message.updated', bump);
    activeChannel.on('typing.start', bump);
    activeChannel.on('typing.stop', bump);
    void activeChannel.markRead();
    return () => {
      activeChannel.off('message.new', bump);
      activeChannel.off('message.updated', bump);
      activeChannel.off('typing.start', bump);
      activeChannel.off('typing.stop', bump);
    };
  }, [activeChannel, bump]);

  const conversations = useMemo(
    () => channels.map((c) => channelToConversation(c)),
    // tick forces recomputation when a channel's internal state mutates in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channels, tick],
  );

  const activeConversation = activeChannel ? channelToConversation(activeChannel) : null;

  const typingNames = useMemo(() => {
    if (!activeChannel) return [];
    return Object.values(activeChannel.state.typing ?? {})
      .map((e) => e.user)
      .filter((u): u is NonNullable<typeof u> => !!u && u.id !== currentUserId)
      .map((u) => (u.name as string | undefined) ?? 'Someone');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel, tick, currentUserId]);

  const setActiveConversation = useCallback((id: string | null) => {
    setActiveChannelId(id);
  }, []);

  const handleTyping = useCallback(() => {
    void activeChannel?.keystroke();
  }, [activeChannel]);

  const sendMessage = useCallback((content: string, files?: File[]) => {
    if (!activeChannel || !content.trim()) return;
    (async () => {
      const attachments = files?.length
        ? await Promise.all(files.map((f) => filesApi.upload(f, 'chat'))).then((uploaded) =>
            uploaded.map((a) => ({ type: 'file', asset_url: a.url, title: a.name, mime_type: a.type })),
          )
        : undefined;
      await activeChannel.sendMessage({ text: content.trim(), attachments });
      void activeChannel.stopTyping();
      bump();
    })().catch(() => {});
  }, [activeChannel, bump]);

  const startDirectMessage = useCallback(async (userId: string): Promise<string> => {
    const client = getStreamClient();
    const channel = client.channel('messaging', { members: [currentUserId, userId] });
    await channel.watch();
    setState((s) => (s.channels.some((c) => c.id === channel.id) ? s : { ...s, channels: [channel, ...s.channels] }));
    return channel.id ?? '';
  }, [currentUserId]);

  return {
    conversations,
    activeConversation,
    loading,
    typingNames,
    setActiveConversation,
    sendMessage,
    handleTyping,
    startDirectMessage,
  };
}
