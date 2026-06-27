import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X, FileText, Image, File, ChevronLeft, Eye, Paperclip } from 'lucide-react';
import { Input } from '../../../components/ui/index';
import { Textarea } from '../../../components/ui/index';
import { Select } from '../../../components/ui/index';
import { Button } from '../../../components/ui/index';
import { Modal } from '../../../components/ui/index';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { useToast } from '../../../hooks/useToast';
import { useModal } from '../../../hooks/useModal';
import { departmentsApi } from '../../../api/departments';
import { ticketsApi } from '../../../api/tickets';
import type { Department } from '../../../types/index';
import { createTicketSchema } from '../schemas';
import type { CreateTicketFormData } from '../schemas';
import styles from './CreateTicketPage.module.css';

const PRIORITY_OPTIONS = [
  { value: 'low', label: '● Low' },
  { value: 'medium', label: '● Medium' },
  { value: 'high', label: '● High' },
  { value: 'critical', label: '● Critical' },
];

function formatMs(ms: number): string {
  if (ms < 60 * 60 * 1000) return `${Math.round(ms / 60000)}m`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

function getFileIcon(type: string) {
  if (type === 'application/pdf') return <FileText size={14} color="var(--color-error)" />;
  if (type.startsWith('image/')) return <Image size={14} color="var(--color-priority-low)" />;
  if (type.includes('word') || type.includes('document')) return <File size={14} color="var(--color-primary)" />;
  return <File size={14} color="var(--color-text-tertiary)" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
}

function FileList({ files, onRemove }: FileListProps) {
  if (!files.length) return null;
  return (
    <div className={styles.fileList}>
      {files.map((f, i) => (
        <div key={`${f.name}-${i}`} className={styles.fileChip}>
          {getFileIcon(f.type)}
          <span className={styles.fileName}>{f.name}</span>
          <span className={styles.fileSize}>{formatBytes(f.size)}</span>
          <button type="button" className={styles.fileRemove} onClick={() => onRemove(i)} aria-label={`Remove ${f.name}`}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

interface SLAInfoBannerProps {
  dept: Department | null;
}

function SLAInfoBanner({ dept }: SLAInfoBannerProps) {
  if (!dept) return null;
  const slaResponseMs = (dept as Department & { slaResponseMs?: number }).slaResponseMs ?? 0;
  const slaResolutionMs = (dept as Department & { slaResolutionMs?: number }).slaResolutionMs ?? 0;
  return (
    <div className={styles.slaBanner}>
      <span className={styles.slaBannerTitle}>SLA for {dept.name}</span>
      <div className={styles.slaPills}>
        {slaResponseMs > 0 && <span className={styles.slaPillBlue}>Response: {formatMs(slaResponseMs)}</span>}
        {slaResolutionMs > 0 && <span className={styles.slaPillOrange}>Resolution: {formatMs(slaResolutionMs)}</span>}
      </div>
    </div>
  );
}

interface TicketPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  data: Partial<CreateTicketFormData>;
  isSubmitting: boolean;
}

function TicketPreview({ isOpen, onClose, onSubmit, data, isSubmitting, deptName }: TicketPreviewProps & { deptName?: string }) {
  const dept = deptName ? { name: deptName } : null;
  const priorityColors: Record<string, string> = {
    low: 'var(--color-priority-low)',
    medium: 'var(--color-priority-medium)',
    high: 'var(--color-priority-high)',
    critical: 'var(--color-priority-critical)',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preview Ticket"
      size="md"
      footer={
        <div className={styles.previewFooter}>
          <Button type="button" variant="secondary" onClick={onClose}>
            <ChevronLeft size={16} /> Back to Edit
          </Button>
          <Button type="button" loading={isSubmitting} onClick={onSubmit}>
            Submit Ticket
          </Button>
        </div>
      }
    >
      <div className={styles.previewBody}>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Title</span>
          <span className={styles.previewValue}>{data.title || '—'}</span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Department</span>
          <span className={styles.previewValue}>{dept?.name || '—'}</span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Priority</span>
          <span className={styles.previewValue}>
            <span
              className={styles.previewPriorityDot}
              style={{ background: priorityColors[data.priority ?? 'medium'] }}
            />
            {data.priority ? data.priority.charAt(0).toUpperCase() + data.priority.slice(1) : '—'}
          </span>
        </div>
        <div className={styles.previewRow}>
          <span className={styles.previewLabel}>Description</span>
          <span className={styles.previewValue}>{data.description || '—'}</span>
        </div>
        {(data.attachments?.length ?? 0) > 0 && (
          <div className={styles.previewRow}>
            <span className={styles.previewLabel}>Attachments</span>
            <div className={styles.previewFiles}>
              {data.attachments!.map((f, i) => (
                <div key={i} className={styles.fileChip}>
                  {getFileIcon(f.type)}
                  <span className={styles.fileName}>{f.name}</span>
                  <span className={styles.fileSize}>{formatBytes(f.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function CreateTicketPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const previewModal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    departmentsApi.list({ limit: 100 }).then((res) => setDepartments(res.data)).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { title: '', description: '', priority: 'medium', departmentId: '', attachments: [] },
  });

  const watchedValues = useWatch({ control });
  const selectedDeptId = watchedValues.departmentId ?? '';
  const attachments = watchedValues.attachments ?? [];

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    setValue('attachments', [...attachments, ...newFiles]);
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    setValue('attachments', [...attachments, ...newFiles]);
  }

  function removeFile(index: number) {
    setValue('attachments', attachments.filter((_, i) => i !== index));
  }

  async function onSubmit(data: CreateTicketFormData) {
    try {
      const created = await ticketsApi.create({
        title: data.title,
        description: data.description,
        priority: data.priority,
        departmentId: data.departmentId,
        files: (data.attachments ?? []) as File[],
      });
      toast({ type: 'success', message: 'Ticket created successfully.' });
      previewModal.close();
      navigate(`/tickets/${created.id}`);
    } catch {
      toast({ type: 'error', message: 'Failed to create ticket. Please try again.' });
    }
  }

  return (
    <PageWrapper title="New Ticket" subtitle="Submit a new support ticket">
      <div className={styles.pageWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Create New Ticket</h1>
            <p className={styles.cardSubtitle}>Fill in the details below to submit a support ticket</p>
          </div>
          <hr className={styles.divider} />

          <form className={styles.formBody} noValidate>
            <Input
              label="Title *"
              placeholder="Brief summary of the issue"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className={styles.twoCol}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select label="Priority *" options={PRIORITY_OPTIONS} error={errors.priority?.message} {...field} />
                )}
              />
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Department *"
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    placeholder="Select department…"
                    error={errors.departmentId?.message}
                    {...field}
                  />
                )}
              />
            </div>

            {selectedDeptId && (
              <SLAInfoBanner dept={departments.find((d) => d.id === selectedDeptId) ?? null} />
            )}

            <Textarea
              label="Description *"
              placeholder="Describe the issue in detail…"
              rows={5}
              error={errors.description?.message}
              {...register('description')}
            />

            <div className={styles.uploadSection}>
              <label className={styles.uploadLabel}>
                <Paperclip size={14} /> Attachments <span className={styles.uploadOptional}>(optional)</span>
              </label>
              <div
                className={styles.dropZone}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <Upload size={24} className={styles.uploadIcon} />
                <p className={styles.dropText}>Drag files here or click to browse</p>
                <p className={styles.dropHint}>PDF, PNG, JPG, DOCX up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className={styles.hiddenInput}
                  onChange={handleFileInput}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </div>
              <FileList files={attachments as File[]} onRemove={removeFile} />
            </div>

            <div className={styles.formFooter}>
              <Button type="button" variant="secondary" onClick={() => navigate('/tickets')}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit((_data) => previewModal.open())}
              >
                <Eye size={16} /> Preview &amp; Submit
              </Button>
            </div>
          </form>
        </div>
      </div>

      <TicketPreview
        isOpen={previewModal.isOpen}
        onClose={previewModal.close}
        onSubmit={handleSubmit(onSubmit)}
        data={watchedValues}
        isSubmitting={isSubmitting}
        deptName={departments.find((d) => d.id === selectedDeptId)?.name}
      />
    </PageWrapper>
  );
}
