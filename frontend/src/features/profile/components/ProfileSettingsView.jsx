import { useMemo, useState } from 'react';
import { Camera, LockKeyhole, Monitor, Moon, Sun, UploadCloud, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Input/Select';
import { Textarea } from '../../../components/ui/Input/Textarea';
import { Checkbox } from '../../../components/ui/Input/Checkbox';
import { Card } from '../../../components/ui/Layout/Card';
import { PageHeader } from '../../../components/common/PageHeader';
import { useDistricts, useMunicipalities, useProvinces } from '../../location/hooks/useLocations';
import { profileHelpers, useProfileSettings } from '../hooks/useProfileSettings';

const roleTabs = (roleKey) => [
  { key: 'profile', label: 'Profile' },
  { key: 'security', label: 'Security' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'preferences', label: 'Preferences' },
  ...(roleKey === 'provider' ? [{ key: 'provider', label: 'Provider Details' }] : []),
  ...(roleKey === 'admin' ? [{ key: 'admin', label: 'Admin Settings' }] : []),
];

const providerStatusTone = {
  PENDING_APPROVAL: 'bg-[var(--sf-accent)]/10 text-[var(--sf-accent)] border-[var(--sf-accent)]/30',
  APPROVED: 'bg-[var(--sf-secondary)]/10 text-[var(--sf-secondary)] border-[var(--sf-secondary)]/30',
  REJECTED: 'bg-[var(--sf-danger)]/10 text-[var(--sf-danger)] border-[var(--sf-danger)]/30',
  SUSPENDED: 'bg-[var(--sf-danger)]/10 text-[var(--sf-danger)] border-[var(--sf-danger)]/30',
};

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString();
};

const toOptions = (items) =>
  profileHelpers
    .toArray(items, ['provinces', 'districts', 'municipalities', 'items'])
    .map((item) => {
      if (typeof item === 'string') return { value: item, label: item };
      const value = item?.id || item?.code || item?.name;
      const label = item?.name || item?.label || item?.code;
      return { value, label };
    })
    .filter((item) => item.value && item.label);

const nameFromUser = (user) => user?.name || user?.fullName || 'User';
const avatarFromUser = (user) => user?.avatar || user?.avatarUrl || '';

export function ProfileSettingsView({ roleKey = 'customer' }) {
  const { user: authUser, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState('profile');
  const [draftProfile, setDraftProfile] = useState({});
  const [draftProvider, setDraftProvider] = useState({});
  const [draftPreferences, setDraftPreferences] = useState({});
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordUnavailable, setPasswordUnavailable] = useState(false);
  const [preferencesUnavailable, setPreferencesUnavailable] = useState(false);

  const {
    profileQuery,
    updateProfileMutation,
    updateProviderProfileMutation,
    uploadAvatarMutation,
    changePasswordMutation,
    preferencesQuery,
    updatePreferencesMutation,
  } = useProfileSettings();

  const profile = useMemo(() => profileQuery.data || authUser || {}, [authUser, profileQuery.data]);
  const providerProfile = profile?.providerProfile || null;
  const tabs = roleTabs(roleKey);

  const profileBase = useMemo(
    () => ({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      province: profile.province || '',
      district: profile.district || '',
      municipality: profile.municipality || '',
      ward: profile.ward || '',
      streetAddress: profile.streetAddress || '',
    }),
    [profile]
  );

  const providerBase = useMemo(
    () => ({
      experienceYears: providerProfile?.experienceYears ?? '',
      bio: providerProfile?.bio || '',
      expertise: Array.isArray(providerProfile?.expertise) ? providerProfile.expertise.join(', ') : providerProfile?.expertise || '',
    }),
    [providerProfile]
  );

  const preferenceBase = useMemo(
    () => ({
      bookingUpdates: true,
      jobUpdates: true,
      systemUpdates: true,
      emailNotifications: true,
      smsNotifications: false,
      ...(preferencesQuery.data || {}),
    }),
    [preferencesQuery.data]
  );

  const profileForm = { ...profileBase, ...draftProfile };
  const providerForm = { ...providerBase, ...draftProvider };
  const preferenceForm = { ...preferenceBase, ...draftPreferences };

  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(profileForm.province);
  const municipalitiesQuery = useMunicipalities(profileForm.province, profileForm.district);
  const provinceOptions = useMemo(() => toOptions(provincesQuery.data), [provincesQuery.data]);
  const districtOptions = useMemo(() => toOptions(districtsQuery.data), [districtsQuery.data]);
  const municipalityOptions = useMemo(() => toOptions(municipalitiesQuery.data), [municipalitiesQuery.data]);

  const onSaveProfile = async (event) => {
    event.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({
        name: profileForm.name?.trim(),
        phone: profileForm.phone?.trim(),
        province: profileForm.province || null,
        district: profileForm.district || null,
        municipality: profileForm.municipality || null,
        ward: profileForm.ward?.trim() || null,
        streetAddress: profileForm.streetAddress?.trim() || null,
      });
      await refreshUser();
      setDraftProfile({});
      appToast.success('Profile updated successfully.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to update profile right now.'));
    }
  };

  const onSaveProvider = async (event) => {
    event.preventDefault();
    try {
      await updateProviderProfileMutation.mutateAsync({
        experienceYears: providerForm.experienceYears,
        bio: providerForm.bio,
        expertise: JSON.stringify(
          String(providerForm.expertise || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        ),
      });
      await refreshUser();
      setDraftProvider({});
      appToast.success('Provider details updated.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to update provider details right now.'));
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      appToast.error('Please fill all password fields.');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      appToast.error('New password and confirm password must match.');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      appToast.success('Password changed successfully.');
    } catch (error) {
      if (error?.code === 'CHANGE_PASSWORD_ENDPOINT_MISSING') {
        setPasswordUnavailable(true);
        appToast.error('Password update is unavailable right now.');
        return;
      }
      appToast.error(getErrorMessage(error, 'Unable to change password right now.'));
    }
  };

  const onSavePreferences = async () => {
    try {
      await updatePreferencesMutation.mutateAsync(preferenceForm);
      setDraftPreferences({});
      appToast.success('Preferences updated.');
    } catch (error) {
      if (error?.code === 'PREFERENCES_ENDPOINT_MISSING') {
        setPreferencesUnavailable(true);
        appToast.error('Notification preferences are unavailable right now.');
        return;
      }
      appToast.error(getErrorMessage(error, 'Unable to save preferences right now.'));
    }
  };

  const onAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatarMutation.mutateAsync(file);
      await refreshUser();
      appToast.success('Avatar updated.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to upload avatar right now.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile & Settings"
        description="Manage your account information, security, preferences, and role-specific details."
      />

      {profileQuery.isLoading ? <div className="h-36 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" /> : null}
      {profileQuery.isError ? (
        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="text-sm text-[var(--sf-text-muted)]">Unable to load profile information.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => profileQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!profileQuery.isLoading && !profileQuery.isError ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
          <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {avatarFromUser(profile) ? (
                  <img src={avatarFromUser(profile)} alt={`${nameFromUser(profile)} avatar`} loading="lazy" decoding="async" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sf-surface-soft)] text-[var(--sf-primary)]">
                    <UserCircle2 className="h-9 w-9" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-[var(--sf-text-main)]">{nameFromUser(profile)}</p>
                  <p className="text-sm text-[var(--sf-text-muted)]">{profile.email || 'No email available'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--sf-border)] px-3 py-1 text-xs font-semibold text-[var(--sf-text-main)]">{profile.role || roleKey.toUpperCase()}</span>
                {providerProfile?.status ? (
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${providerStatusTone[providerProfile.status] || 'border-[var(--sf-border)] text-[var(--sf-text-main)]'}`}>
                    {providerProfile.status}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[var(--sf-text-muted)]">Joined {formatDate(profile.createdAt)}</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--sf-text-main)]">
                {uploadAvatarMutation.isPending ? <UploadCloud className="h-4 w-4 animate-pulse" /> : <Camera className="h-4 w-4" />}
                Update avatar
                <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} />
              </label>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold ${
                    tab === item.key ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]' : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === 'profile' ? (
              <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                <form className="grid gap-4 md:grid-cols-2" onSubmit={onSaveProfile}>
                  <Input label="Full Name" required value={profileForm.name} onChange={(e) => setDraftProfile((cur) => ({ ...cur, name: e.target.value }))} />
                  <Input label="Email Address" value={profileForm.email} readOnly hint="Email updates are not available here." />
                  <Input label="Phone Number" value={profileForm.phone} onChange={(e) => setDraftProfile((cur) => ({ ...cur, phone: e.target.value }))} />
                  <Input label="Role" value={profile.role || ''} readOnly />
                  <Select label="Province" value={profileForm.province} onChange={(e) => setDraftProfile((cur) => ({ ...cur, province: e.target.value, district: '', municipality: '' }))} options={provinceOptions} placeholder={provincesQuery.isLoading ? 'Loading provinces...' : 'Select province'} />
                  <Select label="District" value={profileForm.district} onChange={(e) => setDraftProfile((cur) => ({ ...cur, district: e.target.value, municipality: '' }))} options={districtOptions} placeholder={districtsQuery.isLoading ? 'Loading districts...' : 'Select district'} disabled={!profileForm.province} />
                  <Select label="Municipality" value={profileForm.municipality} onChange={(e) => setDraftProfile((cur) => ({ ...cur, municipality: e.target.value }))} options={municipalityOptions} placeholder={municipalitiesQuery.isLoading ? 'Loading municipalities...' : 'Select municipality'} disabled={!profileForm.district} />
                  <Input label="Ward" value={profileForm.ward} onChange={(e) => setDraftProfile((cur) => ({ ...cur, ward: e.target.value }))} />
                  <div className="md:col-span-2">
                    <Input label="Address" value={profileForm.streetAddress} onChange={(e) => setDraftProfile((cur) => ({ ...cur, streetAddress: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" loading={updateProfileMutation.isPending}>Save Profile</Button>
                  </div>
                </form>
              </Card>
            ) : null}

            {tab === 'security' ? (
              <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                {passwordUnavailable ? (
                  <p className="text-sm text-[var(--sf-text-muted)]">Password update is currently unavailable.</p>
                ) : (
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={onChangePassword}>
                    <Input type="password" label="Current Password" value={securityForm.currentPassword} onChange={(e) => setSecurityForm((cur) => ({ ...cur, currentPassword: e.target.value }))} />
                    <div />
                    <Input type="password" label="New Password" value={securityForm.newPassword} onChange={(e) => setSecurityForm((cur) => ({ ...cur, newPassword: e.target.value }))} />
                    <Input type="password" label="Confirm New Password" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm((cur) => ({ ...cur, confirmPassword: e.target.value }))} />
                    <div className="md:col-span-2">
                      <Button type="submit" loading={changePasswordMutation.isPending}><LockKeyhole className="h-4 w-4" />Change Password</Button>
                    </div>
                  </form>
                )}
              </Card>
            ) : null}

            {tab === 'notifications' ? (
              <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                {preferencesUnavailable || preferencesQuery.isError ? (
                  <p className="text-sm text-[var(--sf-text-muted)]">Notification preferences are currently unavailable.</p>
                ) : (
                  <div className="space-y-3">
                    <Checkbox label="Booking Updates" checked={Boolean(preferenceForm.bookingUpdates)} onChange={(e) => setDraftPreferences((cur) => ({ ...cur, bookingUpdates: e.target.checked }))} />
                    <Checkbox label="Job Updates" checked={Boolean(preferenceForm.jobUpdates)} onChange={(e) => setDraftPreferences((cur) => ({ ...cur, jobUpdates: e.target.checked }))} />
                    <Checkbox label="System Updates" checked={Boolean(preferenceForm.systemUpdates)} onChange={(e) => setDraftPreferences((cur) => ({ ...cur, systemUpdates: e.target.checked }))} />
                    <Checkbox label="Email Notifications" checked={Boolean(preferenceForm.emailNotifications)} onChange={(e) => setDraftPreferences((cur) => ({ ...cur, emailNotifications: e.target.checked }))} />
                    <Checkbox label="SMS Notifications" checked={Boolean(preferenceForm.smsNotifications)} onChange={(e) => setDraftPreferences((cur) => ({ ...cur, smsNotifications: e.target.checked }))} />
                    <Button type="button" onClick={onSavePreferences} loading={updatePreferencesMutation.isPending}>Save Preferences</Button>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === 'preferences' ? (
              <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                <p className="mb-3 text-sm text-[var(--sf-text-muted)]">Theme Preference</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { key: 'light', label: 'Light', icon: Sun },
                    { key: 'dark', label: 'Dark', icon: Moon },
                    { key: 'system', label: 'System', icon: Monitor },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.key} type="button" onClick={() => setTheme(item.key)} className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${theme === item.key ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]' : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-main)]'}`}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ) : null}

            {tab === 'provider' && roleKey === 'provider' ? (
              <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                {providerProfile ? (
                  <form className="space-y-4" onSubmit={onSaveProvider}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input label="Service Category" value={providerProfile?.category?.name || '--'} readOnly />
                      <Input label="Verification Status" value={providerProfile?.status || '--'} readOnly />
                      <Input label="Experience (years)" value={providerForm.experienceYears} onChange={(e) => setDraftProvider((cur) => ({ ...cur, experienceYears: e.target.value }))} />
                      <Input label="Availability" value={providerProfile?.availability?.availableToday ? 'Available' : 'Unavailable'} readOnly />
                    </div>
                    <Textarea label="Bio" value={providerForm.bio} onChange={(e) => setDraftProvider((cur) => ({ ...cur, bio: e.target.value }))} />
                    <Input label="Expertise (comma separated)" value={providerForm.expertise} onChange={(e) => setDraftProvider((cur) => ({ ...cur, expertise: e.target.value }))} />
                    <p className="text-xs text-[var(--sf-text-muted)]">Verification documents are handled during provider onboarding workflow.</p>
                    <Button type="submit" loading={updateProviderProfileMutation.isPending}>Save Provider Details</Button>
                  </form>
                ) : (
                  <p className="text-sm text-[var(--sf-text-muted)]">Provider profile details are unavailable right now.</p>
                )}
              </Card>
            ) : null}

            {tab === 'admin' && roleKey === 'admin' ? (
              <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                <p className="text-sm text-[var(--sf-text-muted)]">Admin permission management is backend-controlled and read-only from this page.</p>
              </Card>
            ) : null}

            <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <p className="mb-3 text-sm font-semibold text-[var(--sf-text-main)]">Account Actions</p>
              <Button type="button" variant="outline" onClick={logout}>Logout</Button>
              <p className="mt-3 text-xs text-[var(--sf-text-muted)]">Account delete/deactivate actions are hidden because backend endpoint is not configured.</p>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileSettingsView;
