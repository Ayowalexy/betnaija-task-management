import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useForm, Controller, useWatch, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw, BellRing, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/index.js';
import { Button } from '@/components/ui/index.js';
import { Input } from '@/components/ui/index.js';
import { Textarea } from '@/components/ui/index.js';
import { Select } from '@/components/ui/index.js';
import { Checkbox } from '@/components/ui/index.js';
import { StepIndicator } from '@/components/shared/StepIndicator.js';
import type { Step } from '@/components/shared/StepIndicator.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { useToast } from '@/hooks/useToast.js';
import { departmentsApi } from '@/api/departments.js';
import { usersApi } from '@/api/users.js';
import { utilitiesApi } from '@/api/utilities.js';
import type { Utility, Department } from '@/types/index.js';
import { createDepartmentSchema } from '../schemas.js';
import type { CreateDepartmentFormData } from '../schemas.js';
import styles from './CreateDepartmentModal.module.css';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: '● Low' },
  { value: 'medium', label: '● Medium' },
  { value: 'high', label: '● High' },
  { value: 'critical', label: '● Critical' },
];

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

const STEPS: Step[] = [
  { id: 'basic', label: 'Basic Details' },
  { id: 'requestTypes', label: 'Request Types' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'integrations', label: 'Integrations' },
];

// Fields validated before advancing past each step
const STEP_FIELDS: (keyof CreateDepartmentFormData)[][] = [
  ['name', 'description', 'headId', 'routing'],
  ['requestTypes'],
  ['utilityIds'],
  ['teamsWebhook'],
];

const LAST_STEP = STEPS.length - 1;

interface LookupData {
  activeUtilities: Utility[];
  departments: Department[];
  deptHeadOptions: { value: string; label: string }[];
}
const INITIAL_LOOKUPS: LookupData = { activeUtilities: [], departments: [], deptHeadOptions: [] };

interface WizardState {
  currentStep: number;
  maxStepReached: number;
}
const INITIAL_WIZARD: WizardState = { currentStep: 0, maxStepReached: 0 };

export function CreateDepartmentModal({ isOpen, onClose, onSuccess }: CreateDepartmentModalProps): ReactElement {
  const { toast } = useToast();
  const [lookups, setLookups] = useState<LookupData>(INITIAL_LOOKUPS);
  const { activeUtilities, departments, deptHeadOptions } = lookups;

  const [wizard, setWizard] = useState<WizardState>(INITIAL_WIZARD);
  const { currentStep, maxStepReached } = wizard;

  useEffect(() => {
    if (!isOpen) return;
    void usersApi.list({ role: 'dept_head', limit: 200 }).then((res) => {
      setLookups((l) => ({ ...l, deptHeadOptions: res.data.map((u) => ({ value: u.id, label: u.name })) }));
    });
    // Also fetch root_admins separately and merge
    void usersApi.list({ role: 'root_admin', limit: 200 }).then((res) => {
      setLookups((l) => {
        const existingIds = new Set(l.deptHeadOptions.map((o) => o.value));
        const extra = res.data
          .filter((u) => !existingIds.has(u.id))
          .map((u) => ({ value: u.id, label: u.name }));
        return { ...l, deptHeadOptions: [...l.deptHeadOptions, ...extra] };
      });
    });
    void utilitiesApi.list({ status: 'active' }).then((res) => setLookups((l) => ({ ...l, activeUtilities: res.data })));
    void departmentsApi.list({ limit: 500 }).then((res) => setLookups((l) => ({ ...l, departments: res.data })));
  }, [isOpen]);

  const departmentNameById = new Map(departments.map((d) => [d.id, d.name]));

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    trigger,
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
      requestTypes: [],
      utilityIds: [],
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

  const { fields: requestTypeFields, append: appendRequestType, remove: removeRequestType } = useFieldArray({
    control,
    name: 'requestTypes',
  });

  function handleAddRequestType(): void {
    appendRequestType({
      name: '',
      description: '',
      priority: 'medium',
      responseTimeHours: 1,
      resolutionTimeHours: 8,
    });
  }

  function resetWizard(): void {
    setWizard(INITIAL_WIZARD);
  }

  function handleClose(): void {
    reset();
    resetWizard();
    onClose();
  }

  async function handleNext(): Promise<void> {
    const valid = await trigger(STEP_FIELDS[currentStep]);
    if (!valid) return;
    const next = Math.min(currentStep + 1, LAST_STEP);
    setWizard((w) => ({ currentStep: next, maxStepReached: Math.max(w.maxStepReached, next) }));
  }

  function handleBack(): void {
    setWizard((w) => ({ ...w, currentStep: Math.max(w.currentStep - 1, 0) }));
  }

  function handleStepClick(index: number): void {
    if (index <= maxStepReached) setWizard((w) => ({ ...w, currentStep: index }));
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
        requestTypes: data.requestTypes.map((rt) => ({
          name: rt.name,
          description: rt.description,
          priority: rt.priority,
          sla: {
            responseTimeMs: rt.responseTimeHours * 60 * 60 * 1000,
            resolutionTimeMs: rt.resolutionTimeHours * 60 * 60 * 1000,
          },
        })),
        utilityIds: data.utilityIds,
      });
      toast({ type: 'success', message: 'Department created successfully' });
      reset();
      resetWizard();
      onSuccess ? onSuccess() : onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create department';
      toast({ type: 'error', message });
    }
  }

  const isLastStep = currentStep === LAST_STEP;

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      {currentStep > 0 && (
        <Button type="button" variant="secondary" onClick={handleBack} disabled={isSubmitting}>
          <ChevronLeft size={16} /> Back
        </Button>
      )}
      {isLastStep ? (
        <Button type="button" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
          Create Department
        </Button>
      ) : (
        <Button type="button" onClick={handleNext}>
          Next <ChevronRight size={16} />
        </Button>
      )}
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
      <div className={styles.wizardHeader}>
        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          maxStepReached={maxStepReached}
          onStepClick={handleStepClick}
        />
        <p className={styles.stepCaption}>
          Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        noValidate
      >
        {/* ── Step 1: Basic Details ─────────────────── */}
        {currentStep === 0 && (
          <div className={styles.stepPane}>
            <Input
              label="Department Name"
              placeholder="e.g. Engineering"
              error={errors.name?.message}
              {...register('name')}
            />

            <Textarea
              label="Department Description"
              placeholder="Describe what this department handles..."
              rows={3}
              {...register('description')}
            />

            <Select
              label="Department Head (optional)"
              placeholder="Select a department head"
              options={deptHeadOptions}
              error={errors.headId?.message}
              {...register('headId')}
            />

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
          </div>
        )}

        {/* ── Step 2: Request Types ─────────────────── */}
        {currentStep === 1 && (
          <div className={styles.stepPane}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionTitle}>Request Types</p>
              <p className={styles.sectionDesc}>
                Define the request types this department handles. Each one carries its own priority and SLA targets,
                which auto-populate on the ticket form when a requester selects it. Optional — you can skip this.
              </p>
            </div>

            <div className={styles.requestTypeList}>
              {requestTypeFields.map((field, index) => (
                <div key={field.id} className={styles.requestTypeCard}>
                  <div className={styles.requestTypeCardHeader}>
                    <span className={styles.requestTypeIndex}>Request Type {index + 1}</span>
                    <button
                      type="button"
                      className={styles.requestTypeRemove}
                      onClick={() => removeRequestType(index)}
                      aria-label={`Remove request type ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Input
                    label="Request Name"
                    placeholder="e.g. Password Reset"
                    error={errors.requestTypes?.[index]?.name?.message}
                    {...register(`requestTypes.${index}.name`)}
                  />

                  <Textarea
                    label="Request Description"
                    placeholder="Describe when this request type should be used..."
                    rows={2}
                    error={errors.requestTypes?.[index]?.description?.message}
                    {...register(`requestTypes.${index}.description`)}
                  />

                  <div className={styles.row}>
                    <Select
                      label="Priority Level"
                      placeholder="Select priority"
                      options={PRIORITY_OPTIONS}
                      error={errors.requestTypes?.[index]?.priority?.message}
                      {...register(`requestTypes.${index}.priority`)}
                    />
                  </div>

                  <div className={styles.row}>
                    <Input
                      label="Response SLA (hours)"
                      type="number"
                      step="0.5"
                      min="0.5"
                      error={errors.requestTypes?.[index]?.responseTimeHours?.message}
                      {...register(`requestTypes.${index}.responseTimeHours`, { valueAsNumber: true })}
                    />
                    <Input
                      label="Resolution Time SLA (hours)"
                      type="number"
                      step="1"
                      min="1"
                      error={errors.requestTypes?.[index]?.resolutionTimeHours?.message}
                      {...register(`requestTypes.${index}.resolutionTimeHours`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="secondary" size="sm" onClick={handleAddRequestType}>
              <Plus size={14} /> Add Request Type
            </Button>
          </div>
        )}

        {/* ── Step 3: Utilities ─────────────────────── */}
        {currentStep === 2 && (
          <div className={styles.stepPane}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionTitle}>Utilities</p>
              <p className={styles.sectionDesc}>
                Optional. Attach the organization utilities (meeting rooms, pool cars, equipment, etc.) that this
                department&apos;s requesters can book.
              </p>
            </div>

            {activeUtilities.length === 0 ? (
              <EmptyState
                title="No utilities available"
                description="Create utilities from the Utility admin page to attach them to departments."
              />
            ) : (
              <Controller
                name="utilityIds"
                control={control}
                render={({ field }) => (
                  <div className={styles.utilityList}>
                    {activeUtilities.map((utility) => {
                      const checked = field.value.includes(utility.id);
                      const assignedDeptId = utility.departmentIds[0];
                      const assignedDeptName = assignedDeptId ? departmentNameById.get(assignedDeptId) : undefined;
                      const isTaken = !!assignedDeptId;
                      const description = isTaken
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
                          disabled={isTaken}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...field.value, utility.id]
                                : field.value.filter((id) => id !== utility.id),
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              />
            )}
          </div>
        )}

        {/* ── Step 4: Integrations ──────────────────── */}
        {currentStep === 3 && (
          <div className={styles.stepPane}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionTitle}>Integrations</p>
              <p className={styles.sectionDesc}>Optional. Connect this department to a Microsoft Teams channel.</p>
            </div>

            <Input
              label="Teams Webhook URL"
              placeholder="https://hooks.teams.microsoft.com/..."
              error={errors.teamsWebhook?.message}
              {...register('teamsWebhook')}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
