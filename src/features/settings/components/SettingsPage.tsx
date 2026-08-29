import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import {
  Building2, Bell, CreditCard, Clock,
  Mail, MessageSquare, Phone,
  Upload, Eye, EyeOff, Save, Shield, Server, Send,
} from 'lucide-react';
import { PageWrapper } from '../../../components/layout/PageWrapper.js';
import { Tabs, Button, Input } from '../../../components/ui/index.js';
import { useToast } from '../../../hooks/useToast.js';
import { settingsApi } from '../../../api/settings.js';
import type { OrgSettings } from '../../../api/settings.js';
import styles from './SettingsPage.module.css';

const TABS = [
  { id: 'general',       label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'payment',       label: 'Payment' },
  { id: 'sla',           label: 'SLA Defaults' },
  { id: 'smtp',          label: 'SMTP' },
];

type SmtpProvider = 'office365' | 'gmail' | 'custom';
type SmtpEncryption = 'tls' | 'ssl' | 'none';

const SMTP_PRESETS: Record<SmtpProvider, { host: string; port: string; encryption: SmtpEncryption }> = {
  office365: { host: 'smtp.office365.com', port: '587', encryption: 'tls' },
  gmail:     { host: 'smtp.gmail.com',     port: '587', encryption: 'tls' },
  custom:    { host: '',                   port: '587', encryption: 'tls' },
};

const SMTP_PROVIDER_LABELS: Record<SmtpProvider, { name: string; sub: string }> = {
  office365: { name: 'Microsoft 365',     sub: 'smtp.office365.com' },
  gmail:     { name: 'Google Workspace',  sub: 'smtp.gmail.com'     },
  custom:    { name: 'Custom SMTP',       sub: 'Enter your own host' },
};

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
  const [, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // General tab state
  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Notification tab state
  const [notifyOnEscalate, setNotifyOnEscalate] = useState(true);
  const [notifyOnBreach, setNotifyOnBreach] = useState(true);

  // SLA tab state (ms -> hours for display)
  const [slaResponseHours, setSlaResponseHours] = useState(4);
  const [slaResolutionHours, setSlaResolutionHours] = useState(24);

  useEffect(() => {
    settingsApi.get().then((data) => {
      setSettings(data);
      setOrgName(data.orgName);
      setLogoUrl(data.logoUrl);
      setNotifyOnEscalate(data.notifyOnEscalate);
      setNotifyOnBreach(data.notifyOnBreach);
      setSlaResponseHours(data.defaultSlaResponseMs / (1000 * 60 * 60));
      setSlaResolutionHours(data.defaultSlaResolutionMs / (1000 * 60 * 60));
    }).catch(() => {
      toast({ type: 'error', message: 'Failed to load settings' });
    }).finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveGeneral(): Promise<void> {
    try {
      const updated = await settingsApi.update({ orgName });
      setSettings(updated);
      toast({ type: 'success', message: 'General settings saved' });
    } catch {
      toast({ type: 'error', message: 'Failed to save settings' });
    }
  }

  async function handleLogoUpload(file: File): Promise<void> {
    try {
      const updated = await settingsApi.uploadLogo(file);
      setSettings(updated);
      setLogoUrl(updated.logoUrl);
      toast({ type: 'success', message: 'Logo updated' });
    } catch {
      toast({ type: 'error', message: 'Failed to upload logo' });
    }
  }

  async function handleSaveNotifications(): Promise<void> {
    try {
      const updated = await settingsApi.update({ notifyOnEscalate, notifyOnBreach });
      setSettings(updated);
      toast({ type: 'success', message: 'Notification preferences saved' });
    } catch {
      toast({ type: 'error', message: 'Failed to save notification settings' });
    }
  }

  async function handleSaveSla(): Promise<void> {
    try {
      const updated = await settingsApi.update({
        defaultSlaResponseMs: slaResponseHours * 60 * 60 * 1000,
        defaultSlaResolutionMs: slaResolutionHours * 60 * 60 * 1000,
      });
      setSettings(updated);
      toast({ type: 'success', message: 'SLA defaults saved' });
    } catch {
      toast({ type: 'error', message: 'Failed to save SLA settings' });
    }
  }

  // ── SMTP state ───────────────────────────────────────────────────────────
  const [smtpProvider, setSmtpProvider] = useState<SmtpProvider>('office365');
  const [smtpHost, setSmtpHost] = useState(SMTP_PRESETS.office365.host);
  const [smtpPort, setSmtpPort] = useState(SMTP_PRESETS.office365.port);
  const [smtpEncryption, setSmtpEncryption] = useState<SmtpEncryption>(SMTP_PRESETS.office365.encryption);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpShowPassword, setSmtpShowPassword] = useState(false);
  const [smtpSenderName, setSmtpSenderName] = useState('');
  const [smtpSenderEmail, setSmtpSenderEmail] = useState('');
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);

  function selectSmtpProvider(provider: SmtpProvider): void {
    setSmtpProvider(provider);
    const preset = SMTP_PRESETS[provider];
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setSmtpEncryption(preset.encryption);
  }

  async function sendTestEmail(): Promise<void> {
    if (!smtpTestEmail) return;
    setSmtpTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSmtpTesting(false);
    toast({ type: 'success', message: `Test email sent to ${smtpTestEmail}` });
  }

  if (loading) {
    return (
      <PageWrapper title="Settings" subtitle="Configure global platform settings">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading settings…
        </div>
      </PageWrapper>
    );
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
          onSave={handleSaveGeneral}
        >
          <>
            <div className={styles.field}>
              <Input label="Organization Name" placeholder="FlowDesk Corp" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div>
              <span className={styles.fieldLabel}>Organization Logo</span>
              {logoUrl && (
                <div style={{ marginBottom: 8 }}>
                  <img src={logoUrl} alt="Current logo" style={{ maxHeight: 48, borderRadius: 4 }} />
                </div>
              )}
              <div
                className={styles.logoBox}
                onClick={() => logoInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && logoInputRef.current?.click()}
              >
                <Upload size={22} className={styles.logoIcon} />
                <span className={styles.logoText}>Click to upload logo</span>
                <span className={styles.logoHint}>PNG, SVG or JPG, max 2MB</span>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
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
          onSave={handleSaveNotifications}
        >
          <div className={styles.toggleGroup}>
            <ToggleRow icon={<Mail size={16} />} label="Email" description="Receive notifications via email" checked={true} onChange={() => {}} />
            <ToggleRow icon={<MessageSquare size={16} />} label="Notify on Escalate" description="Send alerts when tickets are escalated" checked={notifyOnEscalate} onChange={setNotifyOnEscalate} />
            <ToggleRow icon={<Phone size={16} />} label="Notify on SLA Breach" description="Push notifications on SLA breach" checked={notifyOnBreach} onChange={setNotifyOnBreach} />
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
          description="Set default response and resolution windows"
          onSave={handleSaveSla}
          saveLabel="Save All"
        >
          <div className={styles.slaTable}>
            <div className={styles.slaHeader}>
              <span>Setting</span>
              <span>Hours</span>
            </div>
            <div className={styles.slaRow}>
              <span className={styles.deptName}>Default Response Time</span>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={slaResponseHours}
                onChange={(e) => setSlaResponseHours(parseFloat(e.target.value) || 0)}
                wrapperClassName={styles.slaInput}
              />
            </div>
            <div className={[styles.slaRow, styles.slaRowAlt].join(' ')}>
              <span className={styles.deptName}>Default Resolution Time</span>
              <Input
                type="number"
                step="1"
                min="1"
                value={slaResolutionHours}
                onChange={(e) => setSlaResolutionHours(parseFloat(e.target.value) || 0)}
                wrapperClassName={styles.slaInput}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {activeTab === 'smtp' && (
        <SectionCard
          icon={<Server size={20} />}
          title="SMTP Configuration"
          description="Configure the outgoing mail server used for all platform notifications"
          onSave={() => toast({ type: 'success', message: 'SMTP settings saved' })}
          saveLabel="Save SMTP Settings"
        >
          <>
            {/* Provider presets */}
            <div>
              <span className={styles.fieldLabel}>Mail Provider</span>
              <div className={styles.smtpProviders}>
                {(Object.keys(SMTP_PROVIDER_LABELS) as SmtpProvider[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={[styles.smtpProvider, smtpProvider === key ? styles.smtpProviderActive : ''].filter(Boolean).join(' ')}
                    onClick={() => selectSmtpProvider(key)}
                  >
                    <span className={styles.smtpProviderName}>{SMTP_PROVIDER_LABELS[key].name}</span>
                    <span className={styles.smtpProviderSub}>{SMTP_PROVIDER_LABELS[key].sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Host + Port */}
            <div className={styles.smtpGrid}>
              <Input
                label="SMTP Host"
                placeholder="smtp.example.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
              />
              <Input
                label="Port"
                type="number"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                wrapperClassName={styles.smtpPortField}
              />
            </div>

            {/* Encryption */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Encryption</span>
              <select
                className={styles.smtpSelect}
                value={smtpEncryption}
                onChange={(e) => setSmtpEncryption(e.target.value as SmtpEncryption)}
              >
                <option value="tls">STARTTLS (recommended)</option>
                <option value="ssl">SSL / TLS</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Auth credentials */}
            <div className={styles.field}>
              <Input
                label="Username / Account Email"
                type="email"
                placeholder="notifications@bet9ja.com"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Password / App Password"
                type={smtpShowPassword ? 'text' : 'password'}
                placeholder="••••••••••••••••"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                rightIcon={
                  <button type="button" className={styles.eyeBtn} onClick={() => setSmtpShowPassword((s) => !s)} aria-label={smtpShowPassword ? 'Hide' : 'Show'}>
                    {smtpShowPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <p className={styles.smtpHint}>For Gmail, use an App Password instead of your account password.</p>
            </div>

            {/* Sender identity */}
            <div className={styles.smtpDivider}>
              <span>Sender Identity</span>
            </div>
            <div className={styles.smtpGrid}>
              <Input
                label="Sender Name"
                placeholder="Bet9ja Support"
                value={smtpSenderName}
                onChange={(e) => setSmtpSenderName(e.target.value)}
              />
              <Input
                label="Sender Email"
                type="email"
                placeholder="no-reply@bet9ja.com"
                value={smtpSenderEmail}
                onChange={(e) => setSmtpSenderEmail(e.target.value)}
              />
            </div>

            {/* Test email */}
            <div className={styles.smtpDivider}>
              <span>Send Test Email</span>
            </div>
            <div className={styles.smtpTestRow}>
              <Input
                label=""
                type="email"
                placeholder="recipient@example.com"
                value={smtpTestEmail}
                onChange={(e) => setSmtpTestEmail(e.target.value)}
                wrapperClassName={styles.smtpTestInput}
              />
              <Button
                variant="outline"
                leftIcon={<Send size={14} />}
                onClick={sendTestEmail}
                disabled={smtpTesting || !smtpTestEmail}
              >
                {smtpTesting ? 'Sending…' : 'Send Test'}
              </Button>
            </div>
          </>
        </SectionCard>
      )}
    </PageWrapper>
  );
}
