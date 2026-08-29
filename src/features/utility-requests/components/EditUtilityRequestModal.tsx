import { useEffect, useState, type ReactElement } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Input } from '../../../components/ui/index.js';
import { Textarea } from '../../../components/ui/index.js';
import { Select } from '../../../components/ui/index.js';
import type { UtilityRequest } from '../../../types/index.js';
import { getUtilityById } from '../../../mocks/utilities.js';
import { editUtilityRequestSchema } from '../schemas.js';
import type { EditUtilityRequestFormData } from '../schemas.js';
import { START_TIME_OPTIONS, DURATION_OPTIONS, computeEndTime } from '../timeOptions.js';

function minutesBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function closestDuration(minutes: number): string {
  if (minutes <= 0) return '';
  const closest = DURATION_OPTIONS.reduce((best, opt) =>
    Math.abs(Number(opt.value) - minutes) < Math.abs(Number(best.value) - minutes) ? opt : best,
  );
  return closest.value;
}

interface EditUtilityRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: UtilityRequest;
  onSave: (data: EditUtilityRequestFormData) => void;
}

export function EditUtilityRequestModal({
  isOpen,
  onClose,
  request,
  onSave,
}: EditUtilityRequestModalProps): ReactElement {
  const utility = getUtilityById(request.utilityId);
  const optionChoices = (utility?.options ?? []).map((o) => ({ value: o.id, label: o.name }));

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditUtilityRequestFormData>({
    resolver: zodResolver(editUtilityRequestSchema),
    values: {
      utilityOptionId: request.utilityOptionId,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      details: request.details,
    },
  });

  const [duration, setDuration] = useState(() =>
    closestDuration(minutesBetween(request.startTime, request.endTime)),
  );
  const startTime = useWatch({ control, name: 'startTime' });

  useEffect(() => {
    setDuration(closestDuration(minutesBetween(request.startTime, request.endTime)));
  }, [request.id, request.startTime, request.endTime]);

  useEffect(() => {
    if (!startTime || !duration) return;
    setValue('endTime', computeEndTime(startTime, Number(duration)), { shouldValidate: true });
  }, [startTime, duration, setValue]);

  function handleClose(): void {
    reset();
    onClose();
  }

  function onSubmit(data: EditUtilityRequestFormData): void {
    onSave(data);
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Request"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-utility-request-form">
            Save Changes
          </Button>
        </>
      }
    >
      <form
        id="edit-utility-request-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <Controller
          name="utilityOptionId"
          control={control}
          render={({ field }) => (
            <Select
              label="Option"
              options={optionChoices}
              placeholder="Select an option…"
              error={errors.utilityOptionId?.message}
              {...field}
            />
          )}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <Select
                label="Start Time"
                options={START_TIME_OPTIONS}
                placeholder="Select a start time…"
                error={errors.startTime?.message}
                {...field}
              />
            )}
          />
          <Select
            label="Duration"
            options={DURATION_OPTIONS}
            placeholder="Select a duration…"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            error={errors.endTime?.message}
          />
        </div>

        <Textarea
          label="Details"
          rows={4}
          error={errors.details?.message}
          {...register('details')}
        />
      </form>
    </Modal>
  );
}
