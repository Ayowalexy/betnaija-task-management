import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, ChevronLeft } from 'lucide-react';
import { Input } from '../../../components/ui/index.js';
import { Textarea } from '../../../components/ui/index.js';
import { Select } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Modal } from '../../../components/ui/index.js';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { useUtilityRequestStore } from '../../../store/utilityRequestStore.js';
import { useUtilityStore } from '../../../store/utilityStore.js';
import { useAuthStore } from '../../../store/authStore.js';
import { useToast } from '../../../hooks/useToast.js';
import { useModal } from '../../../hooks/useModal.js';
import { getDeptById, getDepartmentsForUtility } from '../../../mocks/departments.js';
import { getUtilityById } from '../../../mocks/utilities.js';
import type { UtilityRequest } from '../../../types/index.js';
import { createUtilityRequestSchema } from '../schemas.js';
import type { CreateUtilityRequestFormData } from '../schemas.js';
import { START_TIME_OPTIONS, DURATION_OPTIONS, computeEndTime, formatTimeLabel } from '../timeOptions.js';
import styles from './CreateUtilityRequestPage.module.css';

interface UtilityPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  data: Partial<CreateUtilityRequestFormData>;
  isSubmitting: boolean;
}

function UtilityRequestPreview({ isOpen, onClose, onSubmit, data, isSubmitting }: UtilityPreviewProps) {
  const utility = data.utilityId ? getUtilityById(data.utilityId) : null;
  const option = utility?.options.find((o) => o.id === data.utilityOptionId);
  const dept = data.departmentId ? getDeptById(data.departmentId) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preview Request"
      size="md"
      footer={
        <div className={styles.previewFooter}>
          <Button type="button" variant="secondary" onClick={onClose}>
            <ChevronLeft size={16} /> Back to Edit
          </Button>
          <Button type="button" loading={isSubmitting} onClick={onSubmit}>
            Submit Request
          </Button>
        </div>
      }
    >
      <div className={styles.previewBody}>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Utility</span>
          <span className={styles.previewValue}>{utility?.name || '—'}</span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Option</span>
          <span className={styles.previewValue}>{option?.name || '—'}</span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Department</span>
          <span className={styles.previewValue}>{dept?.name || '—'}</span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Date</span>
          <span className={styles.previewValue}>{data.date || '—'}</span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Time</span>
          <span className={styles.previewValue}>
            {data.startTime ? formatTimeLabel(data.startTime) : '—'} – {data.endTime ? formatTimeLabel(data.endTime) : '—'}
          </span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Details</span>
          <span className={styles.previewValue}>{data.details || '—'}</span>
        </div>
      </div>
    </Modal>
  );
}

export function CreateUtilityRequestPage() {
  const navigate = useNavigate();
  const addRequest = useUtilityRequestStore((s) => s.addRequest);
  const utilities = useUtilityStore((s) => s.utilities);
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();
  const previewModal = useModal();

  const availableUtilities = React.useMemo(
    () => utilities.filter((u) => u.status === 'active' && getDepartmentsForUtility(u.id).length > 0),
    [utilities],
  );
  const utilityOptions = availableUtilities.map((u) => ({ value: u.id, label: u.name }));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUtilityRequestFormData>({
    resolver: zodResolver(createUtilityRequestSchema),
    defaultValues: {
      utilityId: '',
      departmentId: '',
      utilityOptionId: '',
      date: '',
      startTime: '',
      endTime: '',
      details: '',
    },
  });

  const [duration, setDuration] = React.useState('');

  const watchedValues = useWatch({ control });
  const selectedUtilityId = watchedValues.utilityId ?? '';
  const selectedUtility = selectedUtilityId ? getUtilityById(selectedUtilityId) : null;
  const departmentsForUtility = selectedUtilityId ? getDepartmentsForUtility(selectedUtilityId) : [];
  const optionChoices = (selectedUtility?.options ?? []).map((o) => ({ value: o.id, label: o.name }));
  const startTime = watchedValues.startTime ?? '';

  const prevUtilityIdRef = React.useRef(selectedUtilityId);

  React.useEffect(() => {
    if (prevUtilityIdRef.current === selectedUtilityId) return;
    prevUtilityIdRef.current = selectedUtilityId;
    setValue('utilityOptionId', '');
    const depts = selectedUtilityId ? getDepartmentsForUtility(selectedUtilityId) : [];
    setValue('departmentId', depts.length === 1 ? depts[0].id : '');
  }, [selectedUtilityId, setValue]);

  React.useEffect(() => {
    if (!startTime || !duration) {
      setValue('endTime', '');
      return;
    }
    setValue('endTime', computeEndTime(startTime, Number(duration)), { shouldValidate: true });
  }, [startTime, duration, setValue]);

  function onSubmit(data: CreateUtilityRequestFormData) {
    if (!currentUser) return;
    const id = `ur${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newRequest: UtilityRequest = {
      id,
      utilityId: data.utilityId,
      utilityOptionId: data.utilityOptionId,
      departmentId: data.departmentId,
      requestorId: currentUser.id,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      details: data.details,
      status: 'pending',
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
      comments: [],
      log: [
        {
          id: `url-${id}-1`,
          timestamp: now,
          actorId: currentUser.id,
          action: 'created',
          note: null,
        },
      ],
    };
    addRequest(newRequest);
    toast({ type: 'success', message: 'Utility request submitted.' });
    previewModal.close();
    navigate(`/utility-requests/${id}`);
  }

  return (
    <PageWrapper title="New Utility Request" subtitle="Request the use of an organization utility">
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Request a Utility</h1>
            <p className={styles.cardSubtitle}>Pick a utility, choose an option, and enter when you need it</p>
          </div>
          <hr className={styles.divider} />

          <form className={styles.formBody} noValidate>
            <Controller
              name="utilityId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Utility *"
                  options={utilityOptions}
                  placeholder="Select a utility…"
                  error={errors.utilityId?.message}
                  {...field}
                />
              )}
            />

            {selectedUtilityId && (
              <div className={styles.twoCol}>
                <Controller
                  name="utilityOptionId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Option *"
                      options={optionChoices}
                      placeholder="Select an option…"
                      error={errors.utilityOptionId?.message}
                      {...field}
                    />
                  )}
                />
                {departmentsForUtility.length > 1 ? (
                  <Controller
                    name="departmentId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Department *"
                        options={departmentsForUtility.map((d) => ({ value: d.id, label: d.name }))}
                        placeholder="Select a department…"
                        error={errors.departmentId?.message}
                        {...field}
                      />
                    )}
                  />
                ) : (
                  <div className={styles.deptReadonly}>
                    <span className={styles.deptReadonlyLabel}>Department</span>
                    <span className={styles.deptReadonlyValue}>
                      {departmentsForUtility[0]?.name ?? '—'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className={styles.threeCol}>
              <Input
                label="Date *"
                type="date"
                error={errors.date?.message}
                {...register('date')}
              />
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Start Time *"
                    options={START_TIME_OPTIONS}
                    placeholder="Select a start time…"
                    error={errors.startTime?.message}
                    {...field}
                  />
                )}
              />
              <Select
                label="Duration *"
                options={DURATION_OPTIONS}
                placeholder="Select a duration…"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                error={errors.endTime?.message}
              />
            </div>

            {startTime && duration && (
              <div className={styles.deptReadonly}>
                <span className={styles.deptReadonlyLabel}>Ends at</span>
                <span className={styles.deptReadonlyValue}>{formatTimeLabel(computeEndTime(startTime, Number(duration)))}</span>
              </div>
            )}

            <Textarea
              label="Details *"
              placeholder="Add any extra details the approver should know…"
              rows={4}
              error={errors.details?.message}
              {...register('details')}
            />

            <div className={styles.formFooter}>
              <Button type="button" variant="secondary" onClick={() => navigate('/utility-requests')}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit((_data) => previewModal.open())}>
                <Eye size={16} /> Preview &amp; Submit
              </Button>
            </div>
          </form>
        </div>
      </div>

      <UtilityRequestPreview
        isOpen={previewModal.isOpen}
        onClose={previewModal.close}
        onSubmit={handleSubmit(onSubmit)}
        data={watchedValues}
        isSubmitting={isSubmitting}
      />
    </PageWrapper>
  );
}
