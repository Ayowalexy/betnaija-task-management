import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
import { format } from 'date-fns';
import { Search, UserPlus, MoreVertical, Mail, Building2, Calendar, Clock } from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Button, Input, Select, Avatar, Dropdown, Modal, Badge, getStatusVariant } from '../../../components/ui/index.js';
import { DataTable } from '../../../components/shared/DataTable.js';
import type { Column } from '../../../components/shared/DataTable.js';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { USERS } from '../../../mocks/users.js';
import { DEPARTMENTS } from '../../../mocks/departments.js';
import { TICKETS } from '../../../mocks/tickets.js';
import { useToast } from '../../../hooks/useToast.js';
import { useModal } from '../../../hooks/useModal.js';
import type { User } from '../../../types/index.js';
import { UserStatusBadge } from './UserStatusBadge.js';
import { AddUserModal } from './AddUserModal.js';
import styles from './UsersPage.module.css';

function formatRole(role: User['role']): string {
  switch (role) {
    case 'root_admin': return 'Root Admin';
    case 'dept_head': return 'Dept Head';
    case 'team_member': return 'Team Member';
  }
}

function getDeptName(deptId: string | null): string {
  if (!deptId) return 'N/A';
  return DEPARTMENTS.find((d) => d.id === deptId)?.name ?? 'N/A';
}

function formatStatus(s: string): string {
  return s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
}

function UserDetailModal({ user, onClose }: UserDetailModalProps): ReactElement | null {
  if (!user) return null;
  const userTickets = TICKETS.filter((t) => t.requestorId === user.id);
  const shown = userTickets.slice(0, 5);

  return (
    <Modal isOpen title={user.name} onClose={onClose} size="lg">
      <div className={styles.detailTop}>
        <Avatar initials={user.avatarInitials} color={user.avatarColor} size="lg" name={user.name} online={user.isOnline} />
        <div className={styles.detailMeta}>
          <span className={styles.detailName}>{user.name}</span>
          <div className={styles.detailBadges}>
            <Badge variant="info" size="sm">{formatRole(user.role)}</Badge>
            <UserStatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}><Mail size={13} className={styles.infoIcon} /><div><span className={styles.infoLabel}>Email</span><span className={styles.infoValue}>{user.email}</span></div></div>
        <div className={styles.infoItem}><Building2 size={13} className={styles.infoIcon} /><div><span className={styles.infoLabel}>Department</span><span className={styles.infoValue}>{getDeptName(user.departmentId)}</span></div></div>
        <div className={styles.infoItem}><Calendar size={13} className={styles.infoIcon} /><div><span className={styles.infoLabel}>Date Joined</span><span className={styles.infoValue}>{format(new Date(user.joinDate), 'MMM d, yyyy')}</span></div></div>
        <div className={styles.infoItem}><Clock size={13} className={styles.infoIcon} /><div><span className={styles.infoLabel}>Last Login</span><span className={styles.infoValue}>{user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a') : 'Never'}</span></div></div>
      </div>

      <div className={styles.ticketsSection}>
        <h4 className={styles.ticketsSectionTitle}>Tickets Raised <span className={styles.ticketCount}>{userTickets.length}</span></h4>
        {shown.length === 0 ? (
          <p className={styles.noTickets}>No tickets raised yet.</p>
        ) : (
          <div className={styles.ticketList}>
            {shown.map((t) => (
              <div key={t.id} className={styles.ticketRow}>
                <span className={styles.ticketTitle}>{t.title}</span>
                <div className={styles.ticketMeta}>
                  <Badge variant={getStatusVariant(t.status)} size="sm">{formatStatus(t.status)}</Badge>
                  <span className={styles.ticketDate}>{format(new Date(t.createdAt), 'MMM d')}</span>
                </div>
              </div>
            ))}
            {userTickets.length > 5 && (
              <p className={styles.viewAll}>+ {userTickets.length - 5} more tickets</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export function UsersPage(): ReactElement {
  const { toast } = useToast();
  const addModal = useModal();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const deptOptions = [
    { value: '', label: 'All Departments' },
    ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
  ];
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'root_admin', label: 'Root Admin' },
    { value: 'dept_head', label: 'Dept Head' },
    { value: 'team_member', label: 'Team Member' },
  ];
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return USERS.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (deptFilter && u.departmentId !== deptFilter) return false;
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      return true;
    });
  }, [search, deptFilter, roleFilter, statusFilter]);

  const suspendTarget = USERS.find((u) => u.id === suspendUserId);

  function handleSuspend(): void {
    if (!suspendTarget) return;
    toast({ type: 'success', message: `User ${suspendTarget.status === 'active' ? 'suspended' : 'activated'}` });
    setSuspendUserId(null);
  }

  function handleResetPassword(): void {
    toast({ type: 'success', message: 'Password reset email sent' });
    setResetUserId(null);
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (u) => (
        <button className={styles.nameCell} onClick={() => setDetailUser(u)}>
          <Avatar initials={u.avatarInitials} color={u.avatarColor} size="sm" name={u.name} online={u.isOnline} />
          <div className={styles.nameMeta}>
            <span className={styles.nameText}>{u.name}</span>
            <span className={styles.emailText}>{u.email}</span>
          </div>
        </button>
      ),
    },
    { key: 'department', header: 'Department', render: (u) => getDeptName(u.departmentId) },
    { key: 'role', header: 'Role', sortable: true, render: (u) => formatRole(u.role) },
    { key: 'status', header: 'Status', render: (u) => <UserStatusBadge status={u.status} /> },
    { key: 'lastLogin', header: 'Last Login', render: (u) => u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, yyyy') : 'Never' },
    { key: 'joinDate', header: 'Date Joined', sortable: true, render: (u) => format(new Date(u.joinDate), 'MMM d, yyyy') },
    {
      key: 'actions',
      header: '',
      width: '48px',
      render: (u) => (
        <Dropdown
          align="right"
          trigger={<Button variant="ghost" size="sm" aria-label="User actions"><MoreVertical size={15} /></Button>}
          items={[
            { label: 'View Profile', onClick: () => setDetailUser(u) },
            { label: 'Edit Role', onClick: () => {}, dividerAfter: true },
            { label: u.status === 'active' ? 'Suspend User' : 'Activate User', onClick: () => setSuspendUserId(u.id) },
            { label: 'Reset Password', onClick: () => setResetUserId(u.id), dividerAfter: true },
          ]}
        />
      ),
    },
  ];

  return (
    <PageWrapper title="Users" subtitle="Manage user accounts, roles, and permissions" actions={<Button leftIcon={<UserPlus size={16} />} onClick={addModal.open}>Add User</Button>}>
      <div className={styles.toolbar}>
        <Input placeholder="Search by name or email…" leftIcon={<Search size={15} />} value={search} onChange={(e) => setSearch(e.target.value)} wrapperClassName={styles.searchWrap} />
        <Select options={deptOptions} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} wrapperClassName={styles.filterSelect} />
        <Select options={roleOptions} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} wrapperClassName={styles.filterSelect} />
        <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} wrapperClassName={styles.filterSelect} />
      </div>

      <DataTable<User>
        columns={columns}
        data={filtered}
        keyExtractor={(u) => u.id}
        pageSize={10}
        emptyState={<EmptyState title="No users found" description={search ? 'Try adjusting your search.' : 'No users have been added yet.'} />}
      />

      <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      <AddUserModal isOpen={addModal.isOpen} onClose={addModal.close} />

      <ConfirmDialog
        isOpen={!!suspendUserId}
        onClose={() => setSuspendUserId(null)}
        onConfirm={handleSuspend}
        title={suspendTarget?.status === 'active' ? 'Suspend User' : 'Activate User'}
        description={suspendTarget?.status === 'active' ? `Suspend ${suspendTarget?.name}? They will lose access immediately.` : `Reactivate ${suspendTarget?.name}? They will regain access.`}
        confirmLabel={suspendTarget?.status === 'active' ? 'Suspend' : 'Activate'}
        danger={suspendTarget?.status === 'active'}
      />
      <ConfirmDialog
        isOpen={!!resetUserId}
        onClose={() => setResetUserId(null)}
        onConfirm={handleResetPassword}
        title="Reset Password"
        description="Send a password reset email to this user?"
        confirmLabel="Send Reset Email"
      />
    </PageWrapper>
  );
}
