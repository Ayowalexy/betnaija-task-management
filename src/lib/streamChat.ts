import { StreamChat } from 'stream-chat';
import type { User } from '../types/index';
import { chatApi } from '../api/chat';
import { useChatStore } from '../store/chatStore';
import { playChime } from './chime';

let client: StreamChat | null = null;
let connectedUserId: string | null = null;
let connectPromise: Promise<StreamChat> | null = null;
let unwatchUnread: (() => void) | null = null;

/** Same avatar generation the backend used to do server-side — kept here so Stream shows a matching image. */
function avatarUrl(user: User): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${user.avatarColor.replace('#', '')}&color=fff`;
}

/**
 * Returns the shared Stream Chat client, once connected. Throws if connectStreamUser() hasn't
 * resolved yet — chat UI should always sit behind a "connecting…" state until it has.
 */
export function getStreamClient(): StreamChat {
  if (!client) throw new Error('Stream Chat client not connected yet — call connectStreamUser() first.');
  return client;
}

export function isStreamConnected(): boolean {
  return client !== null;
}

/** Connects (or reuses an existing connection for) the given user. Safe to call multiple times. */
export function connectStreamUser(user: User): Promise<StreamChat> {
  if (client && connectedUserId === user.id) return Promise.resolve(client);
  if (connectPromise) return connectPromise;

  connectPromise = chatApi.getToken().then(async ({ token, apiKey }) => {
    const instance = StreamChat.getInstance(apiKey);
    // avatarColor is a custom field (not in Stream's base UserResponse type) — carried
    // through so message authors render with their real app avatar color.
    const result = await instance.connectUser(
      { id: user.id, name: user.name, image: avatarUrl(user), avatarColor: user.avatarColor } as any,
      token,
    );
    client = instance;
    connectedUserId = user.id;

    const chatStore = useChatStore.getState();
    chatStore.setConnected(true);
    chatStore.setTotalUnread(result?.me?.total_unread_count ?? 0);

    const handler = instance.on((event) => {
      if (typeof event.total_unread_count === 'number') {
        useChatStore.getState().setTotalUnread(event.total_unread_count);
      }
      // Registered once for the whole session (not scoped to ChatPage being mounted), so the
      // chime plays regardless of which route — or browser tab — you're currently on.
      if (
        (event.type === 'message.new' || event.type === 'notification.message_new') &&
        event.message?.user?.id &&
        event.message.user.id !== connectedUserId
      ) {
        playChime();
      }
    });
    unwatchUnread = () => handler.unsubscribe();

    return instance;
  }).finally(() => {
    connectPromise = null;
  });

  return connectPromise;
}

export async function disconnectStreamUser(): Promise<void> {
  const c = client;
  client = null;
  connectedUserId = null;
  connectPromise = null;
  unwatchUnread?.();
  unwatchUnread = null;
  useChatStore.getState().setConnected(false);
  useChatStore.getState().setTotalUnread(0);
  if (c && c.userID) {
    await c.disconnectUser();
  }
}
