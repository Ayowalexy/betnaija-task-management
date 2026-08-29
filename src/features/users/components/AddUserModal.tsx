import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Input } from '../../../components/ui/index.js';
import { Select } from '../../../components/ui/index.js';
import { useUIStore } from '../../../store/uiStore.js';
import { departmentsApi } from '../../../api/departments.js';
import { usersApi } from '../../../api/users.js';
import { createUserSchema } from '../schemas.js';
import type { CreateUserFormData } from '../schemas.js';
import type { Department } from '../../../types/index.js';
import styles from './AddUserModal.module.css';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const roleOptions = [
  { value: 'root_admin', label: 'Root Admin' },
  { value: 'dept_head', label: 'Dept Head' },
  { value: 'team_member', label: 'Team Member' },
];

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps): ReactElement {
  const addToast = useUIStore((s) => s.addToast);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    void departmentsApi.list({ limit: 200 }).then((res) => setDepartments(res.data));
  }, [isOpen]);

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', role: 'team_member', departmentId: '' },
  });

  const selectedRole = useWatch({ control, name: 'role' });
  const isRootAdmin = selectedRole === 'root_admin';

  function handleClose(): void {
    reset();
    onClose();
  }

  async function onSubmit(data: CreateUserFormData): Promise<void> {
    try {
      await usersApi.create({
        name: data.name,
        email: data.email,
        role: data.role,
        departmentId: isRootAdmin ? null : (data.departmentId || null),
        temporaryPassword: crypto.randomUUID().slice(0, 12),
      });
      addToast({ type: 'success', message: 'User added' });
      reset();
      onSuccess ? onSuccess() : onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      addToast({ type: 'error', message });
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" form="add-user-form" loading={isSubmitting}>
        Add User
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add User" size="md" footer={footer}>
      <form id="add-user-form" onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="Full Name"
          placeholder="e.g. Amaka Osei"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="user@bet9ja.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Select
          label="Role"
          options={roleOptions}
          error={errors.role?.message}
          {...register('role')}
        />
        <Select
          label="Department"
          placeholder={isRootAdmin ? 'N/A (Root Admin)' : 'Select a department'}
          options={deptOptions}
          disabled={isRootAdmin}
          error={errors.departmentId?.message}
          {...register('departmentId')}
        />
      </form>
    </Modal>
  );
}
