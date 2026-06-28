import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw, BellRing, UserPlus, Trash2, Save, Users, Ticket } from 'lucide-react';
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
import { createDepartmentSchema } from '../schemas.js';
import type { CreateDepartmentFormData } from '../schemas.js';
import type { Ticket as TicketType, Department, User } from '../../../types/index.js';
import { getStatusVariant, getPriorityVariant } from '../../../components/ui/index.js';
import styles from './DepartmentDetailPage.module.css';

const ROUTING_OPTIONS = [
  {
    value: 'roster_based' as const,
    label: 'Roster-Based',
    description: 'Tickets are assigned in rotation to available team members.',
    Icon: RotateCcw,
  },
  {
    value: 'all_notify' as const,
    label: 'All-Notify',
    description: 'All members are notified simultaneously for every ticket.',
    Icon: BellRing,
  },
];

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
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');

  const addMemberModal = useModal();
  const deleteModal = useModal();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateDepartmentFormData>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      headId: '',
      routing: 'roster_based',
      responseTimeHours: 1,
      resolutionTimeHours: 8,
      teamsWebhook: '',
    },
  });

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

  useEffect(() => {
    if (!dept) return;
    reset({
      name: dept.name,
      slug: dept.slug,
      description: dept.description ?? '',
      headId: dept.headId ?? '',
      routing: dept.routing,
      responseTimeHours: msToHours(dept.sla.responseTimeMs),
      resolutionTimeHours: msToHours(dept.sla.resolutionTimeMs),
      teamsWebhook: dept.teamsWebhook ?? '',
    });
  }, [dept, reset]);

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
  const deptHeadOptions = allUsers
    .filter((u) => u.role === 'dept_head' || u.role === 'root_admin')
    .map((u) => ({ value: u.id, label: u.name }));

  const isRoster = dept.routing === 'roster_based';
  const routingLabel = isRoster ? 'Roster-Based' : 'All-Notify';
  const routingVariant = isRoster ? ('purple' as const) : ('info' as const);

  async function handleSaveAll(data: CreateDepartmentFormData): Promise<void> {
    try {
      const updated = await departmentsApi.update(dept!.id, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        headId: data.headId || undefined,
        routing: data.routing,
        sla: {
          responseTimeMs: data.responseTimeHours * 60 * 60 * 1000,
          resolutionTimeMs: data.resolutionTimeHours * 60 * 60 * 1000,
        },
        teamsWebhook: data.teamsWebhook || undefined,
      });
      setDept(updated);
      addToast({ type: 'success', message: 'Department updated' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update department' });
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
    <PageWrapper title={dept.name} subtitle={dept.description ?? undefined}>
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

        {head && <span className={styles.infoBarDivider} aria-hidden="true" />}

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
            <strong>{members.length + (head ? 1 : 0)}</strong> members
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrap}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Overview tab (read-only) ──────────────── */}
      {activeTab === 'overview' && (
        <div className={styles.section}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>SLA Configuration</h3>
            <div className={styles.statGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Response Time</span>
                <span className={styles.statValue}>{msToHours(dept.sla.responseTimeMs)}h</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Resolution Time</span>
                <span className={styles.statValue}>{msToHours(dept.sla.resolutionTimeMs)}h</span>
              </div>
            </div>
          </div>

          {dept.description && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Description</h3>
              <p className={styles.descText}>{dept.description}</p>
            </div>
          )}
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
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Department Settings</h3>
            <form
              id="edit-dept-form"
              onSubmit={handleSubmit(handleSaveAll)}
              className={styles.editForm}
            >
              {/* Name & Slug */}
              <div className={styles.row}>
                <Input
                  label="Department Name"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Slug"
                  error={errors.slug?.message}
                  {...register('slug')}
                />
              </div>

              {/* Description */}
              <Textarea
                label="Description"
                rows={3}
                {...register('description')}
              />

              {/* Department Head */}
              <Select
                label="Department Head (optional)"
                placeholder="Select a department head"
                options={deptHeadOptions}
                error={errors.headId?.message}
                {...register('headId')}
              />

              {/* Routing Type */}
              <div className={styles.fieldset}>
                <p className={styles.fieldLabel}>Routing Type</p>
                <Controller
                  name="routing"
                  control={control}
                  render={({ field }) => (
                    <div className={styles.choiceGroup} role="radiogroup" aria-label="Routing type">
                      {ROUTING_OPTIONS.map(({ value, label, description, Icon }) => {
                        const isSelected = field.value === value;
                        return (
                          <label
                            key={value}
                            className={`${styles.choiceCard}${isSelected ? ` ${styles.selected}` : ''}`}
                          >
                            <input
                              type="radio"
                              className={styles.choiceInput}
                              value={value}
                              checked={isSelected}
                              onChange={() => field.onChange(value)}
                              name={field.name}
                            />
                            <span className={styles.choiceCheck} aria-hidden="true">
                              <span className={styles.choiceCheckInner} />
                            </span>
                            <span className={styles.choiceIconWrap}>
                              <Icon size={18} />
                            </span>
                            <span className={styles.choiceTitle}>{label}</span>
                            <span className={styles.choiceHint}>{description}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* SLA */}
              <div className={styles.slaSection}>
                <p className={styles.fieldLabel}>SLA Configuration</p>
                <div className={styles.row}>
                  <Input
                    label="Response Time (hours)"
                    type="number"
                    step="0.5"
                    min="0.5"
                    error={errors.responseTimeHours?.message}
                    {...register('responseTimeHours', { valueAsNumber: true })}
                  />
                  <Input
                    label="Resolution Time (hours)"
                    type="number"
                    step="1"
                    min="1"
                    error={errors.resolutionTimeHours?.message}
                    {...register('resolutionTimeHours', { valueAsNumber: true })}
                  />
                </div>
              </div>

              {/* Teams Webhook */}
              <Input
                label="Teams Webhook URL"
                placeholder="https://hooks.teams.microsoft.com/..."
                error={errors.teamsWebhook?.message}
                {...register('teamsWebhook')}
              />

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  leftIcon={<Save size={14} />}
                  loading={isSubmitting}
                  disabled={!isDirty}
                >
                  Save Changes
                </Button>
              </div>
            </form>
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
