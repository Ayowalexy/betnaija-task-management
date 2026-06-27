import { useState, useEffect, useRef, useCallback } from 'react';
import type { Notification } from '../types/index';
import { notificationsApi } from '../api/notifications';
import { useAuthStore } from '../store/authStore';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const esRef = useRef<EventSource | null>(null);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.list({ limit: 50 });
      setNotifications(res.data);
      setUnreadCount(res.unreadCount ?? res.data.filter((n) => !n.isRead).length);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // SSE for live updates
  useEffect(() => {
    if (!isAuthenticated) return;
    const connect = () => {
      const es = notificationsApi.createSSEConnection();
      esRef.current = es;
      es.addEventListener('notification', (e) => {
        const notif: Notification = JSON.parse((e as MessageEvent).data);
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      });
      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000); // reconnect after 5s
      };
    };
    connect();
    return () => { esRef.current?.close(); };
  }, [isAuthenticated]);

  return { notifications, unreadCount, refresh: fetch };
}
