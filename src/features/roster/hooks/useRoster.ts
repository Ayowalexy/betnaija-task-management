import { useState, useCallback, useMemo } from 'react';
import { startOfWeek, endOfWeek, addWeeks, parseISO, isWithinInterval, format } from 'date-fns';
import type { Shift } from '../../../types/index';
import { ROSTER } from '../../../mocks/roster';
import { getUserById } from '../../../mocks/users';
import type { ShiftBlock } from '../types';

interface UseRosterReturn {
  shifts: Shift[];
  weekStart: Date;
  weekEnd: Date;
  nextWeek: () => void;
  prevWeek: () => void;
  getWeekShifts: (date: Date) => Shift[];
  addShift: (shift: Omit<Shift, 'id'>) => void;
  deleteShift: (id: string) => void;
  currentWeekShifts: ShiftBlock[];
}

export function useRoster(departmentId: string): UseRosterReturn {
  const [shifts, setShifts] = useState<Shift[]>([...ROSTER]);
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = useMemo(() => {
    const base = new Date(2026, 5, 26); // June 26 2026
    return addWeeks(base, weekOffset);
  }, [weekOffset]);

  const weekStart = useMemo(
    () => startOfWeek(baseDate, { weekStartsOn: 1 }),
    [baseDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(baseDate, { weekStartsOn: 1 }),
    [baseDate]
  );

  const getWeekShifts = useCallback(
    (date: Date): Shift[] => {
      const ws = startOfWeek(date, { weekStartsOn: 1 });
      const we = endOfWeek(date, { weekStartsOn: 1 });
      return shifts.filter((s) => {
        const d = parseISO(s.date);
        return s.departmentId === departmentId && isWithinInterval(d, { start: ws, end: we });
      });
    },
    [shifts, departmentId]
  );

  const currentWeekShifts = useMemo<ShiftBlock[]>(() => {
    const weekShifts = getWeekShifts(baseDate);
    return weekShifts
      .map((shift) => {
        const user = getUserById(shift.userId);
        if (!user) return null;
        return { shift, user };
      })
      .filter((s): s is ShiftBlock => s !== null);
  }, [getWeekShifts, baseDate]);

  const addShift = useCallback((shiftData: Omit<Shift, 'id'>) => {
    const id = `sh-${format(new Date(), 'yyyyMMddHHmmss')}`;
    setShifts((prev) => [...prev, { ...shiftData, id }]);
  }, []);

  const deleteShift = useCallback((id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const nextWeek = useCallback(() => setWeekOffset((o) => o + 1), []);
  const prevWeek = useCallback(() => setWeekOffset((o) => o - 1), []);

  return { shifts, weekStart, weekEnd, nextWeek, prevWeek, getWeekShifts, addShift, deleteShift, currentWeekShifts };
}
