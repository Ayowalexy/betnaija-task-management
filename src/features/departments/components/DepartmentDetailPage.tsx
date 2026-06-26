import { useState } from 'react';
import type { ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { UserPlus, Trash2, Save, Users, Ticket } from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Tabs } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Badge } from '../../../components/ui/index.js';
import { Avatar } from '../../../components/ui/index.js';
import { Input } from '../../../components/ui/index.js';
import { Textarea } from '../../../components/ui/index.js';
import { Modal } from '../../../components/ui/index.js';
import { Select } from '../../../components/ui/index.js';
import { DataTable } from '../../../components/shared/DataTable.js';
import type { Column } from '../../../components/shared/DataTable.js';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { DEPARTMENTS } from '../../../mocks/departments.js';
import { USERS } from '../../../mocks/users.js';
import { useTicketStore } from '../../../store/ticketStore.js';
import { useToast } from '../../../hooks/useToast.js';
import { useModal } from '../../../hooks/useModal.js';
import type { Ticket as TicketType } from '../../../types/index.js';
import { getStatusVariant, getPriorityVariant } from '../../../components/ui/index.js';
import styles from './DepartmentDetailPage.module.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'settings', label: 'Settings' },
];

function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

export function DepartmentDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const tickets = useTicketStore((s) => s.tickets);

  const [activeTab, setActiveTab] = useState('overview');
  const [responseHours, setResponseHours] = useState('');
  const [resolutionHours, setResolutionHours] = useState('');
  const [webhook, setWebhook] = useState('');
  const [description, setDescription] = useState('');
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');

  const addMemberModal = useModal();
  const deleteModal = useModal();

  const dept = DEPARTMENTS.find((d) => d.id === id);

  if (!dept) {
    return (
      <PageWrapper title="Not Found">
        <EmptyState title="Department not found" description="This department does not exist." />
      </PageWrapper>
    );
  }

  const head = USERS.find((u) => u.id === dept.headId);
  const members = USERS.filter((u) => dept.memberIds.includes(u.id));
  const deptTickets = tickets.filter((t) => t.departmentId === dept.id);
  const addableUsers = USERS.filter(
    (u) => u.id !== dept.headId && !dept.memberIds.includes(u.id),
  );

  const isRoster = dept.routing === 'roster_based';
  const routingLabel = isRoster ? 'Roster-Based' : 'All-Notify';
  const routingVariant = isRoster ? ('purple' as const) : ('info' as const);

  function handleSaveSLA(): void {
    toast({ type: 'success', message: 'SLA configuration saved' });
  }

  function handleSaveDescription(): void {
    toast({ type: 'success', message: 'Description updated' });
  }

  function handleSaveWebhook(): void {
    toast({ type: 'success', message: 'Webhook URL saved' });
  }

  function handleAddMember(): void {
    addMemberModal.close();
    setSelectedAddUserId('');
    toast({ type: 'success', message: 'Member added to department' });
  }

  function handleRemoveMember(): void {
    setRemoveMemberId(null);
    toast({ type: 'success', message: 'Member removed' });
  }

  function handleDeleteDept(): void {
    deleteModal.close();
    toast({ type: 'success', message: 'Department deleted' });
    void navigate('/departments');
  }

  const ticketColumns: Column<TicketType>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (t) => (
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
          #{t.id.slice(0, 8)}
        </span>
      ),
      width: '110px',
    },
    {
      key: 'title',
      header: 'Title',
      render: (t) => (
        <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
          {t.title}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge variant={getStatusVariant(t.status)} size="sm">
          {t.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <Badge variant={getPriorityVariant(t.priority)} size="sm">
          {t.priority}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (t) => (
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {format(new Date(t.createdAt), 'MMM d, yyyy')}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <PageWrapper title={dept.name} subtitle={dept.description}>
      {/* Info bar */}
      <div className={styles.infoBar}>
        {head && (
          <div className={styles.infoBarItem}>
            <span className={styles.infoBarLabel}>Head</span>
            <Avatar
              initials={head.avatarInitials}
              color={head.avatarColor}
              size="xs"
              name={head.name}
            />
            <span className={styles.infoBarName}>{head.name}</span>
          </div>
        )}

        <span className={styles.infoBarDivider} aria-hidden="true" />

        <div className={styles.infoBarItem}>
          <Badge variant={routingVariant} size="sm">
            {routingLabel}
          </Badge>
        </div>

        <span className={styles.infoBarDivider} aria-hidden="true" />

        <div className={styles.infoBarItem}>
          <span className={styles.infoBarCount}>
            <Ticket size={14} />
            <strong>{dept.activeTicketCount}</strong> active tickets
          </span>
        </div>

        <span className={styles.infoBarDivider} aria-hidden="true" />

        <div className={styles.infoBarItem}>
          <span className={styles.infoBarCount}>
            <Users size={14} />
            <strong>{members.length + 1}</strong> members
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrap}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Overview tab ─────────────────────────── */}
      {activeTab === 'overview' && (
        <div className={styles.section}>
          {/* SLA Configuration card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>SLA Configuration</h3>
            <div className={styles.slaRow}>
              <Input
                label="Response Time (hours)"
                type="number"
                step="0.5"
                placeholder={String(msToHours(dept.sla.responseTimeMs))}
                value={responseHours}
                onChange={(e) => setResponseHours(e.target.value)}
              />
              <Input
                label="Resolution Time (hours)"
                type="number"
                step="1"
                placeholder={String(msToHours(dept.sla.resolutionTimeMs))}
                value={resolutionHours}
                onChange={(e) => setResolutionHours(e.target.value)}
              />
              <div className={styles.slaBtnWrap}>
                <Button leftIcon={<Save size={14} />} onClick={handleSaveSLA} size="sm">
                  Save SLA
                </Button>
              </div>
            </div>
          </div>

          {/* Description card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Department Description</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Textarea
                label=""
                rows={3}
                placeholder={dept.description}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div>
                <Button
                  leftIcon={<Save size={14} />}
                  onClick={handleSaveDescription}
                  size="sm"
                  variant="secondary"
                >
                  Save Description
                </Button>
              </div>
            </div>
          </div>

          {/* Teams Webhook card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Teams Webhook</h3>
            <div className={styles.webhookRow}>
              <Input
                label="Webhook URL"
                placeholder={dept.teamsWebhook}
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
              />
              <div className={styles.slaBtnWrap}>
                <Button leftIcon={<Save size={14} />} onClick={handleSaveWebhook} size="sm">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Members tab ───────────────────────────── */}
      {activeTab === 'members' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Members
              <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'var(--font-weight-normal)', marginLeft: 'var(--space-2)' }}>
                ({members.length})
              </span>
            </h3>
            <Button size="sm" leftIcon={<UserPlus size={14} />} onClick={addMemberModal.open}>
              Add Member
            </Button>
          </div>

          <div className={styles.memberList}>
            {members.length === 0 ? (
              <EmptyState
                title="No members yet"
                description="Add members to this department to get started."
              />
            ) : (
              members.map((member) => (
                <div key={member.id} className={styles.memberRow}>
                  <Avatar
                    initials={member.avatarInitials}
                    color={member.avatarColor}
                    size="md"
                    name={member.name}
                    online={member.isOnline}
                  />

                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberEmail}>{member.email}</span>
                    <div className={styles.memberMeta}>
                      <Badge variant="default" size="sm">
                        {member.role.replace('_', ' ')}
                      </Badge>
                      <span className={styles.joinedDate}>
                        Joined {format(new Date(member.joinDate), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>

                  <div className={styles.memberActions}>
                    <Badge
                      variant={member.status === 'active' ? 'success' : 'error'}
                      size="sm"
                      dot
                    >
                      {member.status}
                    </Badge>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => setRemoveMemberId(member.id)}
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tickets tab ───────────────────────────── */}
      {activeTab === 'tickets' && (
        <div className={styles.section}>
          <DataTable<TicketType>
            columns={ticketColumns}
            data={deptTickets}
            keyExtractor={(t) => t.id}
            onRowClick={(t) => void navigate(`/tickets/${t.id}`)}
            pageSize={10}
            emptyState={
              <EmptyState
                title="No tickets"
                description="No tickets have been submitted to this department yet."
              />
            }
          />
        </div>
      )}

      {/* ── Settings tab ──────────────────────────── */}
      {activeTab === 'settings' && (
        <div className={styles.section}>
          {/* Webhook card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Teams Webhook</h3>
            <div className={styles.webhookRow}>
              <Input
                label="Webhook URL"
                placeholder={dept.teamsWebhook}
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
              />
              <div className={styles.slaBtnWrap}>
                <Button leftIcon={<Save size={14} />} onClick={handleSaveWebhook} size="sm">
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className={styles.dangerZone}>
            <div className={styles.dangerBody}>
              <h3 className={styles.dangerTitle}>Danger Zone</h3>
              <p className={styles.dangerDesc}>
                Deleting this department is permanent and cannot be undone. All routing rules
                and SLA configurations will be lost.
              </p>
            </div>
            <Button variant="danger" leftIcon={<Trash2 size={14} />} onClick={deleteModal.open}>
              Delete Department
            </Button>
          </div>
        </div>
      )}

      {/* Add member modal */}
      <Modal
        isOpen={addMemberModal.isOpen}
        onClose={addMemberModal.close}
        title="Add Member"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={addMemberModal.close}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedAddUserId}>
              Add Member
            </Button>
          </>
        }
      >
        <Select
          label="Select User"
          placeholder="Choose a user to add"
          value={selectedAddUserId}
          onChange={(e) => setSelectedAddUserId(e.target.value)}
          options={addableUsers.map((u) => ({ value: u.id, label: u.name }))}
        />
      </Modal>

      {/* Remove member confirm */}
      <ConfirmDialog
        isOpen={!!removeMemberId}
        onClose={() => setRemoveMemberId(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        description="Are you sure you want to remove this member from the department?"
        confirmLabel="Remove"
        danger
      />

      {/* Delete department confirm */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeleteDept}
        title="Delete Department"
        description={`Are you sure you want to delete "${dept.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </PageWrapper>
  );
}
