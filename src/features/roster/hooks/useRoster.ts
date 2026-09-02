import { useState, useCallback, useMemo, useEffect } from 'react';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';
import type { Shift, User } from '@/types/index';
import { rosterApi } from '@/api/roster';
import type { ShiftBlock } from '../types';

interface UseRosterReturn {
  shifts: Shift[];
  weekStart: Date;
  weekEnd: Date;
  nextWeek: () => void;
  prevWeek: () => void;
  getWeekShifts: (date: Date) => Shift[];
  addShift: (shift: Omit<Shift, 'id'>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  currentWeekShifts: ShiftBlock[];
  loading: boolean;
}

export function useRoster(departmentId: string): UseRosterReturn {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const baseDate = useMemo(() => addWeeks(new Date(), weekOffset), [weekOffset]);

  const weekStart = useMemo(
    () => startOfWeek(baseDate, { weekStartsOn: 1 }),
    [baseDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(baseDate, { weekStartsOn: 1 }),
    [baseDate]
  );

  // Fetch shifts for the visible week whenever navigation moves it
  useEffect(() => {
    setLoading(true);
    rosterApi.list({
      departmentId,
      dateFrom: format(weekStart, 'yyyy-MM-dd'),
      dateTo: format(weekEnd, 'yyyy-MM-dd'),
    }).then((res) => {
      setShifts(res.data);
    }).catch(() => {
      // silent – keep existing shifts
    }).finally(() => {
      setLoading(false);
    });
  }, [departmentId, weekStart, weekEnd]);

  const getWeekShifts = useCallback(
    (date: Date): Shift[] => {
      const ws = startOfWeek(date, { weekStartsOn: 1 });
      const we = endOfWeek(date, { weekStartsOn: 1 });
      return shifts.filter((s) => {
        const d = new Date(s.date);
        return s.departmentId === departmentId && d >= ws && d <= we;
      });
    },
    [shifts, departmentId]
  );

  const currentWeekShifts = useMemo<ShiftBlock[]>(() => {
    const weekShifts = getWeekShifts(baseDate);
    return weekShifts.map((shift) => {
      // GET /roster already enriches each shift with userName/userInitials/userColor —
      // build a display-only user stub from those instead of a separate users fetch.
      const displayName = shift.userName ?? shift.userId;
      const user: User = {
        id: shift.userId,
        name: displayName,
        email: '',
        role: 'team_member',
        departmentId: shift.departmentId,
        status: 'active',
        avatarInitials: shift.userInitials ?? displayName.slice(0, 2).toUpperCase(),
        avatarColor: shift.userColor ?? '#4F6EF7',
        joinDate: '',
        lastLogin: null,
        isOnline: false,
        isFirstLogin: false,
        notificationPrefs: { email: true, teams: false, whatsapp: false },
      };
      return { shift, user };
    });
  }, [getWeekShifts, baseDate]);

  const addShift = useCallback(async (shiftData: Omit<Shift, 'id'>) => {
    const created = await rosterApi.create(shiftData);
    setShifts((prev) => [...prev, created]);
  }, []);

  const deleteShift = useCallback(async (id: string) => {
    await rosterApi.remove(id);
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const nextWeek = useCallback(() => setWeekOffset((o) => o + 1), []);
  const prevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);

  return { shifts, weekStart, weekEnd, nextWeek, prevWeek, getWeekShifts, addShift, deleteShift, currentWeekShifts, loading };
}
