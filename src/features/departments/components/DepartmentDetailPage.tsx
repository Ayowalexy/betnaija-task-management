import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw, BellRing, UserPlus, Trash2, Save, Users, Ticket, Plus, Pencil } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper.js';
import { Tabs } from '@/components/ui/index.js';
import { Button } from '@/components/ui/index.js';
import { Badge } from '@/components/ui/index.js';
import { Avatar } from '@/components/ui/index.js';
import { Input } from '@/components/ui/index.js';
import { Textarea } from '@/components/ui/index.js';
import { Modal } from '@/components/ui/index.js';
import { Select } from '@/components/ui/index.js';
import { Checkbox } from '@/components/ui/index.js';
import { DataTable } from '@/components/shared/DataTable.js';
import type { Column } from '@/components/shared/DataTable.js';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { useUIStore } from '@/store/uiStore.js';
import { useModal } from '@/hooks/useModal.js';
import { departmentsApi } from '@/api/departments.js';
import type { CreateRequestTypePayload } from '@/api/departments.js';
import { usersApi } from '@/api/users.js';
import { ticketsApi } from '@/api/tickets.js';
import { utilitiesApi } from '@/api/utilities.js';
import { createDepartmentSchema } from '../schemas.js';
import type { CreateDepartmentFormData } from '../schemas.js';
import type { Ticket as TicketType, Department, User, RequestType, Utility, TicketPriority } from '@/types/index.js';
import { getStatusVariant, getPriorityVariant } from '@/components/ui/index.js';
import styles from './DepartmentDetailPage.module.css';

const PRIORITY_OPTIONS = [
  { value: 'low', label: '● Low' },
  { value: 'medium', label: '● Medium' },
  { value: 'high', label: '● High' },
  { value: 'critical', label: '● Critical' },
];

interface RequestTypeFormState {
  name: string;
  description: string;
  priority: TicketPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
}

function toPayload(f: RequestTypeFormState): CreateRequestTypePayload {
  return {
    name: f.name,
    description: f.description,
    priority: f.priority,
    sla: {
      responseTimeMs: f.responseTimeHours * 60 * 60 * 1000,
      resolutionTimeMs: f.resolutionTimeHours * 60 * 60 * 1000,
    },
  };
}

interface RequestTypeRowProps {
  requestType: RequestType;
  onSave: (id: string, payload: CreateRequestTypePayload) => Promise<void>;
  onRemove: (id: string) => void;
}

function requestTypeToForm(requestType: RequestType): RequestTypeFormState {
  return {
    name: requestType.name,
    description: requestType.description,
    priority: requestType.priority,
    responseTimeHours: msToHours(requestType.sla.responseTimeMs),
    resolutionTimeHours: msToHours(requestType.sla.resolutionTimeMs),
  };
}

function RequestTypeRow({ requestType, onSave, onRemove }: RequestTypeRowProps) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState({ form: requestTypeToForm(requestType), saving: false });
  const { form, saving } = state;

  function setForm(updater: (f: RequestTypeFormState) => RequestTypeFormState) {
    setState((s) => ({ ...s, form: updater(s.form) }));
  }

  function resetForm() {
    setState((s) => ({ ...s, form: requestTypeToForm(requestType) }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.description.trim()) return;
    setState((s) => ({ ...s, saving: true }));
    try {
      await onSave(requestType.id, toPayload(form));
      setEditing(false);
    } finally {
      setState((s) => ({ ...s, saving: false }));
    }
  }

  if (editing) {
    return (
      <div className={styles.requestTypeCard}>
        <div className={styles.row}>
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}
          />
        </div>
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className={styles.row}>
          <Input
            label="Response Time (hours)"
            type="number"
            step="0.5"
            min="0.5"
            value={form.responseTimeHours}
            onChange={(e) => setForm((f) => ({ ...f, responseTimeHours: Number(e.target.value) }))}
          />
          <Input
            label="Resolution Time (hours)"
            type="number"
            step="1"
            min="1"
            value={form.resolutionTimeHours}
            onChange={(e) => setForm((f) => ({ ...f, resolutionTimeHours: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.formActions}>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); resetForm(); }} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" leftIcon={<Save size={14} />} loading={saving} onClick={() => void handleSave()}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.requestTypeCard}>
      <div className={styles.requestTypeCardHeader}>
        <div>
          <span className={styles.requestTypeName}>{requestType.name}</span>
          <Badge variant={getPriorityVariant(requestType.priority)} size="sm">{requestType.priority}</Badge>
        </div>
        <div className={styles.requestTypeActions}>
          <button type="button" className={styles.removeBtn} onClick={() => setEditing(true)} aria-label={`Edit ${requestType.name}`}>
            <Pencil size={15} />
          </button>
          <button type="button" className={styles.removeBtn} onClick={() => onRemove(requestType.id)} aria-label={`Remove ${requestType.name}`}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {requestType.description && <p className={styles.descText}>{requestType.description}</p>}
      <div className={styles.statGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Response Time</span>
          <span className={styles.statValue}>{msToHours(requestType.sla.responseTimeMs)}h</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Resolution Time</span>
          <span className={styles.statValue}>{msToHours(requestType.sla.resolutionTimeMs)}h</span>
        </div>
      </div>
    </div>
  );
}

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
  { id: 'requestTypes', label: 'Request Types' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'settings', label: 'Settings' },
];

function msToHours(ms: number): number {
  return ms / (1000 * 60 * 60);
}

const EMPTY_REQUEST_TYPE_FORM: RequestTypeFormState = {
  name: '',
  description: '',
  priority: 'medium',
  responseTimeHours: 1,
  resolutionTimeHours: 8,
};

const TAB_IDS = TABS.map((t) => t.id);
const DEFAULT_TAB = TAB_IDS[0];

interface ConfirmTarget {
  kind: 'member' | 'requestType';
  id: string;
}

export function DepartmentDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab = rawTab && TAB_IDS.includes(rawTab) ? rawTab : DEFAULT_TAB;
  function setActiveTab(tab: string): void {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  }

  const [dept, setDept] = useState<Department | null>(null);
  const [deptTickets, setDeptTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allUtilities, setAllUtilities] = useState<Utility[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');

  const [utilitiesTab, setUtilitiesTab] = useState({ selectedIds: [] as string[], saving: false });

  const [newRequestType, setNewRequestType] = useState({ form: EMPTY_REQUEST_TYPE_FORM, saving: false });

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
    // Only show the full-page loader on the very first load — mutations (add/remove member,
    // save request types/utilities, etc.) refetch in the background without unmounting the page.
    setLoading((prev) => (dept ? prev : true));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, addToast]);

  useEffect(() => {
    void fetchDept();
  }, [fetchDept]);

  useEffect(() => {
    void usersApi.list({ limit: 500 }).then((res) => setAllUsers(res.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    void ticketsApi.list({ departmentIds: [id], limit: 50 }).then((res) => setDeptTickets(res.data));
  }, [id]);

  useEffect(() => {
    void utilitiesApi.list({ status: 'active' }).then((res) => setAllUtilities(res.data));
    void departmentsApi.list({ limit: 500 }).then((res) => setAllDepartments(res.data));
  }, []);

  useEffect(() => {
    setUtilitiesTab((s) => ({ ...s, selectedIds: dept?.utilityIds ?? [] }));
  }, [dept]);

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

  async function handleRemoveMember(memberId: string): Promise<void> {
    if (!dept) return;
    try {
      await departmentsApi.removeMember(dept.id, memberId);
      setConfirmTarget(null);
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

  async function handleAddRequestType(): Promise<void> {
    if (!dept || !newRequestType.form.name.trim() || !newRequestType.form.description.trim()) return;
    setNewRequestType((s) => ({ ...s, saving: true }));
    try {
      await departmentsApi.createRequestType(dept.id, toPayload(newRequestType.form));
      setNewRequestType({ form: EMPTY_REQUEST_TYPE_FORM, saving: false });
      addToast({ type: 'success', message: 'Request type added' });
      await fetchDept();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to add request type' });
      setNewRequestType((s) => ({ ...s, saving: false }));
    }
  }

  async function handleSaveRequestType(requestTypeId: string, payload: CreateRequestTypePayload): Promise<void> {
    if (!dept) return;
    try {
      await departmentsApi.updateRequestType(dept.id, requestTypeId, payload);
      addToast({ type: 'success', message: 'Request type updated' });
      await fetchDept();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update request type' });
    }
  }

  async function handleRemoveRequestType(requestTypeId: string): Promise<void> {
    if (!dept) return;
    try {
      await departmentsApi.removeRequestType(dept.id, requestTypeId);
      setConfirmTarget(null);
      addToast({ type: 'success', message: 'Request type removed' });
      await fetchDept();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to remove request type' });
    }
  }

  async function handleSaveUtilities(): Promise<void> {
    if (!dept) return;
    setUtilitiesTab((s) => ({ ...s, saving: true }));
    try {
      const updated = await departmentsApi.update(dept.id, { utilityIds: utilitiesTab.selectedIds });
      setDept(updated);
      addToast({ type: 'success', message: 'Utilities updated' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update utilities' });
    } finally {
      setUtilitiesTab((s) => ({ ...s, saving: false }));
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
                      onClick={() => setConfirmTarget({ kind: 'member', id: member.id })}
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

      {/* ── Request Types tab ─────────────────────── */}
      {activeTab === 'requestTypes' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Request Types
              <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'var(--font-weight-normal)', marginLeft: 'var(--space-2)' }}>
                ({(dept.requestTypes ?? []).length})
              </span>
            </h3>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Add Request Type</h3>
            <div className={styles.editForm}>
              <div className={styles.row}>
                <Input
                  label="Name"
                  placeholder="e.g. VPN / Network Access"
                  value={newRequestType.form.name}
                  onChange={(e) => setNewRequestType((s) => ({ ...s, form: { ...s.form, name: e.target.value } }))}
                />
                <Select
                  label="Priority"
                  options={PRIORITY_OPTIONS}
                  value={newRequestType.form.priority}
                  onChange={(e) => setNewRequestType((s) => ({ ...s, form: { ...s.form, priority: e.target.value as TicketPriority } }))}
                />
              </div>
              <Textarea
                label="Description"
                rows={2}
                placeholder="What this request type covers"
                value={newRequestType.form.description}
                onChange={(e) => setNewRequestType((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))}
              />
              <div className={styles.row}>
                <Input
                  label="Response Time (hours)"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newRequestType.form.responseTimeHours}
                  onChange={(e) => setNewRequestType((s) => ({ ...s, form: { ...s.form, responseTimeHours: Number(e.target.value) } }))}
                />
                <Input
                  label="Resolution Time (hours)"
                  type="number"
                  step="1"
                  min="1"
                  value={newRequestType.form.resolutionTimeHours}
                  onChange={(e) => setNewRequestType((s) => ({ ...s, form: { ...s.form, resolutionTimeHours: Number(e.target.value) } }))}
                />
              </div>
              <div className={styles.formActions}>
                <Button
                  leftIcon={<Plus size={14} />}
                  loading={newRequestType.saving}
                  disabled={!newRequestType.form.name.trim() || !newRequestType.form.description.trim()}
                  onClick={() => void handleAddRequestType()}
                >
                  Add Request Type
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.requestTypeList}>
            {(dept.requestTypes ?? []).length === 0 ? (
              <EmptyState title="No request types yet" description="Add request types so requesters can pick one when filing a ticket for this department." />
            ) : (
              (dept.requestTypes ?? []).map((rt) => (
                <RequestTypeRow
                  key={rt.id}
                  requestType={rt}
                  onSave={handleSaveRequestType}
                  onRemove={(id) => setConfirmTarget({ kind: 'requestType', id })}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Utilities tab ──────────────────────────── */}
      {activeTab === 'utilities' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Utilities
              <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'var(--font-weight-normal)', marginLeft: 'var(--space-2)' }}>
                ({utilitiesTab.selectedIds.length} attached)
              </span>
            </h3>
            <Button
              size="sm"
              leftIcon={<Save size={14} />}
              loading={utilitiesTab.saving}
              disabled={JSON.stringify([...utilitiesTab.selectedIds].sort()) === JSON.stringify([...(dept.utilityIds ?? [])].sort())}
              onClick={() => void handleSaveUtilities()}
            >
              Save Changes
            </Button>
          </div>

          {allUtilities.length === 0 ? (
            <EmptyState
              title="No utilities available"
              description="Create utilities from the Utility admin page to attach them to this department."
            />
          ) : (
            <div className={styles.utilityList}>
              {allUtilities.map((utility: Utility) => {
                const checked = utilitiesTab.selectedIds.includes(utility.id);
                // Utility↔department assignment is treated as exclusive elsewhere in this app
                // (see CreateDepartmentModal's own utility step) — a utility already assigned
                // to a different department is shown but not selectable here either.
                const assignedDeptId = utility.departmentIds.find((did) => did !== dept.id);
                const assignedDeptName = assignedDeptId
                  ? allDepartments.find((d) => d.id === assignedDeptId)?.name
                  : undefined;
                const isTakenElsewhere = !!assignedDeptId;
                const description = isTakenElsewhere
                  ? `Already assigned to ${assignedDeptName ?? 'another department'}`
                  : `${utility.options.length} option${utility.options.length === 1 ? '' : 's'} · ${
                      utility.calendar.enabled ? 'Calendar synced' : 'No calendar integration'
                    }`;
                return (
                  <Checkbox
                    key={utility.id}
                    label={utility.name}
                    description={description}
                    checked={checked}
                    disabled={isTakenElsewhere}
                    onChange={(e) => {
                      setUtilitiesTab((s) => ({
                        ...s,
                        selectedIds: e.target.checked
                          ? [...s.selectedIds, utility.id]
                          : s.selectedIds.filter((uid) => uid !== utility.id),
                      }));
                    }}
                  />
                );
              })}
            </div>
          )}
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

      {/* Remove member / request type confirm */}
      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget?.kind === 'member') void handleRemoveMember(confirmTarget.id);
          if (confirmTarget?.kind === 'requestType') void handleRemoveRequestType(confirmTarget.id);
        }}
        title={confirmTarget?.kind === 'requestType' ? 'Remove Request Type' : 'Remove Member'}
        description={
          confirmTarget?.kind === 'requestType'
            ? 'Are you sure you want to remove this request type? Requesters will no longer be able to select it.'
            : 'Are you sure you want to remove this member from the department?'
        }
        confirmLabel="Remove"
        danger
      />
    </PageWrapper>
  );
}
