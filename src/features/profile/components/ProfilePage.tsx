import { useState } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Mail, MessageSquare, Camera, Save, Lock } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { DEPARTMENTS } from '../../../mocks/departments';
import { PageWrapper } from '../../../components/layout/PageWrapper';
import { Avatar, Badge, Button } from '../../../components/ui/index';
import { profileSchema, changePasswordSchema } from '../schemas';
import type { ProfileFormData, ChangePasswordFormData } from '../schemas';
import { usePasswordStrength } from '../../auth/hooks/usePasswordStrength';
import styles from './ProfilePage.module.css';

/* ── Left column: Avatar card ── */
function AvatarCard(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();
  const dept = DEPARTMENTS.find((d) => d.id === currentUser?.departmentId);
  if (!currentUser) return <></>;
  const roleLabel = {
    root_admin: 'Root Admin',
    dept_head: 'Dept Head',
    team_member: 'Team Member',
  }[currentUser.role];

  function onPhotoClick() {
    toast({ type: 'info', message: 'Change photo is not available in demo.' });
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Profile</h2>
      <div className={styles.avatarCenter}>
        <div
          className={styles.avatarWrap}
          onClick={onPhotoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onPhotoClick()}
        >
          <Avatar initials={currentUser.avatarInitials} color={currentUser.avatarColor} size="lg" name={currentUser.name} />
          <div className={styles.avatarOverlay}><Camera size={16} color="#fff" /></div>
        </div>
        <p className={styles.avatarName}>{currentUser.name}</p>
        <div className={styles.avatarBadgeRow}>
          <Badge variant="info">{roleLabel}</Badge>
        </div>
        <p className={styles.avatarDept}>{dept?.name ?? 'N/A'}</p>
        <Button variant="ghost" size="sm" leftIcon={<Camera size={14} />} onClick={onPhotoClick}>
          Change Photo
        </Button>
      </div>
    </div>
  );
}

/* ── Left column: Notification Preferences card ── */
function NotifCard(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    email: currentUser?.notificationPrefs.email ?? true,
    teams: currentUser?.notificationPrefs.teams ?? true,
    whatsapp: currentUser?.notificationPrefs.whatsapp ?? false,
  });

  const channels = [
    { key: 'email' as const, icon: <Mail size={16} />, label: 'Email', desc: 'Receive updates via email' },
    { key: 'teams' as const, icon: <MessageSquare size={16} />, label: 'Teams', desc: 'Receive notifications in Microsoft Teams' },
    { key: 'whatsapp' as const, icon: <Bell size={16} />, label: 'WhatsApp', desc: 'Receive updates via WhatsApp' },
  ];

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Notification Preferences</h2>
      <div className={styles.toggleList}>
        {channels.map(({ key, icon, label, desc }) => (
          <div key={key} className={styles.toggleRow}>
            <div className={styles.toggleIcon}>{icon}</div>
            <div className={styles.toggleText}>
              <span className={styles.toggleLabel}>{label}</span>
              <span className={styles.toggleDesc}>{desc}</span>
            </div>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        ))}
      </div>
      <div className={styles.formActions}>
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Save size={14} />}
          onClick={() => toast({ type: 'success', message: 'Notification preferences saved.' })}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

/* ── Right column: Edit Profile card ── */
function EditProfileCard(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: currentUser?.name ?? '', email: currentUser?.email ?? '' },
  });

  function onSave(_data: ProfileFormData) {
    toast({ type: 'success', message: 'Profile updated successfully.' });
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Edit Profile</h2>
      <form onSubmit={handleSubmit(onSave)}>
        <div className={styles.fieldStack}>
          <div className={styles.formField}>
            <label className={styles.label}>Full Name</label>
            <input className={styles.input} {...register('name')} />
            {errors.name && <span className={styles.inputError}>{errors.name.message}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" {...register('email')} />
            {errors.email && <span className={styles.inputError}>{errors.email.message}</span>}
          </div>
        </div>
        <div className={styles.formActions}>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Save size={14} />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ── Right column: Change Password card ── */
function ChangePasswordCard(): ReactElement {
  const { toast } = useToast();
  const { register: regPw, handleSubmit, watch, formState: { errors } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPw = watch('newPassword', '');
  const { score, label } = usePasswordStrength(newPw);
  const strengthColor = ['transparent', 'var(--color-error)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-success)', 'var(--color-success)'][score] ?? 'transparent';

  function onSave(_data: ChangePasswordFormData) {
    toast({ type: 'success', message: 'Password updated successfully.' });
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Change Password</h2>
      <form onSubmit={handleSubmit(onSave)}>
        <div className={styles.fieldStack}>
          <div className={styles.formField}>
            <label className={styles.label}>Current Password</label>
            <input className={styles.input} type="password" {...regPw('currentPassword')} />
            {errors.currentPassword && <span className={styles.inputError}>{errors.currentPassword.message}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>New Password</label>
            <input className={styles.input} type="password" {...regPw('newPassword')} />
            {newPw && (
              <>
                <div className={styles.strengthBar}>
                  <div className={styles.strengthFill} style={{ width: `${(score / 5) * 100}%`, background: strengthColor }} />
                </div>
                <span className={styles.strengthLabel}>{label}</span>
              </>
            )}
            {errors.newPassword && <span className={styles.inputError}>{errors.newPassword.message}</span>}
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>Confirm Password</label>
            <input className={styles.input} type="password" {...regPw('confirmPassword')} />
            {errors.confirmPassword && <span className={styles.inputError}>{errors.confirmPassword.message}</span>}
          </div>
        </div>
        <div className={styles.formActions}>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Lock size={14} />}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ── Page root ── */
export function ProfilePage(): ReactElement {
  const currentUser = useAuthStore((s) => s.currentUser);
  if (!currentUser) return <></>;

  return (
    <PageWrapper title="My Profile" subtitle="Manage your account settings">
      <div className={styles.grid}>
        <div className={styles.col}>
          <AvatarCard />
          <NotifCard />
        </div>
        <div className={styles.col}>
          <EditProfileCard />
          <ChangePasswordCard />
        </div>
      </div>
    </PageWrapper>
  );
}
