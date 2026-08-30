import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Moon, RefreshCw, Sun } from 'lucide-react';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Textarea } from '../../../components/ui/Input/Textarea';
import { Checkbox } from '../../../components/ui/Input/Checkbox';
import { Card } from '../../../components/ui/Layout/Card';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { useTheme } from '../../../context/ThemeContext';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { toArray } from '../../../utils/collection';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { adminApi } from '../api/admin.api';

const sections = [
  { key: 'profile', label: 'Profile' },
  { key: 'platform', label: 'Platform' },
  { key: 'contact', label: 'Contact Info' },
  { key: 'booking', label: 'Booking & Dispatch' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'security', label: 'Security' },
  { key: 'appearance', label: 'Appearance' },
];

const EMPTY_FAQ_FORM = {
  question: '',
  answer: '',
  category: '',
  displayOrder: 0,
  isActive: true,
  showOnHome: true,
};

function LoadingCard() {
  return <div className="h-36 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />;
}

function SectionUnavailable({ message }) {
  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <p className="text-sm text-[var(--sf-text-muted)]">{message}</p>
    </Card>
  );
}

function ReadOnlyConfigCard({ title, message }) {
  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{message}</p>
      <div className="mt-4 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3 text-xs text-[var(--sf-text-muted)]">
        Managed by backend configuration
      </div>
    </Card>
  );
}

function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('profile');
  const [draft, setDraft] = useState({});
  const [faqForm, setFaqForm] = useState(EMPTY_FAQ_FORM);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const adminSettings = useAdminSettings();

  const faqsQuery = useQuery({
    queryKey: ['admin', 'faqs'],
    queryFn: async () => {
      const payload = await adminApi.faqs({ page: 1, limit: 200 });
      return toArray(payload, ['faqs']);
    },
    retry: 1,
  });

  const invalidateFaqs = () => queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });

  const createFaqMutation = useMutation({
    mutationFn: adminApi.createFaq,
    onSuccess: invalidateFaqs,
  });

  const updateFaqMutation = useMutation({
    mutationFn: adminApi.updateFaq,
    onSuccess: invalidateFaqs,
  });

  const deleteFaqMutation = useMutation({
    mutationFn: adminApi.deleteFaq,
    onSuccess: invalidateFaqs,
  });

  const me = useMemo(() => adminSettings.meQuery.data?.user || adminSettings.meQuery.data || {}, [adminSettings.meQuery.data]);
  const platformResult = useMemo(() => adminSettings.platformQuery.data || {}, [adminSettings.platformQuery.data]);
  const platform = useMemo(() => platformResult?.data || platformResult || {}, [platformResult]);
  const platformSource = platformResult?.source || null;
  const supportsPlatformWrite = platformSource === '/admin/settings/site';

  const profileForm = useMemo(
    () => ({
      fullName: draft.fullName ?? me?.fullName ?? me?.name ?? '',
      email: draft.email ?? me?.email ?? '',
      phone: draft.phone ?? me?.phone ?? '',
    }),
    [draft, me]
  );

  const platformForm = useMemo(
    () => ({
      siteName: draft.siteName ?? platform?.siteName ?? '',
      tagline: draft.tagline ?? platform?.tagline ?? '',
      description: draft.description ?? platform?.description ?? '',
      logoUrl: draft.logoUrl ?? platform?.logoUrl ?? '',
      faviconUrl: draft.faviconUrl ?? platform?.faviconUrl ?? '',
    }),
    [draft, platform]
  );

  const onRefresh = () => {
    adminSettings.meQuery.refetch();
    adminSettings.platformQuery.refetch();
    faqsQuery.refetch();
  };

  const onSaveProfile = async (event) => {
    event.preventDefault();
    try {
      await adminSettings.updateProfileMutation.mutateAsync({
        fullName: profileForm.fullName?.trim(),
        name: profileForm.fullName?.trim(),
        phone: profileForm.phone?.trim(),
      });
      appToast.success('Profile settings saved.');
      setDraft((prev) => ({ ...prev, fullName: undefined, phone: undefined }));
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to save profile settings right now.'));
    }
  };

  const onSavePlatform = async (event) => {
    event.preventDefault();
    if (!supportsPlatformWrite) return;
    try {
      await adminSettings.updatePlatformMutation.mutateAsync(platformForm);
      appToast.success('Platform settings saved.');
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to save platform settings right now.'));
    }
  };

  const resetFaqForm = () => {
    setEditingFaqId(null);
    setFaqForm(EMPTY_FAQ_FORM);
  };

  const onSaveFaq = async (event) => {
    event.preventDefault();

    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      appToast.error('Question and answer are required.');
      return;
    }

    const payload = {
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      category: faqForm.category.trim() || null,
      displayOrder: Number(faqForm.displayOrder || 0),
      isActive: Boolean(faqForm.isActive),
      showOnHome: Boolean(faqForm.showOnHome),
    };

    try {
      if (editingFaqId) {
        await updateFaqMutation.mutateAsync({ id: editingFaqId, payload });
        appToast.success('FAQ updated.');
      } else {
        await createFaqMutation.mutateAsync(payload);
        appToast.success('FAQ created.');
      }
      resetFaqForm();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to save FAQ right now.'));
    }
  };

  const onEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || faq.section || '',
      displayOrder: Number(faq.displayOrder ?? faq.sortOrder ?? 0),
      isActive: faq.isActive !== false,
      showOnHome:
        faq.showOnHome === true ||
        String(faq.section || '').trim().toLowerCase() === 'home',
    });
  };

  const onDeleteFaq = async () => {
    if (!faqToDelete?.id) return;
    try {
      await deleteFaqMutation.mutateAsync(faqToDelete.id);
      appToast.success('FAQ deleted.');
      if (editingFaqId === faqToDelete.id) {
        resetFaqForm();
      }
      setFaqToDelete(null);
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to delete FAQ right now.'));
    }
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="Manage admin preferences, platform information, and available content configuration."
        actions={(
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((item) => (
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
        adminSettings.meQuery.isLoading || adminSettings.meQuery.isFetching ? (
          <LoadingCard />
        ) : adminSettings.meQuery.isError ? (
          <SectionUnavailable message="Unable to load settings right now." />
        ) : (
          <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSaveProfile}>
              <Input label="Full Name" value={profileForm.fullName} onChange={(e) => setDraft((cur) => ({ ...cur, fullName: e.target.value }))} />
              <Input label="Email" value={profileForm.email} readOnly />
              <Input label="Phone" value={profileForm.phone} onChange={(e) => setDraft((cur) => ({ ...cur, phone: e.target.value }))} />
              <Input label="Role" value={me?.role || 'ADMIN'} readOnly />
              <div className="md:col-span-2">
                <Button type="submit" loading={adminSettings.updateProfileMutation.isPending} disabled={adminSettings.updateProfileMutation.isPending}>
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>
        )
      ) : null}

      {tab === 'platform' ? (
        adminSettings.platformQuery.isLoading || adminSettings.platformQuery.isFetching ? (
          <LoadingCard />
        ) : adminSettings.platformQuery.isError ? (
          <ReadOnlyConfigCard
            title="Platform"
            message="Public platform details are currently managed by backend configuration."
          />
        ) : supportsPlatformWrite ? (
          <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSavePlatform}>
              <Input label="Platform Name" value={platformForm.siteName} onChange={(e) => setDraft((cur) => ({ ...cur, siteName: e.target.value }))} />
              <Input label="Tagline" value={platformForm.tagline} onChange={(e) => setDraft((cur) => ({ ...cur, tagline: e.target.value }))} />
              <div className="md:col-span-2">
                <Textarea label="Short Description" value={platformForm.description} onChange={(e) => setDraft((cur) => ({ ...cur, description: e.target.value }))} />
              </div>
              <Input label="Logo URL" value={platformForm.logoUrl} onChange={(e) => setDraft((cur) => ({ ...cur, logoUrl: e.target.value }))} />
              <Input label="Favicon URL" value={platformForm.faviconUrl} onChange={(e) => setDraft((cur) => ({ ...cur, faviconUrl: e.target.value }))} />
              <div className="md:col-span-2">
                <Button type="submit" loading={adminSettings.updatePlatformMutation.isPending} disabled={adminSettings.updatePlatformMutation.isPending}>
                  Save Platform Settings
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <ReadOnlyConfigCard
            title="Platform"
            message="Platform details are currently loaded as read-only content from system configuration."
          />
        )
      ) : null}

      {tab === 'contact' ? (
        <ReadOnlyConfigCard
          title="Contact Info"
          message="Public contact details are managed from platform configuration. Contact form messages are handled through the support workflow when enabled."
        />
      ) : null}

      {tab === 'booking' ? (
        <ReadOnlyConfigCard
          title="Booking & Dispatch"
          message="Dispatch timing, queue workers, provider matching, and expiry behavior are managed by backend configuration for reliability."
        />
      ) : null}

      {tab === 'notifications' ? (
        <ReadOnlyConfigCard
          title="Notifications"
          message="Email delivery, OTP, job alerts, and in-app notification delivery are controlled by backend services and environment variables."
        />
      ) : null}

      {tab === 'faqs' ? (
        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Homepage FAQs</h2>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
            Manage FAQ content shown across public pages. Enable &quot;Show on home&quot; for homepage FAQs.
          </p>

          <form className="mt-4 grid gap-4" onSubmit={onSaveFaq}>
            <Input
              label="Question"
              value={faqForm.question}
              onChange={(event) => setFaqForm((prev) => ({ ...prev, question: event.target.value }))}
            />
            <Textarea
              label="Answer"
              value={faqForm.answer}
              onChange={(event) => setFaqForm((prev) => ({ ...prev, answer: event.target.value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Category / Section"
                value={faqForm.category}
                onChange={(event) => setFaqForm((prev) => ({ ...prev, category: event.target.value }))}
                hint="Examples: home, services, provider, how-it-works"
              />
              <Input
                label="Display Order"
                type="number"
                value={faqForm.displayOrder}
                onChange={(event) => setFaqForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Checkbox
                label="Active"
                checked={Boolean(faqForm.isActive)}
                onChange={(event) => setFaqForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              <Checkbox
                label="Show on Home"
                checked={Boolean(faqForm.showOnHome)}
                onChange={(event) => setFaqForm((prev) => ({ ...prev, showOnHome: event.target.checked }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                loading={createFaqMutation.isPending || updateFaqMutation.isPending}
                disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
              >
                {editingFaqId ? 'Update FAQ' : 'Create FAQ'}
              </Button>
              <Button type="button" variant="outline" onClick={resetFaqForm}>
                Reset
              </Button>
            </div>
          </form>

          <div className="mt-6">
            {faqsQuery.isLoading || faqsQuery.isFetching ? (
              <div className="h-20 animate-pulse rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)]" />
            ) : null}

            {faqsQuery.isError ? (
              <SectionUnavailable message={getErrorMessage(faqsQuery.error, 'Unable to load FAQs right now.')} />
            ) : null}

            {!faqsQuery.isLoading && !faqsQuery.isError && !faqsQuery.data?.length ? (
              <p className="text-sm text-[var(--sf-text-muted)]">No FAQs added yet.</p>
            ) : null}

            {!faqsQuery.isLoading && !faqsQuery.isError && faqsQuery.data?.length ? (
              <div className="space-y-3">
                {faqsQuery.data.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--sf-text-main)]">{faq.question}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--sf-text-muted)]">
                        <span className="rounded-full border border-[var(--sf-border)] px-2 py-0.5">
                          {faq.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <span className="rounded-full border border-[var(--sf-border)] px-2 py-0.5">
                          {faq.showOnHome || String(faq.section || '').toLowerCase() === 'home'
                            ? 'Home'
                            : faq.category || faq.section || 'General'}
                        </span>
                        <span className="rounded-full border border-[var(--sf-border)] px-2 py-0.5">
                          Order {faq.displayOrder ?? faq.sortOrder ?? 0}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{faq.answer}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl"
                        onClick={() => onEditFaq(faq)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl"
                        onClick={() => setFaqToDelete({ id: faq.id, question: faq.question })}
                        disabled={deleteFaqMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {tab === 'security' ? (
        <ReadOnlyConfigCard
          title="Security"
          message="Authentication, role permissions, rate limits, and account protection are enforced by backend security configuration."
        />
      ) : null}

      {tab === 'appearance' ? (
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
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTheme(item.key)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${
                    theme === item.key
                      ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]'
                      : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-main)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={Boolean(faqToDelete)}
        onClose={() => setFaqToDelete(null)}
        onConfirm={onDeleteFaq}
        title="Delete FAQ?"
        description={`Are you sure you want to delete "${faqToDelete?.question || 'this FAQ'}"?`}
        confirmLabel="Delete"
        confirmLoading={deleteFaqMutation.isPending}
      />
    </Container>
  );
}

export default AdminSettings;
