import React from 'react';
import { PackageX, PackageCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore.js';
import { useToast } from '@/hooks/useToast.js';
import { PageWrapper } from '@/components/layout/PageWrapper.js';
import { Button, Badge, Input } from '@/components/ui/index.js';
import { utilitiesApi } from '@/api/utilities.js';
import type { Utility, UtilityOption } from '@/types/index.js';
import styles from './DepartmentUtilitiesPage.module.css';

function formatUntil(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface OptionRowProps {
  utilityId: string;
  option: UtilityOption;
  onChange: (updated: UtilityOption) => void;
}

interface UnavailableForm {
  editing: boolean;
  reason: string;
  until: string;
  saving: boolean;
}
const INITIAL_UNAVAILABLE_FORM: UnavailableForm = { editing: false, reason: '', until: '', saving: false };

function OptionRow({ utilityId, option, onChange }: OptionRowProps) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<UnavailableForm>(INITIAL_UNAVAILABLE_FORM);

  async function markUnavailable() {
    setForm((f) => ({ ...f, saving: true }));
    try {
      const updated = await utilitiesApi.updateOptionAvailability(utilityId, option.id, {
        isAvailable: false,
        reason: form.reason || undefined,
        unavailableUntil: form.until ? new Date(form.until).toISOString() : undefined,
      });
      onChange(updated);
      setForm(INITIAL_UNAVAILABLE_FORM);
      toast({ type: 'success', message: `${option.name} marked unavailable.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update availability.';
      toast({ type: 'error', message });
    } finally {
      setForm((f) => ({ ...f, saving: false }));
    }
  }

  async function markAvailable() {
    setForm((f) => ({ ...f, saving: true }));
    try {
      const updated = await utilitiesApi.updateOptionAvailability(utilityId, option.id, { isAvailable: true });
      onChange(updated);
      toast({ type: 'success', message: `${option.name} marked available.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update availability.';
      toast({ type: 'error', message });
    } finally {
      setForm((f) => ({ ...f, saving: false }));
    }
  }

  return (
    <div className={styles.optionRow}>
      <div className={styles.optionInfo}>
        <span className={styles.optionName}>{option.name}</span>
        {option.isAvailable ? (
          <Badge variant="success" size="sm">Available</Badge>
        ) : (
          <Badge variant="warning" size="sm">
            Unavailable{option.unavailableUntil ? ` until ${formatUntil(option.unavailableUntil)}` : ''}
          </Badge>
        )}
        {!option.isAvailable && option.unavailableReason && (
          <span className={styles.reason}>{option.unavailableReason}</span>
        )}
      </div>

      {!form.editing && (
        <div className={styles.optionActions}>
          {option.isAvailable ? (
            <Button variant="outline" size="sm" leftIcon={<PackageX size={14} />} disabled={form.saving} onClick={() => setForm((f) => ({ ...f, editing: true }))}>
              Mark Unavailable
            </Button>
          ) : (
            <Button variant="outline" size="sm" leftIcon={<PackageCheck size={14} />} loading={form.saving} onClick={markAvailable}>
              Mark Available Now
            </Button>
          )}
        </div>
      )}

      {form.editing && (
        <div className={styles.editForm}>
          <Input
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            wrapperClassName={styles.editField}
          />
          <Input
            type="datetime-local"
            value={form.until}
            onChange={(e) => setForm((f) => ({ ...f, until: e.target.value }))}
            hint="Auto-releases at this time (optional — leave blank to release manually)"
            wrapperClassName={styles.editField}
          />
          <div className={styles.editActions}>
            <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, editing: false }))} disabled={form.saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={form.saving} onClick={markUnavailable}>
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DepartmentUtilitiesPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const departmentId = currentUser?.departmentId ?? '';
  const [utilities, setUtilities] = React.useState<Utility[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!departmentId) {
      setLoading(false);
      return;
    }
    utilitiesApi
      .list({ departmentId })
      .then((res) => setUtilities(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [departmentId]);

  function handleOptionChange(utilityId: string, updated: UtilityOption) {
    setUtilities((prev) =>
      prev.map((u) =>
        u.id === utilityId
          ? { ...u, options: u.options.map((o) => (o.id === updated.id ? updated : o)) }
          : u,
      ),
    );
  }

  return (
    <PageWrapper title="Department Utilities" subtitle="Manage the availability of utilities your department owns">
      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading utilities…
        </div>
      ) : utilities.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          No utilities are linked to your department yet.
        </div>
      ) : (
        <div className={styles.list}>
          {utilities.map((utility) => (
            <div key={utility.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.utilityName}>{utility.name}</h3>
                {utility.description && <p className={styles.utilityDescription}>{utility.description}</p>}
              </div>
              <div className={styles.optionList}>
                {utility.options.map((option) => (
                  <OptionRow
                    key={option.id}
                    utilityId={utility.id}
                    option={option}
                    onChange={(updated) => handleOptionChange(utility.id, updated)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
