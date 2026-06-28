import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { format } from 'date-fns';
import { Search, UserPlus, MoreVertical, Mail, Building2, Calendar, Clock } from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Button, Input, Select, Avatar, Dropdown, Modal, Badge } from '../../../components/ui/index.js';
import { DataTable } from '../../../components/shared/DataTable.js';
import type { Column } from '../../../components/shared/DataTable.js';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { useUIStore } from '../../../store/uiStore.js';
import { useModal } from '../../../hooks/useModal.js';
import { useAuthStore } from '../../../store/authStore.js';
import { usersApi } from '../../../api/users.js';
import { departmentsApi } from '../../../api/departments.js';
import type { User, Department } from '../../../types/index.js';
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


interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  getDeptName: (id: string | null) => string;
}

function UserDetailModal({ user, onClose, getDeptName }: UserDetailModalProps): ReactElement | null {
  if (!user) return null;

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
    </Modal>
  );
}

export function UsersPage(): ReactElement {
  const addToast = useUIStore((s) => s.addToast);
  const addModal = useModal();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === 'root_admin';
  const isDeptHead = currentUser?.role === 'dept_head';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const PAGE_LIMIT = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await usersApi.list({
        search: search || undefined,
        departmentId: isDeptHead && currentUser?.departmentId
          ? currentUser.departmentId
          : deptFilter || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: PAGE_LIMIT,
      });
      setUsers(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      addToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, roleFilter, statusFilter, page, addToast, isDeptHead, currentUser?.departmentId]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, deptFilter, roleFilter, statusFilter]);

  useEffect(() => {
    void departmentsApi.list({ limit: 200 }).then((res) => setDepartments(res.data));
  }, []);

  function getDeptName(deptId: string | null): string {
    if (!deptId) return 'N/A';
    return departments.find((d) => d.id === deptId)?.name ?? 'N/A';
  }

  const deptOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
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

  const suspendTarget = users.find((u) => u.id === suspendUserId);

  async function handleSuspend(): Promise<void> {
    if (!suspendTarget) return;
    try {
      const newStatus = suspendTarget.status === 'active' ? 'suspended' : 'active';
      await usersApi.update(suspendTarget.id, { status: newStatus });
      addToast({ type: 'success', message: `User ${suspendTarget.status === 'active' ? 'suspended' : 'activated'}` });
      setSuspendUserId(null);
      void fetchUsers();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update user status' });
    }
  }

  async function handleResetPassword(): Promise<void> {
    if (!resetUserId) return;
    try {
      await usersApi.resetPassword(resetUserId, crypto.randomUUID().slice(0, 12));
      addToast({ type: 'success', message: 'Password reset email sent' });
      setResetUserId(null);
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to reset password' });
    }
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
    ...(isAdmin ? [{ key: 'department' as const, header: 'Department', render: (u: User) => getDeptName(u.departmentId) }] : []),
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
    <PageWrapper
      title="Users"
      subtitle="Manage user accounts, roles, and permissions"
      actions={isAdmin ? <Button leftIcon={<UserPlus size={16} />} onClick={addModal.open}>Add User</Button> : undefined}
    >
      <div className={styles.toolbar}>
        <Input placeholder="Search by name or email…" leftIcon={<Search size={15} />} value={search} onChange={(e) => setSearch(e.target.value)} wrapperClassName={styles.searchWrap} />
        {isAdmin && <Select options={deptOptions} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} wrapperClassName={styles.filterSelect} />}
        <Select options={roleOptions} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} wrapperClassName={styles.filterSelect} />
        <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} wrapperClassName={styles.filterSelect} />
      </div>

      <DataTable<User>
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        pageSize={PAGE_LIMIT}
        emptyState={
          loading
            ? <EmptyState title="Loading users…" description="Please wait." />
            : <EmptyState title="No users found" description={search ? 'Try adjusting your search.' : 'No users have been added yet.'} />
        }
      />

      <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} getDeptName={getDeptName} />
      <AddUserModal isOpen={addModal.isOpen} onClose={addModal.close} onSuccess={() => void fetchUsers()} />

      <ConfirmDialog
        isOpen={!!suspendUserId}
        onClose={() => setSuspendUserId(null)}
        onConfirm={() => void handleSuspend()}
        title={suspendTarget?.status === 'active' ? 'Suspend User' : 'Activate User'}
        description={suspendTarget?.status === 'active' ? `Suspend ${suspendTarget?.name}? They will lose access immediately.` : `Reactivate ${suspendTarget?.name}? They will regain access.`}
        confirmLabel={suspendTarget?.status === 'active' ? 'Suspend' : 'Activate'}
        danger={suspendTarget?.status === 'active'}
      />
      <ConfirmDialog
        isOpen={!!resetUserId}
        onClose={() => setResetUserId(null)}
        onConfirm={() => void handleResetPassword()}
        title="Reset Password"
        description="Send a password reset email to this user?"
        confirmLabel="Send Reset Email"
      />
    </PageWrapper>
  );
}
