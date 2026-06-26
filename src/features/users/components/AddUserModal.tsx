import type { ReactElement } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Input } from '../../../components/ui/index.js';
import { Select } from '../../../components/ui/index.js';
import { useToast } from '../../../hooks/useToast.js';
import { DEPARTMENTS } from '../../../mocks/departments.js';
import { createUserSchema } from '../schemas.js';
import type { CreateUserFormData } from '../schemas.js';
import styles from './AddUserModal.module.css';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions = [
  { value: 'root_admin', label: 'Root Admin' },
  { value: 'dept_head', label: 'Dept Head' },
  { value: 'team_member', label: 'Team Member' },
];

const deptOptions = DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }));

export function AddUserModal({ isOpen, onClose }: AddUserModalProps): ReactElement {
  const { toast } = useToast();

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

  function onSubmit(_data: CreateUserFormData): void {
    toast({ type: 'success', message: 'User added' });
    handleClose();
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
          placeholder="user@flowdesk.io"
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
