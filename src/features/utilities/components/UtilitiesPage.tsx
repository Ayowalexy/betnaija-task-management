import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wrench, ListChecks, CalendarCheck2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper.js';
import { Button } from '@/components/ui/index.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { useToast } from '@/hooks/useToast.js';
import { useModal } from '@/hooks/useModal.js';
import { utilitiesApi } from '@/api/utilities.js';
import type { Utility } from '@/types/index.js';
import { UtilityCard } from './UtilityCard.js';
import { CreateUtilityModal } from './CreateUtilityModal.js';
import styles from './UtilitiesPage.module.css';

export function UtilitiesPage(): ReactElement {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOpen, open, close } = useModal();

  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUtilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await utilitiesApi.list();
      setUtilities(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load utilities';
      setError(message);
      toast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchUtilities();
  }, [fetchUtilities]);

  function handleCardClick(id: string): void {
    void navigate(`/utilities/${id}`);
  }

  function handleCreateSuccess(): void {
    close();
    void fetchUtilities();
  }

  const totalUtilities = utilities.length;
  const totalOptions = utilities.reduce((sum, u) => sum + u.options.length, 0);
  const totalSynced = utilities.filter((u) => u.calendar.enabled).length;

  const actions = (
    <Button leftIcon={<Plus size={16} />} onClick={open}>
      Create Utility
    </Button>
  );

  return (
    <PageWrapper
      title="Utility"
      subtitle="Manage bookable organization resources like meeting rooms and pool cars"
      actions={actions}
    >
      <div className={styles.page}>
        {/* Summary stat cards */}
        <div className={styles.summaryRow}>
          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Wrench size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{totalUtilities}</span>
              <span className={styles.statLabel}>Total Utilities</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <ListChecks size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{totalOptions}</span>
              <span className={styles.statLabel}>Total Options</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <CalendarCheck2 size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{totalSynced}</span>
              <span className={styles.statLabel}>Calendar-Synced</span>
            </div>
          </div>
        </div>

        {/* Utility card grid */}
        {loading ? (
          <EmptyState icon={<Wrench size={40} />} title="Loading utilities…" description="Please wait while we fetch your utilities." />
        ) : error ? (
          <EmptyState
            icon={<Wrench size={40} />}
            title="Failed to load utilities"
            description={error}
            action={<Button onClick={() => void fetchUtilities()}>Retry</Button>}
          />
        ) : utilities.length === 0 ? (
          <EmptyState
            icon={<Wrench size={40} />}
            title="No utilities yet"
            description="Create your first utility, like Meeting Rooms or Pool Cars, so people can request to use it."
            action={
              <Button leftIcon={<Plus size={16} />} onClick={open}>
                Create Utility
              </Button>
            }
          />
        ) : (
          <div className={styles.grid}>
            {utilities.map((utility) => (
              <UtilityCard key={utility.id} utility={utility} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>

      <CreateUtilityModal isOpen={isOpen} onClose={close} onSuccess={handleCreateSuccess} />
    </PageWrapper>
  );
}
