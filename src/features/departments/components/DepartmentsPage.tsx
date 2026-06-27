import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Ticket, Users } from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Button } from '../../../components/ui/index.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { useModal } from '../../../hooks/useModal.js';
import { useUIStore } from '../../../store/uiStore.js';
import { departmentsApi } from '../../../api/departments.js';
import type { Department } from '../../../types/index.js';
import { DepartmentCard } from './DepartmentCard.js';
import { CreateDepartmentModal } from './CreateDepartmentModal.js';
import styles from './DepartmentsPage.module.css';

export function DepartmentsPage(): ReactElement {
  const navigate = useNavigate();
  const { isOpen, open, close } = useModal();
  const addToast = useUIStore((s) => s.addToast);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await departmentsApi.list();
      setDepartments(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load departments';
      setError(message);
      addToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  function handleCardClick(id: string): void {
    void navigate(`/departments/${id}`);
  }

  function handleCreateSuccess(): void {
    close();
    void fetchDepartments();
  }

  const totalDepts = departments.length;
  const totalActiveTickets = departments.reduce((sum, d) => sum + d.activeTicketCount, 0);
  const totalMembers = departments.reduce(
    (sum, d) => sum + d.memberIds.length + 1, // +1 for head
    0,
  );

  const actions = (
    <Button leftIcon={<Plus size={16} />} onClick={open}>
      Create Department
    </Button>
  );

  return (
    <PageWrapper
      title="Departments"
      subtitle="Manage departments, routing rules, and SLA configurations"
      actions={actions}
    >
      <div className={styles.page}>
        {/* Summary stat cards */}
        <div className={styles.summaryRow}>
          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Building2 size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{totalDepts}</span>
              <span className={styles.statLabel}>Total Departments</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Ticket size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{totalActiveTickets}</span>
              <span className={styles.statLabel}>Active Tickets</span>
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statIconWrap}>
              <Users size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{totalMembers}</span>
              <span className={styles.statLabel}>Total Members</span>
            </div>
          </div>
        </div>

        {/* Department card grid */}
        {loading ? (
          <EmptyState
            icon={<Building2 size={40} />}
            title="Loading departments…"
            description="Please wait while we fetch your departments."
          />
        ) : error ? (
          <EmptyState
            icon={<Building2 size={40} />}
            title="Failed to load departments"
            description={error}
            action={
              <Button onClick={() => void fetchDepartments()}>Retry</Button>
            }
          />
        ) : departments.length === 0 ? (
          <EmptyState
            icon={<Building2 size={40} />}
            title="No departments yet"
            description="Create your first department to start routing tickets."
            action={
              <Button leftIcon={<Plus size={16} />} onClick={open}>
                Create Department
              </Button>
            }
          />
        ) : (
          <div className={styles.grid}>
            {departments.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>

      <CreateDepartmentModal isOpen={isOpen} onClose={close} onSuccess={handleCreateSuccess} />
    </PageWrapper>
  );
}
