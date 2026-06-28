import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw, BellRing } from 'lucide-react';
import { Modal } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Input } from '../../../components/ui/index.js';
import { Textarea } from '../../../components/ui/index.js';
import { Select } from '../../../components/ui/index.js';
import { useUIStore } from '../../../store/uiStore.js';
import { departmentsApi } from '../../../api/departments.js';
import { usersApi } from '../../../api/users.js';
import { createDepartmentSchema } from '../schemas.js';
import type { CreateDepartmentFormData } from '../schemas.js';
import styles from './CreateDepartmentModal.module.css';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

export function CreateDepartmentModal({ isOpen, onClose, onSuccess }: CreateDepartmentModalProps): ReactElement {
  const addToast = useUIStore((s) => s.addToast);
  const [deptHeadOptions, setDeptHeadOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    void usersApi.list({ role: 'dept_head', limit: 200 }).then((res) => {
      setDeptHeadOptions(res.data.map((u) => ({ value: u.id, label: u.name })));
    });
    // Also fetch root_admins separately and merge
    void usersApi.list({ role: 'root_admin', limit: 200 }).then((res) => {
      setDeptHeadOptions((prev) => {
        const existingIds = new Set(prev.map((o) => o.value));
        const extra = res.data
          .filter((u) => !existingIds.has(u.id))
          .map((u) => ({ value: u.id, label: u.name }));
        return [...prev, ...extra];
      });
    });
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
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

  const nameValue = useWatch({ control, name: 'name' });
  useEffect(() => {
    const generated = nameValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setValue('slug', generated, { shouldValidate: false });
  }, [nameValue, setValue]);

  function handleClose(): void {
    reset();
    onClose();
  }

  async function onSubmit(data: CreateDepartmentFormData): Promise<void> {
    try {
      await departmentsApi.create({
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
      addToast({ type: 'success', message: 'Department created successfully' });
      reset();
      onSuccess ? onSuccess() : onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create department';
      addToast({ type: 'error', message });
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" form="create-dept-form" loading={isSubmitting}>
        Create Department
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Department"
      size="lg"
      footer={footer}
    >
      <form
        id="create-dept-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        noValidate
      >
        {/* Department Name */}
        <Input
          label="Department Name"
          placeholder="e.g. Engineering"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Slug */}
        <Input
          label="Slug"
          placeholder="e.g. engineering"
          error={errors.slug?.message}
          {...register('slug')}
        />

        {/* Description */}
        <Textarea
          label="Department Description"
          placeholder="Describe what this department handles..."
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

        {/* Routing Type — choice cards */}
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

        {/* SLA Configuration */}
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>SLA Configuration</p>
          <p className={styles.sectionDesc}>
            Set response and resolution time targets for tickets in this department.
          </p>
        </div>

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

        {/* Teams Webhook */}
        <Input
          label="Teams Webhook URL"
          placeholder="https://hooks.teams.microsoft.com/..."
          error={errors.teamsWebhook?.message}
          {...register('teamsWebhook')}
        />
      </form>
    </Modal>
  );
}
