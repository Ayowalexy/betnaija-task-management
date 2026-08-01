import { useState } from 'react';
import type { ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ListChecks, CalendarCheck2, CalendarOff } from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Tabs } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Badge } from '../../../components/ui/index.js';
import { Input } from '../../../components/ui/index.js';
import { Textarea } from '../../../components/ui/index.js';
import { Select } from '../../../components/ui/index.js';
import { Checkbox } from '../../../components/ui/index.js';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog.js';
import { EmptyState } from '../../../components/shared/EmptyState.js';
import { useUtilityStore } from '../../../store/utilityStore.js';
import { useToast } from '../../../hooks/useToast.js';
import { useModal } from '../../../hooks/useModal.js';
import type { CalendarProvider, CalendarSyncMode } from '../../../types/index.js';
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

export function UtilityDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const utilities = useUtilityStore((s) => s.utilities);
  const updateUtility = useUtilityStore((s) => s.updateUtility);
  const deleteUtility = useUtilityStore((s) => s.deleteUtility);
  const addOption = useUtilityStore((s) => s.addOption);
  const removeOption = useUtilityStore((s) => s.removeOption);

  const [activeTab, setActiveTab] = useState('overview');
  const [description, setDescription] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [removeOptionId, setRemoveOptionId] = useState<string | null>(null);

  const [calendarEnabled, setCalendarEnabled] = useState<boolean | null>(null);
  const [calendarProvider, setCalendarProvider] = useState('');
  const [calendarAddress, setCalendarAddress] = useState('');
  const [calendarSyncMode, setCalendarSyncMode] = useState('');

  const deleteModal = useModal();

  const utility = utilities.find((u) => u.id === id);

  if (!utility) {
    return (
      <PageWrapper title="Not Found">
        <EmptyState title="Utility not found" description="This utility does not exist." />
      </PageWrapper>
    );
  }

  const isSynced = utility.calendar.enabled;
  const effectiveCalendarEnabled = calendarEnabled ?? isSynced;

  function handleSaveDescription(): void {
    updateUtility(utility!.id, { description: description.trim() || utility!.description });
    toast({ type: 'success', message: 'Description updated' });
  }

  function handleAddOption(): void {
    const name = newOptionName.trim();
    if (!name) return;
    addOption(utility!.id, { id: `opt-${utility!.id}-${Date.now()}`, name });
    setNewOptionName('');
    toast({ type: 'success', message: 'Option added' });
  }

  function handleRemoveOption(): void {
    if (!removeOptionId) return;
    removeOption(utility!.id, removeOptionId);
    setRemoveOptionId(null);
    toast({ type: 'success', message: 'Option removed' });
  }

  function handleSaveCalendar(): void {
    if (effectiveCalendarEnabled) {
      const provider = (calendarProvider || utility!.calendar.provider) as CalendarProvider | null;
      const address = calendarAddress.trim() || utility!.calendar.calendarAddress;
      const syncMode = (calendarSyncMode || utility!.calendar.syncMode) as CalendarSyncMode | null;

      if (!provider || !address || !syncMode) {
        toast({ type: 'error', message: 'Fill in provider, calendar address, and sync behavior' });
        return;
      }

      updateUtility(utility!.id, {
        calendar: { enabled: true, provider, calendarAddress: address, syncMode },
      });
    } else {
      updateUtility(utility!.id, {
        calendar: { enabled: false, provider: null, calendarAddress: '', syncMode: null },
      });
    }
    toast({ type: 'success', message: 'Calendar integration saved' });
  }

  function handleToggleStatus(): void {
    const nextStatus = utility!.status === 'active' ? 'inactive' : 'active';
    updateUtility(utility!.id, { status: nextStatus });
    toast({ type: 'success', message: `Utility marked as ${nextStatus}` });
  }

  function handleDeleteUtility(): void {
    deleteModal.close();
    deleteUtility(utility!.id);
    toast({ type: 'success', message: 'Utility deleted' });
    void navigate('/utilities');
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div>
                <Button leftIcon={<Save size={14} />} onClick={handleSaveDescription} size="sm" variant="secondary">
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
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
            <Button leftIcon={<Plus size={14} />} onClick={handleAddOption} disabled={!newOptionName.trim()}>
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
              <Button variant="secondary" size="sm" onClick={handleToggleStatus}>
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
                onChange={(e) => setCalendarEnabled(e.target.checked)}
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
                    value={calendarProvider}
                    onChange={(e) => setCalendarProvider(e.target.value)}
                  />
                  <Input
                    label="Calendar Address / ID"
                    placeholder={utility.calendar.calendarAddress || 'e.g. meetingrooms@company.com'}
                    value={calendarAddress}
                    onChange={(e) => setCalendarAddress(e.target.value)}
                  />
                  <Select
                    label="Sync Behavior"
                    placeholder={syncModeLabel(utility.calendar.syncMode)}
                    options={calendarSyncModeOptions.map((v) => ({
                      value: v,
                      label: SYNC_MODE_OPTIONS.find((m) => m.value === v)?.label ?? v,
                    }))}
                    value={calendarSyncMode}
                    onChange={(e) => setCalendarSyncMode(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Button leftIcon={<Save size={14} />} onClick={handleSaveCalendar} size="sm">
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
        onConfirm={handleRemoveOption}
        title="Remove Option"
        description="Are you sure you want to remove this option from the utility?"
        confirmLabel="Remove"
        danger
      />

      {/* Delete utility confirm */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={handleDeleteUtility}
        title="Delete Utility"
        description={`Are you sure you want to delete "${utility.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </PageWrapper>
  );
}
