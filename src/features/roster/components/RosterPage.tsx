import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react';
import { format, addDays, isToday } from 'date-fns';
import type { Shift } from '../../../types/index';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { Button, Modal } from '../../../components/ui/index';
import { useRoster } from '../hooks/useRoster';
import { ShiftBlock } from './ShiftBlock';
import { AddShiftModal } from './AddShiftModal';
import styles from './RosterPage.module.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function RosterPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();
  const departmentId = currentUser?.departmentId ?? 'tech';
  const { weekStart, weekEnd, nextWeek, prevWeek, currentWeekShifts, addShift, deleteShift, loading } = useRoster(departmentId);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleAddShift = useCallback(async (shift: Omit<Shift, 'id'>) => {
    try {
      await addShift(shift);
      setAddOpen(false);
      toast({ type: 'success', message: 'Shift added successfully' });
    } catch {
      toast({ type: 'error', message: 'Failed to add shift' });
    }
  }, [addShift, toast]);

  const handleDeleteShift = useCallback(async (id: string) => {
    try {
      await deleteShift(id);
      toast({ type: 'success', message: 'Shift removed' });
    } catch {
      toast({ type: 'error', message: 'Failed to remove shift' });
    }
  }, [deleteShift, toast]);

  return (
    <PageWrapper
      title="Roster"
      subtitle={weekLabel}
      actions={
        <div className={styles.actions}>
          <Button variant="outline" size="sm" leftIcon={<Upload size={14} />} onClick={() => setImportOpen(true)}>
            Import Excel
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Add Shift
          </Button>
        </div>
      }
    >
      <div className={styles.weekNav}>
        <button className={styles.navBtn} onClick={prevWeek} type="button">
          <ChevronLeft size={14} /> Prev Week
        </button>
        <span className={styles.weekLabel}>{weekLabel}</span>
        <button className={styles.navBtn} onClick={nextWeek} type="button">
          Next Week <ChevronRight size={14} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading shifts…
        </div>
      ) : (
        <div className={styles.grid}>
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayShifts = currentWeekShifts.filter((sb) => sb.shift.date === dateStr);
            const todayDay = isToday(day);

            return (
              <div key={dateStr} className={`${styles.dayCol}${todayDay ? ` ${styles.today}` : ''}`}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayName}>{DAY_NAMES[idx]}</div>
                  {todayDay ? (
                    <div className={styles.dayDate}>
                      <span className={styles.todayBadge}>{format(day, 'd')}</span>
                    </div>
                  ) : (
                    <div className={styles.dayDate}>{format(day, 'd')}</div>
                  )}
                </div>
                <div className={styles.dayBody}>
                  {dayShifts.length === 0 ? (
                    <p className={styles.noShifts}>No shifts</p>
                  ) : (
                    dayShifts.map((sb) => (
                      <ShiftBlock key={sb.shift.id} shift={sb.shift} user={sb.user} onDelete={handleDeleteShift} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddShiftModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddShift}
        departmentId={departmentId}
      />

      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import Excel">
        <div className={styles.importBody}>
          <div className={styles.dropZone}>
            <Upload size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <p style={{ margin: 0 }}>Drag and drop your CSV or Excel file here</p>
          </div>
          <p className={styles.importNote}>CSV/Excel import is not available in demo mode.</p>
          <Button variant="ghost" onClick={() => setImportOpen(false)}>Close</Button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
