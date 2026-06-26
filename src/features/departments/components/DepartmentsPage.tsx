import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Ticket, Users } from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Button } from '../../../components/ui/index.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { DEPARTMENTS } from '../../../mocks/departments.js';
import { useModal } from '../../../hooks/useModal.js';
import { DepartmentCard } from './DepartmentCard.js';
import { CreateDepartmentModal } from './CreateDepartmentModal.js';
import styles from './DepartmentsPage.module.css';

export function DepartmentsPage(): ReactElement {
  const navigate = useNavigate();
  const { isOpen, open, close } = useModal();

  function handleCardClick(id: string): void {
    void navigate(`/departments/${id}`);
  }

  const totalDepts = DEPARTMENTS.length;
  const totalActiveTickets = DEPARTMENTS.reduce((sum, d) => sum + d.activeTicketCount, 0);
  const totalMembers = DEPARTMENTS.reduce(
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
        {DEPARTMENTS.length === 0 ? (
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
            {DEPARTMENTS.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>

      <CreateDepartmentModal isOpen={isOpen} onClose={close} />
    </PageWrapper>
  );
}
