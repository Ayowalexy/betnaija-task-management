import { useState, useEffect, useCallback } from 'react';
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
import { useUIStore } from '../../../store/uiStore.js';
import { useModal } from '../../../hooks/useModal.js';
import { departmentsApi } from '../../../api/departments.js';
import { usersApi } from '../../../api/users.js';
import type { Ticket as TicketType, Department, User } from '../../../types/index.js';
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
  const addToast = useUIStore((s) => s.addToast);

  const [dept, setDept] = useState<Department | null>(null);
  const [deptTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [responseHours, setResponseHours] = useState('');
  const [resolutionHours, setResolutionHours] = useState('');
  const [webhook, setWebhook] = useState('');
  const [description, setDescription] = useState('');
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');
  const [saving, setSaving] = useState(false);

  const addMemberModal = useModal();
  const deleteModal = useModal();

  const fetchDept = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await departmentsApi.get(id);
      setDept(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load department';
      setError(message);
      addToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    void fetchDept();
  }, [fetchDept]);

  useEffect(() => {
    void usersApi.list({ limit: 500 }).then((res) => setAllUsers(res.data));
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Loading…">
        <EmptyState title="Loading department…" description="Please wait." />
      </PageWrapper>
    );
  }

  if (error || !dept) {
    return (
      <PageWrapper title="Not Found">
        <EmptyState
          title="Department not found"
          description={error ?? 'This department does not exist.'}
          action={<Button onClick={() => void navigate('/departments')}>Back to Departments</Button>}
        />
      </PageWrapper>
    );
  }

  const head = allUsers.find((u) => u.id === dept.headId);
  const members = allUsers.filter((u) => dept.memberIds.includes(u.id));
  const addableUsers = allUsers.filter(
    (u) => u.id !== dept.headId && !dept.memberIds.includes(u.id),
  );

  const isRoster = dept.routing === 'roster_based';
  const routingLabel = isRoster ? 'Roster-Based' : 'All-Notify';
  const routingVariant = isRoster ? ('purple' as const) : ('info' as const);

  async function handleSaveSLA(): Promise<void> {
    if (!dept) return;
    const respMs = responseHours ? parseFloat(responseHours) * 60 * 60 * 1000 : dept.sla.responseTimeMs;
    const resMs = resolutionHours ? parseFloat(resolutionHours) * 60 * 60 * 1000 : dept.sla.resolutionTimeMs;
    setSaving(true);
    try {
      const updated = await departmentsApi.update(dept.id, {
        slaResponseMs: respMs,
        slaResolutionMs: resMs,
      });
      setDept(updated);
      setResponseHours('');
      setResolutionHours('');
      addToast({ type: 'success', message: 'SLA configuration saved' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save SLA' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDescription(): Promise<void> {
    if (!dept) return;
    setSaving(true);
    try {
      const updated = await departmentsApi.update(dept.id, { description });
      setDept(updated);
      addToast({ type: 'success', message: 'Description updated' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save description' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWebhook(): Promise<void> {
    if (!dept) return;
    setSaving(true);
    try {
      const updated = await departmentsApi.update(dept.id, { teamsWebhook: webhook });
      setDept(updated);
      addToast({ type: 'success', message: 'Webhook URL saved' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save webhook' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember(): Promise<void> {
    if (!dept || !selectedAddUserId) return;
    try {
      await departmentsApi.addMember(dept.id, selectedAddUserId);
      addMemberModal.close();
      setSelectedAddUserId('');
      addToast({ type: 'success', message: 'Member added to department' });
      void fetchDept();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to add member' });
    }
  }

  async function handleRemoveMember(): Promise<void> {
    if (!dept || !removeMemberId) return;
    try {
      await departmentsApi.removeMember(dept.id, removeMemberId);
      setRemoveMemberId(null);
      addToast({ type: 'success', message: 'Member removed' });
      void fetchDept();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to remove member' });
    }
  }

  async function handleDeleteDept(): Promise<void> {
    if (!dept) return;
    try {
      await departmentsApi.remove(dept.id);
      deleteModal.close();
      addToast({ type: 'success', message: 'Department deleted' });
      void navigate('/departments');
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete department' });
    }
  }

  const ticketColumns: Column<TicketType>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (t: TicketType) => (
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
          #{t.id.slice(0, 8)}
        </span>
      ),
      width: '110px',
    },
    {
      key: 'title',
      header: 'Title',
      render: (t: TicketType) => (
        <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
          {t.title}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: TicketType) => (
        <Badge variant={getStatusVariant(t.status)} size="sm">
          {t.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t: TicketType) => (
        <Badge variant={getPriorityVariant(t.priority)} size="sm">
          {t.priority}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (t: TicketType) => (
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
                <Button leftIcon={<Save size={14} />} onClick={() => void handleSaveSLA()} size="sm" loading={saving}>
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
                  onClick={() => void handleSaveDescription()}
                  size="sm"
                  variant="secondary"
                  loading={saving}
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
                <Button leftIcon={<Save size={14} />} onClick={() => void handleSaveWebhook()} size="sm" loading={saving}>
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
                <Button leftIcon={<Save size={14} />} onClick={() => void handleSaveWebhook()} size="sm" loading={saving}>
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
            <Button onClick={() => void handleAddMember()} disabled={!selectedAddUserId}>
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
        onConfirm={() => void handleRemoveMember()}
        title="Remove Member"
        description="Are you sure you want to remove this member from the department?"
        confirmLabel="Remove"
        danger
      />

      {/* Delete department confirm */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => void handleDeleteDept()}
        title="Delete Department"
        description={`Are you sure you want to delete "${dept.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </PageWrapper>
  );
}
