import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  Building2, Bell, CreditCard, Clock,
  Mail, MessageSquare, Phone,
  Upload, Eye, EyeOff, Save, Shield,
} from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Tabs, Button, Input } from '../../../components/ui/index.js';
import { useToast } from '../../../hooks/useToast.js';
import { DEPARTMENTS } from '../../../mocks/departments.js';
import styles from './SettingsPage.module.css';

const TABS = [
  { id: 'general',       label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'payment',       label: 'Payment' },
  { id: 'sla',           label: 'SLA Defaults' },
];

/* ── Reusable section card ──────────────────────────────── */
interface SectionCardProps {
  icon: ReactElement;
  title: string;
  description: string;
  children: ReactElement;
  onSave: () => void;
  saveLabel?: string;
}

function SectionCard({ icon, title, description, children, onSave, saveLabel = 'Save' }: SectionCardProps): ReactElement {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIconWrap} aria-hidden="true">{icon}</span>
        <div>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardDesc}>{description}</p>
        </div>
      </div>
      <div className={styles.cardBody}>{children}</div>
      <div className={styles.cardFooter}>
        <Button leftIcon={<Save size={14} />} onClick={onSave}>{saveLabel}</Button>
      </div>
    </div>
  );
}

/* ── CSS-only toggle ────────────────────────────────────── */
interface ToggleRowProps {
  icon: ReactElement;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps): ReactElement {
  return (
    <label className={styles.toggleRow}>
      <span className={styles.toggleRowLeft}>
        <span className={styles.channelIcon} aria-hidden="true">{icon}</span>
        <span>
          <span className={styles.channelLabel}>{label}</span>
          <span className={styles.channelDesc}>{description}</span>
        </span>
      </span>
      <span className={[styles.toggleTrack, checked ? styles.toggleOn : ''].filter(Boolean).join(' ')}>
        <input
          type="checkbox"
          className={styles.toggleInput}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

/* ── Masked input with eye ──────────────────────────────── */
function MaskedInput({ label, placeholder }: { label: string; placeholder?: string }): ReactElement {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState('');
  return (
    <Input
      label={label}
      type={show ? 'text' : 'password'}
      placeholder={placeholder ?? '••••••••••••••••'}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      rightIcon={
        <button type="button" className={styles.eyeBtn} onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide' : 'Show'}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  );
}

/* ── Page ───────────────────────────────────────────────── */
export function SettingsPage(): ReactElement {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [orgName, setOrgName] = useState('FlowDesk Corp');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifTeams, setNotifTeams] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(false);
  const [slaValues, setSlaValues] = useState(
    DEPARTMENTS.map((d) => ({
      id: d.id,
      name: d.name,
      responseHours: d.sla.responseTimeMs / (1000 * 60 * 60),
      resolutionHours: d.sla.resolutionTimeMs / (1000 * 60 * 60),
    }))
  );

  function updateSla(id: string, field: 'responseHours' | 'resolutionHours', val: number): void {
    setSlaValues((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  }

  return (
    <PageWrapper title="Settings" subtitle="Configure global platform settings">
      <div className={styles.tabsWrap}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'general' && (
        <SectionCard
          icon={<Building2 size={20} />}
          title="Organization Settings"
          description="Manage your organization's name and branding"
          onSave={() => toast({ type: 'success', message: 'General settings saved' })}
        >
          <>
            <div className={styles.field}>
              <Input label="Organization Name" placeholder="FlowDesk Corp" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div>
              <span className={styles.fieldLabel}>Organization Logo</span>
              <div className={styles.logoBox}>
                <Upload size={22} className={styles.logoIcon} />
                <span className={styles.logoText}>Click to upload logo</span>
                <span className={styles.logoHint}>PNG, SVG or JPG, max 2MB</span>
              </div>
            </div>
          </>
        </SectionCard>
      )}

      {activeTab === 'notifications' && (
        <SectionCard
          icon={<Bell size={20} />}
          title="Notification Channels"
          description="Choose how your team receives platform notifications"
          onSave={() => toast({ type: 'success', message: 'Notification preferences saved' })}
        >
          <div className={styles.toggleGroup}>
            <ToggleRow icon={<Mail size={16} />} label="Email" description="Receive notifications via email" checked={notifEmail} onChange={setNotifEmail} />
            <ToggleRow icon={<MessageSquare size={16} />} label="Microsoft Teams" description="Send alerts to Teams channels" checked={notifTeams} onChange={setNotifTeams} />
            <ToggleRow icon={<Phone size={16} />} label="WhatsApp" description="Push notifications via WhatsApp" checked={notifWhatsapp} onChange={setNotifWhatsapp} />
          </div>
        </SectionCard>
      )}

      {activeTab === 'payment' && (
        <SectionCard
          icon={<CreditCard size={20} />}
          title="Payment Configuration"
          description="Connect your Paystack account to enable in-platform payments"
          onSave={() => toast({ type: 'success', message: 'Credentials saved' })}
          saveLabel="Save Credentials"
        >
          <>
            <div className={styles.warningBanner}>
              <Shield size={15} />
              Keep your API keys secure. Never share them publicly.
            </div>
            <div className={styles.field}>
              <MaskedInput label="Paystack Public Key" placeholder="pk_live_••••••••••" />
            </div>
            <div className={styles.field}>
              <MaskedInput label="Paystack Secret Key" placeholder="sk_live_••••••••••" />
            </div>
            <p className={styles.payHint}>Test mode keys start with <code>pk_test_</code> and <code>sk_test_</code></p>
          </>
        </SectionCard>
      )}

      {activeTab === 'sla' && (
        <SectionCard
          icon={<Clock size={20} />}
          title="SLA Default Configuration"
          description="Set default response and resolution windows per department"
          onSave={() => toast({ type: 'success', message: 'SLA defaults saved' })}
          saveLabel="Save All"
        >
          <div className={styles.slaTable}>
            <div className={styles.slaHeader}>
              <span>Department</span>
              <span>Response (hrs)</span>
              <span>Resolution (hrs)</span>
            </div>
            {slaValues.map((row, i) => (
              <div key={row.id} className={[styles.slaRow, i % 2 === 0 ? styles.slaRowAlt : ''].filter(Boolean).join(' ')}>
                <span className={styles.deptName}>{row.name}</span>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={row.responseHours}
                  onChange={(e) => updateSla(row.id, 'responseHours', parseFloat(e.target.value) || 0)}
                  wrapperClassName={styles.slaInput}
                />
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={row.resolutionHours}
                  onChange={(e) => updateSla(row.id, 'resolutionHours', parseFloat(e.target.value) || 0)}
                  wrapperClassName={styles.slaInput}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </PageWrapper>
  );
}
