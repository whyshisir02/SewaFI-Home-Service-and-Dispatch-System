import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  Loader2,
  MapPin,
  TrendingUp,
  UploadCloud,
  UserRound,
  UsersRound,
  Wrench,
} from 'lucide-react';
import { AuthBrandPanel } from '../components/AuthBrandPanel';
import { PasswordInput } from '../components/PasswordInput';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { PhoneInput } from '../../../components/ui/Input/PhoneInput';
import { Select } from '../../../components/ui/Input/Select';
import { Textarea } from '../../../components/ui/Input/Textarea';
import { ROUTES } from '../../../constants/routes.constant';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { logoAssets } from '../../../assets/logos';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import { toArray } from '../../../utils/collection';
import { AUTH_ROLE } from '../constants/auth.constant';
import { RegisterRoleTabs } from '../components/RegisterRoleTabs';
import { useRegister } from '../hooks/useRegister';
import { normalizePhoneDigits, toNepalE164 } from '../utils/registerValidation';
import {
  customerRegisterSchema,
  providerAccountSchema,
  providerServiceSchema,
  providerAddressVerificationSchema,
} from '../validators/register.schema';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';
import { useServicesByCategory } from '../../services/hooks/useServices';
import { useDistricts, useMunicipalities, useProvinces } from '../../location/hooks/useLocations';

const dashboardRouteByRole = {
  CUSTOMER: ROUTES.customer.dashboard,
  PROVIDER: ROUTES.provider.dashboard,
  ADMIN: ROUTES.admin.dashboard,
};

const defaultCustomerValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  province: '',
  district: '',
  municipality: '',
  ward: '',
  streetAddress: '',
};

const defaultProviderValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  categoryId: '',
  serviceIds: [],
  experienceYears: '',
  province: '',
  district: '',
  municipality: '',
  ward: '',
  streetAddress: '',
  bio: '',
  expertise: '',
  citizenshipNumber: '',
};

const registerTrustItems = [
  { label: 'For customers and providers', icon: UsersRound },
  { label: 'Verified service workflow', icon: BadgeCheck },
  { label: 'Location-based opportunities', icon: TrendingUp },
];

const PROVIDER_STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'service', label: 'Service Profile' },
  { id: 'address', label: 'Address & Verification' },
];

const safeRegisterRole = (value) => (value === AUTH_ROLE.PROVIDER ? AUTH_ROLE.PROVIDER : AUTH_ROLE.CUSTOMER);

const safeRedirect = (redirect) => (redirect?.startsWith('/') ? redirect : null);

const mapOption = (item) => {
  if (typeof item === 'string') return { value: item, label: item };
  return {
    value: item?.id || item?.code || item?.name || item?.slug || '',
    label: item?.name || item?.label || item?.title || item?.code || '',
  };
};

const parseValidationErrors = (error) => {
  const entries = Array.isArray(error?.response?.data?.errors) ? error.response.data.errors : [];
  const fieldErrors = {};

  entries.forEach((entry) => {
    const text = typeof entry === 'string' ? entry : entry?.message || entry?.msg || '';
    if (!text) return;

    const [fieldPart, ...messageParts] = String(text).split(':');
    const field = String(fieldPart || '').trim();
    const message = String(messageParts.join(':') || text).trim();
    if (!field || !message) return;

    if (field === 'name') fieldErrors.name = message;
    if (field === 'phone') fieldErrors.phone = message;
    if (field === 'email') fieldErrors.email = message;
  });

  return fieldErrors;
};

function FriendlyError({ message }) {
  if (!message) return null;

  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--sf-danger)]/30 bg-[var(--sf-danger)]/10 p-4 text-sm text-[var(--sf-danger)]" role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

function ProviderVerificationNotice() {
  return (
    <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-secondary-soft)]/70 p-4 text-sm leading-6 text-[var(--sf-text-muted)]">
      <p className="font-semibold text-[var(--sf-text-main)]">Provider accounts require admin verification before receiving jobs.</p>
      <p className="mt-1">Submit accurate service and location details so the approval process can move smoothly.</p>
    </div>
  );
}

function AddressFields({ form, provinceOptions, districtOptions, municipalityOptions, loadingProvinces, loadingDistricts, loadingMunicipalities }) {
  const { register, watch, setValue, formState: { errors } } = form;

  const resetDependents = (field) => {
    if (field === 'province') {
      setValue('district', '', { shouldValidate: false });
      setValue('municipality', '', { shouldValidate: false });
    }
    if (field === 'district') {
      setValue('municipality', '', { shouldValidate: false });
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[var(--sf-text-main)]">Address Details</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">Used for booking, dispatch matching, and account verification.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Province"
          error={errors.province?.message}
          disabled={loadingProvinces}
          options={provinceOptions}
          placeholder={loadingProvinces ? 'Loading locations...' : 'Select province'}
          value={watch('province')}
          onChange={(event) => {
            setValue('province', event.target.value, { shouldValidate: true });
            resetDependents('province');
          }}
        />
        <Select
          label="District"
          error={errors.district?.message}
          disabled={!watch('province') || loadingDistricts}
          options={districtOptions}
          placeholder={loadingDistricts ? 'Loading districts...' : 'Select district'}
          value={watch('district')}
          onChange={(event) => {
            setValue('district', event.target.value, { shouldValidate: true });
            resetDependents('district');
          }}
        />
        <Select
          label="Municipality"
          error={errors.municipality?.message}
          disabled={!watch('district') || loadingMunicipalities}
          options={municipalityOptions}
          placeholder={loadingMunicipalities ? 'Loading municipalities...' : 'Select municipality'}
          value={watch('municipality')}
          onChange={(event) => setValue('municipality', event.target.value, { shouldValidate: true })}
        />
        <Input
          label="Ward"
          required
          error={errors.ward?.message}
          placeholder="Enter ward number"
          {...register('ward')}
        />
      </div>
      <Input
        label="Address"
        required
        error={errors.streetAddress?.message}
        placeholder="Street address or nearby landmark"
        {...register('streetAddress')}
      />
    </section>
  );
}

function Register() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providerFiles, setProviderFiles] = useState({
    citizenshipFront: null,
    citizenshipBack: null,
  });
  const [fileErrors, setFileErrors] = useState({
    citizenshipFront: '',
    citizenshipBack: '',
  });
  const [providerStep, setProviderStep] = useState(PROVIDER_STEPS[0].id);
  const [formError, setFormError] = useState('');
  const authLogo = resolvedTheme === 'dark' ? logoAssets.logoAuthWhite : logoAssets.logoAuth;

  const activeRole = safeRegisterRole(searchParams.get('role'));
  const isProvider = activeRole === AUTH_ROLE.PROVIDER;
  const { sendOtpMutation } = useRegister(activeRole);
  const categoriesQuery = useServiceCategories();

  const customerForm = useForm({
    resolver: zodResolver(customerRegisterSchema),
    mode: 'onTouched',
    defaultValues: defaultCustomerValues,
  });

  const providerForm = useForm({
    resolver: undefined,
    mode: 'onTouched',
    defaultValues: defaultProviderValues,
  });

  const providerCategoryId = useWatch({ control: providerForm.control, name: 'categoryId' });
  const providerServiceIds = useWatch({ control: providerForm.control, name: 'serviceIds' });
  const providerPhoneValue = useWatch({ control: providerForm.control, name: 'phone' });
  const customerPhoneValue = useWatch({ control: customerForm.control, name: 'phone' });

  const providerServicesQuery = useServicesByCategory(providerCategoryId, { page: 1, limit: 100 }, {
    enabled: isProvider && Boolean(providerCategoryId),
  });
  const providerProvinceValue = useWatch({ control: providerForm.control, name: 'province' });
  const providerDistrictValue = useWatch({ control: providerForm.control, name: 'district' });
  const customerProvinceValue = useWatch({ control: customerForm.control, name: 'province' });
  const customerDistrictValue = useWatch({ control: customerForm.control, name: 'district' });
  const activeProvince = isProvider ? providerProvinceValue : customerProvinceValue;
  const activeDistrict = isProvider ? providerDistrictValue : customerDistrictValue;
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(activeProvince);
  const municipalitiesQuery = useMunicipalities(activeProvince, activeDistrict);

  const categoryOptions = useMemo(
    () => toArray(categoriesQuery.data, ['categories', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [categoriesQuery.data]
  );
  const providerServiceOptions = useMemo(
    () =>
      toArray(providerServicesQuery.data, ['services', 'items'])
        .filter((item) => item?.isActive !== false)
        .map((item) => ({
          id: item?.id,
          name: item?.name || 'Service',
          description: item?.description || '',
        }))
        .filter((item) => item.id),
    [providerServicesQuery.data]
  );
  const provinceOptions = useMemo(
    () => toArray(provincesQuery.data, ['provinces', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [provincesQuery.data]
  );
  const districtOptions = useMemo(
    () => toArray(districtsQuery.data, ['districts', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [districtsQuery.data]
  );
  const municipalityOptions = useMemo(
    () => toArray(municipalitiesQuery.data, ['municipalities', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [municipalitiesQuery.data]
  );

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return;
    navigate(dashboardRouteByRole[user?.role] || ROUTES.home, { replace: true });
  }, [isAuthenticated, isBootstrapping, navigate, user?.role]);

  const setRole = (role) => {
    setFormError('');
    setProviderStep(PROVIDER_STEPS[0].id);
    setSearchParams(role === AUTH_ROLE.PROVIDER ? { role: AUTH_ROLE.PROVIDER } : {});
  };

  const toggleProviderService = (serviceId) => {
    const id = String(serviceId || '').trim();
    if (!id) return;

    const current = providerForm.getValues('serviceIds');
    const currentIds = Array.isArray(current) ? current : [];
    const exists = currentIds.includes(id);
    const nextIds = exists ? currentIds.filter((item) => item !== id) : [...currentIds, id];
    providerForm.setValue('serviceIds', nextIds, { shouldValidate: true });
  };

  const applyBackendErrors = (error) => {
    const target = isProvider ? providerForm : customerForm;
    const backendFieldErrors = parseValidationErrors(error);
    Object.entries(backendFieldErrors).forEach(([field, message]) => {
      target.setError(field, { type: 'backend', message });
    });

    const message = getErrorMessage(error, 'Unable to create account right now. Please try again.');
    const normalized = message.toLowerCase();

    if (normalized.includes('email')) {
      target.setError('email', { type: 'backend', message });
    } else if (normalized.includes('phone')) {
      target.setError('phone', { type: 'backend', message });
    }

    const safeFormMessage =
      normalized.includes('validation failed') ||
      normalized.includes('invalid') ||
      normalized.includes('required')
        ? 'Please review the highlighted fields and try again.'
        : 'Unable to create account right now. Please try again.';

    setFormError(safeFormMessage);
  };

  const submitRegistration = async (payload) => {
    try {
      await sendOtpMutation.mutateAsync({ email: payload.email });
      appToast.success('Account details received. Please verify your OTP to continue.');
      navigate(ROUTES.verifyOtp, {
        state: {
          role: activeRole,
          formValues: payload,
          providerFiles,
          redirect: safeRedirect(new URLSearchParams(location.search).get('redirect')),
        },
      });
    } catch (error) {
      applyBackendErrors(error);
    }
  };

  const onCustomerSubmit = customerForm.handleSubmit((values) => {
    setFormError('');
    submitRegistration({
      name: values.name,
      email: values.email.trim().toLowerCase(),
      phone: toNepalE164(values.phone),
      password: values.password,
      province: values.province,
      district: values.district,
      municipality: values.municipality,
      ward: values.ward.trim(),
      streetAddress: values.streetAddress.trim(),
    });
  });

  const validateProviderStep = async (step) => {
    const schema =
      step === 'account'
        ? providerAccountSchema
        : step === 'service'
          ? providerServiceSchema
          : providerAddressVerificationSchema;

    const values = providerForm.getValues();
    const result = schema.safeParse(values);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === 'string') {
          providerForm.setError(field, { type: 'validation', message: issue.message });
        }
      });
      return null;
    }

    if (step === 'address') {
      let valid = true;
      if (!providerFiles.citizenshipFront) {
        setFileErrors((current) => ({ ...current, citizenshipFront: 'Citizenship front document is required.' }));
        valid = false;
      }
      if (!providerFiles.citizenshipBack) {
        setFileErrors((current) => ({ ...current, citizenshipBack: 'Citizenship back document is required.' }));
        valid = false;
      }
      if (!valid) return null;
    }

    return result.data;
  };

  const onProviderSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (providerStep === 'account') {
      const data = await validateProviderStep('account');
      if (data) setProviderStep('service');
      return;
    }

    if (providerStep === 'service') {
      const data = await validateProviderStep('service');
      if (data) setProviderStep('address');
      return;
    }

    const data = await validateProviderStep('address');
    if (!data) return;

    const all = providerForm.getValues();
    submitRegistration({
      name: all.name,
      email: all.email.trim().toLowerCase(),
      phone: toNepalE164(all.phone),
      password: all.password,
      categoryId: all.categoryId,
      serviceIds: JSON.stringify(
        Array.isArray(all.serviceIds)
          ? all.serviceIds.map((id) => String(id || '').trim()).filter(Boolean)
          : []
      ),
      experienceYears: all.experienceYears,
      province: all.province,
      district: all.district,
      municipality: all.municipality,
      ward: all.ward.trim(),
      streetAddress: all.streetAddress.trim(),
      bio: (all.bio || '').trim(),
      expertise: (all.expertise || '').trim(),
      citizenshipNumber: all.citizenshipNumber.trim(),
    });
  };

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--sf-bg)] px-4">
        <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-5 py-4 text-sm font-semibold text-[var(--sf-text-muted)]">
          Checking your session...
        </div>
      </main>
    );
  }

  const providerStepIndex = Math.max(
    0,
    PROVIDER_STEPS.findIndex((step) => step.id === providerStep)
  );
  const isProviderFinalStep = providerStep === 'address';
  const submitLabel =
    isProvider
      ? isProviderFinalStep
        ? 'Create Provider Account'
        : providerStep === 'account'
          ? 'Continue to Service Profile'
          : 'Continue to Address & Verification'
      : 'Create Customer Account';
  const submittingLabel = isProvider ? 'Submitting application...' : 'Creating account...';
  const goBackProviderStep = () => {
    const previousStep = PROVIDER_STEPS[providerStepIndex - 1];
    if (previousStep) setProviderStep(previousStep.id);
  };
  const isSubmitting = sendOtpMutation.isPending;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,var(--sf-secondary-soft),transparent_30%),radial-gradient(circle_at_85%_5%,var(--sf-primary-soft),transparent_28%),var(--sf-bg)] px-4 py-6 text-[var(--sf-text-main)] sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-7">
        <header className="flex items-center justify-between">
          <Link to={ROUTES.home} className="inline-flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--sf-secondary)]">
            <img src={authLogo} alt="SewaFi logo" className="h-12 w-auto object-contain" decoding="async" />
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-semibold text-[var(--sf-text-muted)] sm:inline-flex">
            <BadgeCheck className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
            Verified service workflow
          </div>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 lg:order-1">
            <AuthBrandPanel
              eyebrow="Join SewaFi"
              title="Join SewaFi and grow with trust"
              description="Create your account to book reliable home services or offer trusted services through SewaFi."
              trustItems={registerTrustItems}
              notice="Provider accounts require verification before receiving jobs."
              visualBadge="Provider ready"
              visualNote="Verified onboarding"
            />
          </div>

          <section className="order-1 lg:order-2">
            <div className="mx-auto max-w-xl rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-[var(--sf-shadow)] sm:p-8">
              <div className="mb-7">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                  {isProvider ? <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" /> : <UserRound className="h-6 w-6" aria-hidden="true" />}
                </span>
                <h1 className="mt-5 font-display text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">
                  Create your account
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
                  Choose your account type and fill in the details below.
                </p>
              </div>

              <RegisterRoleTabs value={activeRole} onChange={setRole} />

              {isProvider ? (
                <form className="mt-6 space-y-5" onSubmit={onProviderSubmit} noValidate>
                  <FriendlyError message={formError} />

                  <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)]/60 p-4">
                    <ol className="grid gap-2 sm:grid-cols-3">
                      {PROVIDER_STEPS.map((step, index) => {
                        const isCurrent = step.id === providerStep;
                        const isCompleted = index < providerStepIndex;

                        return (
                          <li
                            key={step.id}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                              isCurrent
                                ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]'
                                : isCompleted
                                  ? 'border-[var(--sf-accent)]/40 bg-[var(--sf-accent-soft)]/30 text-[var(--sf-accent)]'
                                  : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]'
                            }`}
                          >
                            {index + 1}. {step.label}
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {providerStep === 'account' ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Full Name"
                          required
                          error={providerForm.formState.errors.name?.message}
                          placeholder="Enter your full name"
                          {...providerForm.register('name')}
                        />
                        <Input
                          label="Email Address"
                          required
                          type="email"
                          error={providerForm.formState.errors.email?.message}
                          placeholder="Enter your email address"
                          {...providerForm.register('email')}
                        />
                        <PhoneInput
                          label="Phone Number"
                          required
                          error={providerForm.formState.errors.phone?.message}
                          value={providerPhoneValue}
                          onChange={(event) => providerForm.setValue('phone', normalizePhoneDigits(event.target.value), { shouldValidate: true })}
                        />
                        <div className="hidden sm:block" aria-hidden="true" />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <PasswordInput
                          id="provider-password"
                          label="Password"
                          error={providerForm.formState.errors.password?.message}
                          onChange={(event) => providerForm.setValue('password', event.target.value, { shouldValidate: true })}
                          disabled={isSubmitting}
                          autoComplete="new-password"
                          placeholder="Create a password"
                        />
                        <PasswordInput
                          id="provider-confirm-password"
                          name="confirmPassword"
                          label="Confirm Password"
                          error={providerForm.formState.errors.confirmPassword?.message}
                          onChange={(event) => providerForm.setValue('confirmPassword', event.target.value, { shouldValidate: true })}
                          disabled={isSubmitting}
                          autoComplete="new-password"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </>
                  ) : null}

                  {providerStep === 'service' ? (
                    <>
                      <ProviderVerificationNotice />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                          label="Service Category"
                          error={
                            providerForm.formState.errors.categoryId?.message ||
                            (categoriesQuery.isError ? 'Unable to load service categories.' : '')
                          }
                          disabled={categoriesQuery.isLoading || categoriesQuery.isError}
                          options={categoryOptions}
                          placeholder={categoriesQuery.isLoading ? 'Loading categories...' : categoryOptions.length ? 'Select a category' : 'Service categories unavailable'}
                          value={providerCategoryId}
                          onChange={(event) => {
                            providerForm.setValue('categoryId', event.target.value, { shouldValidate: true });
                            providerForm.setValue('serviceIds', [], { shouldValidate: false });
                          }}
                        />
                        <Input
                          label="Experience"
                          required
                          type="number"
                          min="0"
                          error={providerForm.formState.errors.experienceYears?.message}
                          placeholder="Years of experience"
                          {...providerForm.register('experienceYears')}
                        />
                      </div>

                      <section className="space-y-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)]/50 p-4">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                          <h3 className="text-sm font-semibold text-[var(--sf-text-main)]">Services you provide</h3>
                        </div>

                        {!providerCategoryId ? (
                          <p className="text-sm text-[var(--sf-text-muted)]">Select a service category to choose your exact services.</p>
                        ) : providerServicesQuery.isLoading ? (
                          <p className="text-sm text-[var(--sf-text-muted)]">Loading services...</p>
                        ) : providerServicesQuery.isError ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--sf-text-muted)]">
                            <span>Unable to load services for the selected category.</span>
                            <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => providerServicesQuery.refetch()}>
                              Retry
                            </Button>
                          </div>
                        ) : providerServiceOptions.length ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {providerServiceOptions.map((item) => {
                              const checked = Array.isArray(providerServiceIds) && providerServiceIds.includes(item.id);
                              return (
                                <label
                                  key={item.id}
                                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                                    checked
                                      ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)]/50'
                                      : 'border-[var(--sf-border)] bg-[var(--sf-surface)]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-[var(--sf-border)] text-[var(--sf-secondary)] focus:ring-[var(--sf-secondary)]"
                                    checked={checked}
                                    onChange={() => toggleProviderService(item.id)}
                                  />
                                  <span className="min-w-0">
                                    <span className="block font-medium text-[var(--sf-text-main)]">{item.name}</span>
                                    {item.description ? (
                                      <span className="block text-xs text-[var(--sf-text-muted)]">{item.description}</span>
                                    ) : null}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--sf-text-muted)]">No active services are available under this category yet.</p>
                        )}

                        {providerForm.formState.errors.serviceIds?.message ? (
                          <p className="text-xs font-medium text-[var(--sf-danger)]">{providerForm.formState.errors.serviceIds.message}</p>
                        ) : null}
                      </section>

                      <Textarea
                        label="Professional Bio"
                        error={providerForm.formState.errors.bio?.message}
                        placeholder="Tell customers about your experience and service quality."
                        {...providerForm.register('bio')}
                      />
                      <Textarea
                        label="Specialized Expertise"
                        hint="Optional specialties or service focus areas"
                        error={providerForm.formState.errors.expertise?.message}
                        placeholder="Examples: leak detection, AC servicing, deep cleaning"
                        {...providerForm.register('expertise')}
                      />
                    </>
                  ) : null}

                  {providerStep === 'address' ? (
                    <>
                      <ProviderVerificationNotice />
                      <AddressFields
                        form={providerForm}
                        provinceOptions={provinceOptions}
                        districtOptions={districtOptions}
                        municipalityOptions={municipalityOptions}
                        loadingProvinces={provincesQuery.isLoading}
                        loadingDistricts={districtsQuery.isLoading}
                        loadingMunicipalities={municipalitiesQuery.isLoading}
                      />

                      <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-3 text-sm text-[var(--sf-text-muted)]">
                        <div className="flex items-center gap-2 font-semibold text-[var(--sf-text-main)]">
                          <MapPin className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                          Working location
                        </div>
                        <p className="mt-2 leading-6">Dispatch opportunities will be matched using your selected service area.</p>
                      </div>

                      <section className="space-y-4">
                        <div>
                          <h2 className="text-base font-bold text-[var(--sf-text-main)]">Provider Documents</h2>
                          <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">Upload the verification documents required before provider approval.</p>
                        </div>
                        <Input
                          label="Citizenship Number"
                          required
                          error={providerForm.formState.errors.citizenshipNumber?.message}
                          placeholder="Enter citizenship number"
                          {...providerForm.register('citizenshipNumber')}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--sf-text-main)]">
                            <span>Citizenship Front</span>
                            <div className="rounded-2xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
                              <input
                                type="file"
                                className="sr-only"
                                id="citizenship-front"
                                accept=".png,.jpg,.jpeg,.pdf"
                                onChange={(event) => {
                                  setProviderFiles((current) => ({ ...current, citizenshipFront: event.target.files?.[0] || null }));
                                  setFileErrors((current) => ({ ...current, citizenshipFront: '' }));
                                }}
                              />
                              <label htmlFor="citizenship-front" className="flex cursor-pointer flex-col items-center gap-2 text-center">
                                <UploadCloud className="h-5 w-5 text-[var(--sf-secondary)]" aria-hidden="true" />
                                <span className="font-semibold text-[var(--sf-text-main)]">Choose front document</span>
                                <span className="text-xs text-[var(--sf-text-muted)]">{providerFiles.citizenshipFront?.name || 'PNG, JPG, or PDF'}</span>
                              </label>
                            </div>
                            {fileErrors.citizenshipFront ? <span className="text-xs text-[var(--sf-danger)]">{fileErrors.citizenshipFront}</span> : null}
                          </label>

                          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--sf-text-main)]">
                            <span>Citizenship Back</span>
                            <div className="rounded-2xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
                              <input
                                type="file"
                                className="sr-only"
                                id="citizenship-back"
                                accept=".png,.jpg,.jpeg,.pdf"
                                onChange={(event) => {
                                  setProviderFiles((current) => ({ ...current, citizenshipBack: event.target.files?.[0] || null }));
                                  setFileErrors((current) => ({ ...current, citizenshipBack: '' }));
                                }}
                              />
                              <label htmlFor="citizenship-back" className="flex cursor-pointer flex-col items-center gap-2 text-center">
                                <UploadCloud className="h-5 w-5 text-[var(--sf-secondary)]" aria-hidden="true" />
                                <span className="font-semibold text-[var(--sf-text-main)]">Choose back document</span>
                                <span className="text-xs text-[var(--sf-text-muted)]">{providerFiles.citizenshipBack?.name || 'PNG, JPG, or PDF'}</span>
                              </label>
                            </div>
                            {fileErrors.citizenshipBack ? <span className="text-xs text-[var(--sf-danger)]">{fileErrors.citizenshipBack}</span> : null}
                          </label>
                        </div>
                      </section>
                    </>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {providerStepIndex > 0 ? (
                      <Button type="button" variant="outline" className="h-12 rounded-xl" disabled={isSubmitting} onClick={goBackProviderStep}>
                        Back
                      </Button>
                    ) : null}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-12 rounded-xl bg-[var(--sf-secondary)] text-white hover:bg-[var(--sf-secondary)]/90 sm:min-w-[240px]"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      {isSubmitting ? submittingLabel : submitLabel}
                    </Button>
                  </div>

                  {providerStep === 'service' && categoriesQuery.isError ? (
                    <div className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-3 text-sm text-[var(--sf-text-muted)]">
                      <span>Unable to load service categories.</span>
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => categoriesQuery.refetch()}>
                        Retry
                      </Button>
                    </div>
                  ) : null}
                </form>
              ) : (
                <form className="mt-6 space-y-5" onSubmit={onCustomerSubmit} noValidate>
                  <FriendlyError message={formError} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Full Name"
                      required
                      error={customerForm.formState.errors.name?.message}
                      placeholder="Enter your full name"
                      {...customerForm.register('name')}
                    />
                    <Input
                      label="Email Address"
                      required
                      type="email"
                      error={customerForm.formState.errors.email?.message}
                      placeholder="Enter your email address"
                      {...customerForm.register('email')}
                    />
                    <PhoneInput
                      label="Phone Number"
                      required
                      error={customerForm.formState.errors.phone?.message}
                      value={customerPhoneValue}
                      onChange={(event) => customerForm.setValue('phone', normalizePhoneDigits(event.target.value), { shouldValidate: true })}
                    />
                    <div className="hidden sm:block" aria-hidden="true" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <PasswordInput
                      id="customer-password"
                      label="Password"
                      error={customerForm.formState.errors.password?.message}
                      onChange={(event) => customerForm.setValue('password', event.target.value, { shouldValidate: true })}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      placeholder="Create a password"
                    />
                    <PasswordInput
                      id="customer-confirm-password"
                      name="confirmPassword"
                      label="Confirm Password"
                      error={customerForm.formState.errors.confirmPassword?.message}
                      onChange={(event) => customerForm.setValue('confirmPassword', event.target.value, { shouldValidate: true })}
                      disabled={isSubmitting}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <AddressFields
                    form={customerForm}
                    provinceOptions={provinceOptions}
                    districtOptions={districtOptions}
                    municipalityOptions={municipalityOptions}
                    loadingProvinces={provincesQuery.isLoading}
                    loadingDistricts={districtsQuery.isLoading}
                    loadingMunicipalities={municipalitiesQuery.isLoading}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl bg-[var(--sf-secondary)] text-white hover:bg-[var(--sf-secondary)]/90"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    {isSubmitting ? submittingLabel : submitLabel}
                  </Button>
                </form>
              )}

              <div className="mt-6 space-y-2 text-center text-sm text-[var(--sf-text-muted)]">
                <p>
                  Already have an account?{' '}
                  <Link to={ROUTES.login} className="font-semibold text-[var(--sf-secondary)] hover:underline">
                    Login
                  </Link>
                </p>
                <p className="text-xs text-[var(--sf-text-soft)]">
                  OTP verification is required before your registration is completed.
                </p>
              </div>
            </div>

            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]/75 p-4 text-center text-xs leading-5 text-[var(--sf-text-muted)]">
              Provider applications move through verification before job dispatch is enabled.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Register;
