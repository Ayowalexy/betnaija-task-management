import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, Bell, CreditCard,
  Mail, MessageSquare, Phone,
  Upload, Eye, EyeOff, Save, Shield, Server, Send,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper.js';
import { Tabs, Button, Input } from '@/components/ui/index.js';
import { useToast } from '@/hooks/useToast.js';
import { settingsApi } from '@/api/settings.js';
import type { OrgSettings, SmtpProvider, SmtpEncryption } from '@/api/settings.js';
import styles from './SettingsPage.module.css';

const TABS = [
  { id: 'general',       label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'payment',       label: 'Payment' },
  { id: 'smtp',          label: 'SMTP' },
];
const TAB_IDS = TABS.map((t) => t.id);
const DEFAULT_TAB = TAB_IDS[0];

interface GeneralForm {
  orgName: string;
  logoUrl: string | null;
}

interface NotifChannels {
  email: boolean;
  teams: boolean;
  sms: boolean;
  whatsapp: boolean;
}

interface PaymentForm {
  paystackPublicKey: string;
  paystackSecretKey: string;
}

interface SmtpForm {
  provider: SmtpProvider;
  host: string;
  port: string;
  encryption: SmtpEncryption;
  username: string;
  password: string;
  senderName: string;
  senderEmail: string;
}

const INITIAL_GENERAL: GeneralForm = { orgName: '', logoUrl: null };
const INITIAL_NOTIFS: NotifChannels = { email: true, teams: false, sms: false, whatsapp: false };
const INITIAL_PAYMENT: PaymentForm = { paystackPublicKey: '', paystackSecretKey: '' };
const INITIAL_SMTP: SmtpForm = {
  provider: 'office365', host: '', port: '', encryption: 'tls',
  username: '', password: '', senderName: '', senderEmail: '',
};

interface SavingState {
  general: boolean;
  notifs: boolean;
  payment: boolean;
  smtp: boolean;
  smtpTest: boolean;
}
const INITIAL_SAVING: SavingState = { general: false, notifs: false, payment: false, smtp: false, smtpTest: false };

const SMTP_PRESETS: Record<Exclude<SmtpProvider, null>, { host: string; port: string; encryption: SmtpEncryption }> = {
  office365: { host: 'smtp.office365.com', port: '587', encryption: 'tls' },
  gmail:     { host: 'smtp.gmail.com',     port: '587', encryption: 'tls' },
  custom:    { host: '',                   port: '587', encryption: 'tls' },
};

const SMTP_PROVIDER_LABELS: Record<Exclude<SmtpProvider, null>, { name: string; sub: string }> = {
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
  saving?: boolean;
  saveLabel?: string;
}

function SectionCard({ icon, title, description, children, onSave, saving, saveLabel = 'Save' }: SectionCardProps): ReactElement {
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
        <Button leftIcon={<Save size={14} />} onClick={onSave} loading={saving}>{saveLabel}</Button>
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
interface MaskedInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

function MaskedInput({ label, placeholder, value, onChange }: MaskedInputProps): ReactElement {
  const [show, setShow] = useState(false);
  return (
    <Input
      label={label}
      type={show ? 'text' : 'password'}
      placeholder={placeholder ?? '••••••••••••••••'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SavingState>(INITIAL_SAVING);

  const [general, setGeneral] = useState<GeneralForm>(INITIAL_GENERAL);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [notifChannels, setNotifChannels] = useState<NotifChannels>(INITIAL_NOTIFS);

  const [payment, setPayment] = useState<PaymentForm>(INITIAL_PAYMENT);

  const [smtp, setSmtp] = useState<SmtpForm>(INITIAL_SMTP);
  const [smtpShowPassword, setSmtpShowPassword] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');

  function updateSaving(patch: Partial<SavingState>): void {
    setSaving((s) => ({ ...s, ...patch }));
  }

  function applySettings(data: OrgSettings): void {
    setGeneral({ orgName: data.orgName, logoUrl: data.orgLogoUrl });
    setNotifChannels({ ...data.notifChannels });
    setPayment({
      paystackPublicKey: data.paystackPublicKey ?? '',
      paystackSecretKey: data.paystackSecretKey ?? '',
    });
    setSmtp({
      provider: data.smtp.provider ?? 'office365',
      host: data.smtp.host ?? '',
      port: data.smtp.port ? String(data.smtp.port) : '',
      encryption: data.smtp.encryption ?? 'tls',
      username: data.smtp.username ?? '',
      password: data.smtp.password ?? '',
      senderName: data.smtp.senderName ?? '',
      senderEmail: data.smtp.senderEmail ?? '',
    });
  }

  useEffect(() => {
    settingsApi.get().then(applySettings).catch(() => {
      toast({ type: 'error', message: 'Failed to load settings' });
    }).finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveGeneral(): Promise<void> {
    updateSaving({ general: true });
    try {
      const updated = await settingsApi.update({ orgName: general.orgName });
      applySettings(updated);
      toast({ type: 'success', message: 'General settings saved' });
    } catch {
      toast({ type: 'error', message: 'Failed to save settings' });
    } finally {
      updateSaving({ general: false });
    }
  }

  async function handleLogoUpload(file: File): Promise<void> {
    try {
      const { logoUrl: url } = await settingsApi.uploadLogo(file);
      setGeneral((g) => ({ ...g, logoUrl: url }));
      toast({ type: 'success', message: 'Logo updated' });
    } catch {
      toast({ type: 'error', message: 'Failed to upload logo' });
    }
  }

  async function handleSaveNotifications(): Promise<void> {
    updateSaving({ notifs: true });
    try {
      const updated = await settingsApi.update({ notifChannels });
      applySettings(updated);
      toast({ type: 'success', message: 'Notification preferences saved' });
    } catch {
      toast({ type: 'error', message: 'Failed to save notification settings' });
    } finally {
      updateSaving({ notifs: false });
    }
  }

  async function handleSavePayment(): Promise<void> {
    updateSaving({ payment: true });
    try {
      const updated = await settingsApi.update(payment);
      applySettings(updated);
      toast({ type: 'success', message: 'Payment credentials saved' });
    } catch {
      toast({ type: 'error', message: 'Failed to save payment credentials' });
    } finally {
      updateSaving({ payment: false });
    }
  }

  function selectSmtpProvider(provider: Exclude<SmtpProvider, null>): void {
    setSmtp((s) => ({ ...s, provider, ...SMTP_PRESETS[provider] }));
  }

  function currentSmtpConfig() {
    return {
      ...smtp,
      port: smtp.port ? Number(smtp.port) : null,
    };
  }

  async function handleSaveSmtp(): Promise<void> {
    updateSaving({ smtp: true });
    try {
      const updated = await settingsApi.update({ smtp: currentSmtpConfig() });
      applySettings(updated);
      toast({ type: 'success', message: 'SMTP settings saved' });
    } catch {
      toast({ type: 'error', message: 'Failed to save SMTP settings' });
    } finally {
      updateSaving({ smtp: false });
    }
  }

  async function sendTestEmail(): Promise<void> {
    if (!smtpTestEmail) return;
    updateSaving({ smtpTest: true });
    try {
      await settingsApi.testSmtp(smtpTestEmail, currentSmtpConfig());
      toast({ type: 'success', message: `Test email sent to ${smtpTestEmail}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send test email';
      toast({ type: 'error', message });
    } finally {
      updateSaving({ smtpTest: false });
    }
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
          saving={saving.general}
        >
          <>
            <div className={styles.field}>
              <Input label="Organization Name" placeholder="Bet9ja" value={general.orgName} onChange={(e) => setGeneral((g) => ({ ...g, orgName: e.target.value }))} />
            </div>
            <div>
              <span className={styles.fieldLabel}>Organization Logo</span>
              {general.logoUrl && (
                <div style={{ marginBottom: 8 }}>
                  <img src={general.logoUrl} alt="Current logo" style={{ maxHeight: 48, borderRadius: 4 }} />
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
          description="Choose which channels are available for platform notifications org-wide"
          onSave={handleSaveNotifications}
          saving={saving.notifs}
        >
          <div className={styles.toggleGroup}>
            <ToggleRow icon={<Mail size={16} />} label="Email" description="Send notifications via SMTP (configured in the SMTP tab)" checked={notifChannels.email} onChange={(v) => setNotifChannels((n) => ({ ...n, email: v }))} />
            <ToggleRow icon={<MessageSquare size={16} />} label="Microsoft Teams" description="Send alerts to department Teams webhooks" checked={notifChannels.teams} onChange={(v) => setNotifChannels((n) => ({ ...n, teams: v }))} />
            <ToggleRow icon={<Phone size={16} />} label="SMS" description="Send SMS notifications for critical events" checked={notifChannels.sms} onChange={(v) => setNotifChannels((n) => ({ ...n, sms: v }))} />
            <ToggleRow icon={<Phone size={16} />} label="WhatsApp" description="Push notifications via WhatsApp" checked={notifChannels.whatsapp} onChange={(v) => setNotifChannels((n) => ({ ...n, whatsapp: v }))} />
          </div>
        </SectionCard>
      )}

      {activeTab === 'payment' && (
        <SectionCard
          icon={<CreditCard size={20} />}
          title="Payment Configuration"
          description="Connect your Paystack account to enable in-platform payments"
          onSave={handleSavePayment}
          saving={saving.payment}
          saveLabel="Save Credentials"
        >
          <>
            <div className={styles.warningBanner}>
              <Shield size={15} />
              Keep your API keys secure. Never share them publicly.
            </div>
            <div className={styles.field}>
              <MaskedInput label="Paystack Public Key" placeholder="pk_live_••••••••••" value={payment.paystackPublicKey} onChange={(v) => setPayment((p) => ({ ...p, paystackPublicKey: v }))} />
            </div>
            <div className={styles.field}>
              <MaskedInput label="Paystack Secret Key" placeholder="sk_live_••••••••••" value={payment.paystackSecretKey} onChange={(v) => setPayment((p) => ({ ...p, paystackSecretKey: v }))} />
            </div>
            <p className={styles.payHint}>Test mode keys start with <code>pk_test_</code> and <code>sk_test_</code></p>
          </>
        </SectionCard>
      )}

      {activeTab === 'smtp' && (
        <SectionCard
          icon={<Server size={20} />}
          title="SMTP Configuration"
          description="Configure the outgoing mail server used for all platform notifications"
          onSave={handleSaveSmtp}
          saving={saving.smtp}
          saveLabel="Save SMTP Settings"
        >
          <>
            {/* Provider presets */}
            <div>
              <span className={styles.fieldLabel}>Mail Provider</span>
              <div className={styles.smtpProviders}>
                {(Object.keys(SMTP_PROVIDER_LABELS) as Exclude<SmtpProvider, null>[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={[styles.smtpProvider, smtp.provider === key ? styles.smtpProviderActive : ''].filter(Boolean).join(' ')}
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
                value={smtp.host}
                onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))}
              />
              <Input
                label="Port"
                type="number"
                placeholder="587"
                value={smtp.port}
                onChange={(e) => setSmtp((s) => ({ ...s, port: e.target.value }))}
                wrapperClassName={styles.smtpPortField}
              />
            </div>

            {/* Encryption */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Encryption</span>
              <select
                className={styles.smtpSelect}
                value={smtp.encryption}
                onChange={(e) => setSmtp((s) => ({ ...s, encryption: e.target.value as SmtpEncryption }))}
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
                value={smtp.username}
                onChange={(e) => setSmtp((s) => ({ ...s, username: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <Input
                label="Password / App Password"
                type={smtpShowPassword ? 'text' : 'password'}
                placeholder="••••••••••••••••"
                value={smtp.password}
                onChange={(e) => setSmtp((s) => ({ ...s, password: e.target.value }))}
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
                value={smtp.senderName}
                onChange={(e) => setSmtp((s) => ({ ...s, senderName: e.target.value }))}
              />
              <Input
                label="Sender Email"
                type="email"
                placeholder="no-reply@bet9ja.com"
                value={smtp.senderEmail}
                onChange={(e) => setSmtp((s) => ({ ...s, senderEmail: e.target.value }))}
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
                disabled={saving.smtpTest || !smtpTestEmail}
              >
                {saving.smtpTest ? 'Sending…' : 'Send Test'}
              </Button>
            </div>
          </>
        </SectionCard>
      )}
    </PageWrapper>
  );
}
