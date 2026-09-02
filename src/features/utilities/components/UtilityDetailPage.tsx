import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, ListChecks, CalendarCheck2, CalendarOff } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper.js';
import { Tabs } from '@/components/ui/index.js';
import { Button } from '@/components/ui/index.js';
import { Badge } from '@/components/ui/index.js';
import { Input } from '@/components/ui/index.js';
import { Textarea } from '@/components/ui/index.js';
import { Select } from '@/components/ui/index.js';
import { Checkbox } from '@/components/ui/index.js';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { utilitiesApi } from '@/api/utilities.js';
import { useToast } from '@/hooks/useToast.js';
import { useModal } from '@/hooks/useModal.js';
import type { CalendarProvider, CalendarSyncMode, Utility } from '@/types/index.js';
import { calendarProviderOptions, calendarSyncModeOptions } from '../schemas.js';
import styles from './UtilityDetailPage.module.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'options', label: 'Options' },
  { id: 'settings', label: 'Settings' },
];

const PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google Calendar' },
  { value: 'outlook', label: 'Microsoft Outlook / 365' },
  { value: 'ics', label: 'Other (iCal / ICS feed)' },
];

const SYNC_MODE_OPTIONS = [
  { value: 'meeting', label: 'Create a meeting & invite attendees' },
  { value: 'event', label: 'Create a calendar event/block only' },
];

function providerLabel(provider: CalendarProvider | null): string {
  return PROVIDER_OPTIONS.find((p) => p.value === provider)?.label ?? '—';
}

function syncModeLabel(mode: CalendarSyncMode | null): string {
  return SYNC_MODE_OPTIONS.find((m) => m.value === mode)?.label ?? '—';
}

const TAB_IDS = TABS.map((t) => t.id);
const DEFAULT_TAB = TAB_IDS[0];

interface CalendarForm {
  enabled: boolean | null;
  provider: string;
  address: string;
  syncMode: string;
  saving: boolean;
}
const INITIAL_CALENDAR_FORM: CalendarForm = { enabled: null, provider: '', address: '', syncMode: '', saving: false };

export function UtilityDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab = rawTab && TAB_IDS.includes(rawTab) ? rawTab : DEFAULT_TAB;
  function setActiveTab(tab: string): void {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  }

  const [utility, setUtility] = useState<Utility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState({ value: '', saving: false });
  const [newOption, setNewOption] = useState({ name: '', saving: false });
  const [removeOptionId, setRemoveOptionId] = useState<string | null>(null);

  const [calendarForm, setCalendarForm] = useState<CalendarForm>(INITIAL_CALENDAR_FORM);

  const deleteModal = useModal();

  const fetchUtility = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await utilitiesApi.get(id);
      setUtility(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load utility';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchUtility();
  }, [fetchUtility]);

  if (loading) {
    return (
      <PageWrapper title="Loading…">
        <EmptyState title="Loading utility…" description="Please wait." />
      </PageWrapper>
    );
  }

  if (error || !utility) {
    return (
      <PageWrapper title="Not Found">
        <EmptyState
          title="Utility not found"
          description={error ?? 'This utility does not exist.'}
          action={<Button onClick={() => void navigate('/utilities')}>Back to Utilities</Button>}
        />
      </PageWrapper>
    );
  }

  const isSynced = utility.calendar.enabled;
  const effectiveCalendarEnabled = calendarForm.enabled ?? isSynced;

  async function handleSaveDescription(): Promise<void> {
    setDescription((d) => ({ ...d, saving: true }));
    try {
      const updated = await utilitiesApi.update(utility!.id, { description: description.value.trim() || utility!.description });
      setUtility(updated);
      toast({ type: 'success', message: 'Description updated' });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update description' });
    } finally {
      setDescription((d) => ({ ...d, saving: false }));
    }
  }

  async function handleAddOption(): Promise<void> {
    const name = newOption.name.trim();
    if (!name) return;
    setNewOption((o) => ({ ...o, saving: true }));
    try {
      await utilitiesApi.addOption(utility!.id, name);
      setNewOption({ name: '', saving: false });
      toast({ type: 'success', message: 'Option added' });
      await fetchUtility();
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to add option' });
      setNewOption((o) => ({ ...o, saving: false }));
    }
  }

  async function handleRemoveOption(): Promise<void> {
    if (!removeOptionId) return;
    try {
      await utilitiesApi.removeOption(utility!.id, removeOptionId);
      setRemoveOptionId(null);
      toast({ type: 'success', message: 'Option removed' });
      await fetchUtility();
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to remove option' });
    }
  }

  async function handleSaveCalendar(): Promise<void> {
    setCalendarForm((c) => ({ ...c, saving: true }));
    try {
      if (effectiveCalendarEnabled) {
        const provider = (calendarForm.provider || utility!.calendar.provider) as CalendarProvider | null;
        const address = calendarForm.address.trim() || utility!.calendar.calendarAddress;
        const syncMode = (calendarForm.syncMode || utility!.calendar.syncMode) as CalendarSyncMode | null;

        if (!provider || !address || !syncMode) {
          toast({ type: 'error', message: 'Fill in provider, calendar address, and sync behavior' });
          return;
        }

        const updated = await utilitiesApi.update(utility!.id, {
          calendarEnabled: true,
          calendarProvider: provider,
          calendarAddress: address,
          calendarSyncMode: syncMode,
        });
        setUtility(updated);
      } else {
        const updated = await utilitiesApi.update(utility!.id, { calendarEnabled: false });
        setUtility(updated);
      }
      toast({ type: 'success', message: 'Calendar integration saved' });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save calendar settings' });
    } finally {
      setCalendarForm((c) => ({ ...c, saving: false }));
    }
  }

  async function handleToggleStatus(): Promise<void> {
    const nextStatus = utility!.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await utilitiesApi.update(utility!.id, { status: nextStatus });
      setUtility(updated);
      toast({ type: 'success', message: `Utility marked as ${nextStatus}` });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update status' });
    }
  }

  async function handleDeleteUtility(): Promise<void> {
    try {
      await utilitiesApi.remove(utility!.id);
      deleteModal.close();
      toast({ type: 'success', message: 'Utility deleted' });
      void navigate('/utilities');
    } catch (err) {
      deleteModal.close();
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete utility' });
    }
  }

  return (
    <PageWrapper title={utility.name} subtitle={utility.description}>
      {/* Info bar */}
      <div className={styles.infoBar}>
        <div className={styles.infoBarItem}>
          <Badge variant={utility.status === 'active' ? 'success' : 'default'} size="sm" dot>
            {utility.status}
          </Badge>
        </div>

        <span className={styles.infoBarDivider} aria-hidden="true" />

        <div className={styles.infoBarItem}>
          <span className={styles.infoBarCount}>
            <ListChecks size={14} />
            <strong>{utility.options.length}</strong> options
          </span>
        </div>

        <span className={styles.infoBarDivider} aria-hidden="true" />

        <div className={styles.infoBarItem}>
          <span className={styles.infoBarCount}>
            {isSynced ? <CalendarCheck2 size={14} /> : <CalendarOff size={14} />}
            {isSynced ? 'Calendar synced' : 'No calendar integration'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsWrap}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Overview tab ─────────────────────────── */}
      {activeTab === 'overview' && (
        <div className={styles.section}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Description</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Textarea
                label=""
                rows={3}
                placeholder={utility.description || 'Describe what this utility is used for...'}
                value={description.value}
                onChange={(e) => setDescription((d) => ({ ...d, value: e.target.value }))}
              />
              <div>
                <Button leftIcon={<Save size={14} />} onClick={() => void handleSaveDescription()} size="sm" variant="secondary" loading={description.saving}>
                  Save Description
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Calendar Integration</h3>
            {isSynced ? (
              <div className={styles.calendarSummary}>
                <div className={styles.calendarSummaryRow}>
                  <span className={styles.calendarSummaryLabel}>Provider</span>
                  <span className={styles.calendarSummaryValue}>{providerLabel(utility.calendar.provider)}</span>
                </div>
                <div className={styles.calendarSummaryRow}>
                  <span className={styles.calendarSummaryLabel}>Calendar Address</span>
                  <span className={styles.calendarSummaryValue}>{utility.calendar.calendarAddress}</span>
                </div>
                <div className={styles.calendarSummaryRow}>
                  <span className={styles.calendarSummaryLabel}>Sync Behavior</span>
                  <span className={styles.calendarSummaryValue}>{syncModeLabel(utility.calendar.syncMode)}</span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No calendar integration"
                description={'Connect a calendar in the "Settings" tab so bookings sync everyone\'s availability.'}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Options tab ───────────────────────────── */}
      {activeTab === 'options' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              Options
              <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'var(--font-weight-normal)', marginLeft: 'var(--space-2)' }}>
                ({utility.options.length})
              </span>
            </h3>
          </div>

          <div className={styles.addOptionRow}>
            <Input
              placeholder="e.g. Meeting Room 4"
              value={newOption.name}
              onChange={(e) => setNewOption((o) => ({ ...o, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAddOption();
                }
              }}
            />
            <Button leftIcon={<Plus size={14} />} onClick={() => void handleAddOption()} disabled={!newOption.name.trim()} loading={newOption.saving}>
              Add Option
            </Button>
          </div>

          <div className={styles.optionList}>
            {utility.options.length === 0 ? (
              <EmptyState title="No options yet" description="Add at least one option requesters can choose from." />
            ) : (
              utility.options.map((option) => (
                <div key={option.id} className={styles.optionRow}>
                  <span className={styles.optionName}>{option.name}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setRemoveOptionId(option.id)}
                    aria-label={`Remove ${option.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Settings tab ──────────────────────────── */}
      {activeTab === 'settings' && (
        <div className={styles.section}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Status</h3>
            <div className={styles.statusRow}>
              <p className={styles.statusDesc}>
                {utility.status === 'active'
                  ? 'This utility is active and can be requested by staff.'
                  : 'This utility is inactive and hidden from requesters.'}
              </p>
              <Button variant="secondary" size="sm" onClick={() => void handleToggleStatus()}>
                Mark as {utility.status === 'active' ? 'Inactive' : 'Active'}
              </Button>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Calendar Integration</h3>
            <div className={styles.calendarSettings}>
              <Checkbox
                label="Enable calendar integration"
                checked={effectiveCalendarEnabled}
                onChange={(e) => setCalendarForm((c) => ({ ...c, enabled: e.target.checked }))}
              />

              {effectiveCalendarEnabled && (
                <div className={styles.calendarFields}>
                  <Select
                    label="Calendar Provider"
                    placeholder={providerLabel(utility.calendar.provider)}
                    options={calendarProviderOptions.map((v) => ({
                      value: v,
                      label: PROVIDER_OPTIONS.find((p) => p.value === v)?.label ?? v,
                    }))}
                    value={calendarForm.provider}
                    onChange={(e) => setCalendarForm((c) => ({ ...c, provider: e.target.value }))}
                  />
                  <Input
                    label="Calendar Address / ID"
                    placeholder={utility.calendar.calendarAddress || 'e.g. meetingrooms@company.com'}
                    value={calendarForm.address}
                    onChange={(e) => setCalendarForm((c) => ({ ...c, address: e.target.value }))}
                  />
                  <Select
                    label="Sync Behavior"
                    placeholder={syncModeLabel(utility.calendar.syncMode)}
                    options={calendarSyncModeOptions.map((v) => ({
                      value: v,
                      label: SYNC_MODE_OPTIONS.find((m) => m.value === v)?.label ?? v,
                    }))}
                    value={calendarForm.syncMode}
                    onChange={(e) => setCalendarForm((c) => ({ ...c, syncMode: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Button leftIcon={<Save size={14} />} onClick={() => void handleSaveCalendar()} size="sm" loading={calendarForm.saving}>
                  Save Calendar Settings
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.dangerZone}>
            <div className={styles.dangerBody}>
              <h3 className={styles.dangerTitle}>Danger Zone</h3>
              <p className={styles.dangerDesc}>
                Deleting this utility is permanent and cannot be undone. All options and calendar
                configuration will be lost.
              </p>
            </div>
            <Button variant="danger" leftIcon={<Trash2 size={14} />} onClick={deleteModal.open}>
              Delete Utility
            </Button>
          </div>
        </div>
      )}

      {/* Remove option confirm */}
      <ConfirmDialog
        isOpen={!!removeOptionId}
        onClose={() => setRemoveOptionId(null)}
        onConfirm={() => void handleRemoveOption()}
        title="Remove Option"
        description="Are you sure you want to remove this option from the utility?"
        confirmLabel="Remove"
        danger
      />

      {/* Delete utility confirm */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => void handleDeleteUtility()}
        title="Delete Utility"
        description={`Are you sure you want to delete "${utility.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </PageWrapper>
  );
}
