import type { ReactElement } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/index.js';
import { Button } from '@/components/ui/index.js';
import { Input } from '@/components/ui/index.js';
import { Textarea } from '@/components/ui/index.js';
import { Select } from '@/components/ui/index.js';
import { Checkbox } from '@/components/ui/index.js';
import { useToast } from '@/hooks/useToast.js';
import { utilitiesApi } from '@/api/utilities.js';
import type { CalendarProvider, CalendarSyncMode } from '@/types/index.js';
import { createUtilitySchema } from '../schemas.js';
import type { CreateUtilityFormData } from '../schemas.js';
import styles from './CreateUtilityModal.module.css';

interface CreateUtilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google Calendar' },
  { value: 'outlook', label: 'Microsoft Outlook / 365' },
  { value: 'ics', label: 'Other (iCal / ICS feed)' },
];

const SYNC_MODE_OPTIONS = [
  { value: 'meeting', label: 'Create a meeting & invite attendees (shows on their availability)' },
  { value: 'event', label: 'Create a calendar event/block only' },
];

export function CreateUtilityModal({ isOpen, onClose, onSuccess }: CreateUtilityModalProps): ReactElement {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUtilityFormData>({
    resolver: zodResolver(createUtilitySchema),
    defaultValues: {
      name: '',
      description: '',
      options: [{ name: '' }],
      calendarEnabled: false,
      calendarProvider: '',
      calendarAddress: '',
      calendarSyncMode: '',
    },
  });

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: 'options',
  });

  const calendarEnabled = useWatch({ control, name: 'calendarEnabled' });

  function handleClose(): void {
    reset();
    onClose();
  }

  async function onSubmit(data: CreateUtilityFormData): Promise<void> {
    try {
      await utilitiesApi.create({
        name: data.name,
        description: data.description,
        options: data.options.map((opt) => ({ name: opt.name })),
        calendarEnabled: data.calendarEnabled,
        calendarProvider: data.calendarEnabled ? (data.calendarProvider as CalendarProvider) : undefined,
        calendarAddress: data.calendarEnabled ? data.calendarAddress : undefined,
        calendarSyncMode: data.calendarEnabled ? (data.calendarSyncMode as CalendarSyncMode) : undefined,
      });
      toast({ type: 'success', message: 'Utility created successfully' });
      reset();
      onSuccess ? onSuccess() : onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create utility';
      toast({ type: 'error', message });
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button type="submit" form="create-utility-form" loading={isSubmitting}>
        Create Utility
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Utility"
      size="lg"
      footer={footer}
    >
      <form
        id="create-utility-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        noValidate
      >
        {/* Utility Name */}
        <Input
          label="Utility Name"
          placeholder="e.g. Meeting Rooms"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Describe what this utility is used for..."
          rows={2}
          {...register('description')}
        />

        {/* Options */}
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Options</p>
          <p className={styles.sectionDesc}>
            Add the individual items requesters can choose from, e.g. Meeting Room 1, Meeting Room 2.
          </p>
        </div>

        <div className={styles.optionList}>
          {optionFields.map((field, index) => (
            <div key={field.id} className={styles.optionRow}>
              <Input
                placeholder={`Option ${index + 1}, e.g. Meeting Room ${index + 1}`}
                error={errors.options?.[index]?.name?.message}
                {...register(`options.${index}.name`)}
              />
              <button
                type="button"
                className={styles.optionRemove}
                onClick={() => removeOption(index)}
                disabled={optionFields.length === 1}
                aria-label={`Remove option ${index + 1}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {errors.options?.message && <span className={styles.arrayError}>{errors.options.message}</span>}

        <Button type="button" variant="secondary" size="sm" onClick={() => appendOption({ name: '' })}>
          <Plus size={14} /> Add Option
        </Button>

        {/* Calendar Integration */}
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Calendar Integration</p>
          <p className={styles.sectionDesc}>
            Optional. Sync bookings of this utility to a calendar so everyone involved can see availability.
          </p>
        </div>

        <Controller
          name="calendarEnabled"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Enable calendar integration"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />

        {calendarEnabled && (
          <div className={styles.calendarFields}>
            <Controller
              name="calendarProvider"
              control={control}
              render={({ field }) => (
                <Select
                  label="Calendar Provider"
                  placeholder="Select provider"
                  options={PROVIDER_OPTIONS}
                  error={errors.calendarProvider?.message}
                  {...field}
                />
              )}
            />

            <Input
              label="Calendar Address / ID"
              placeholder="e.g. meetingrooms@company.com"
              error={errors.calendarAddress?.message}
              {...register('calendarAddress')}
            />

            <Controller
              name="calendarSyncMode"
              control={control}
              render={({ field }) => (
                <Select
                  label="Sync Behavior"
                  placeholder="Select sync behavior"
                  options={SYNC_MODE_OPTIONS}
                  error={errors.calendarSyncMode?.message}
                  {...field}
                />
              )}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
