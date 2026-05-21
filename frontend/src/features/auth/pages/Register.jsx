import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { AuthBrandPanel } from '../../../components/auth/AuthBrandPanel';
import { PasswordInput } from '../../../components/auth/PasswordInput';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { PhoneInput } from '../../../components/ui/Input/PhoneInput';
import { Select } from '../../../components/ui/Input/Select';
import { Textarea } from '../../../components/ui/Input/Textarea';
import { ROUTES } from '../../../constants/routes.constant';
import { useAuth } from '../../../context/AuthContext';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';
import logoUrl from '../../../assets/images/logos/sewafi-logo.svg';
import { AUTH_ROLE } from '../constants/auth.constant';
import { RegisterRoleTabs } from '../components/RegisterRoleTabs';
import { useRegister } from '../hooks/useRegister';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';
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

const safeRegisterRole = (value) => (value === AUTH_ROLE.PROVIDER ? AUTH_ROLE.PROVIDER : AUTH_ROLE.CUSTOMER);

const safeRedirect = (redirect) => (redirect?.startsWith('/') ? redirect : null);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const toCollection = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const mapOption = (item) => {
  if (typeof item === 'string') return { value: item, label: item };
  return {
    value: item?.id || item?.code || item?.name || item?.slug || '',
    label: item?.name || item?.label || item?.title || item?.code || '',
  };
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

function AddressFields({
  values,
  errors,
  onChange,
  provinceOptions,
  districtOptions,
  municipalityOptions,
  loadingProvinces,
  loadingDistricts,
  loadingMunicipalities,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[var(--sf-text-main)]">Address Details</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">Used for booking, dispatch matching, and account verification.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Province"
          value={values.province}
          onChange={onChange('province')}
          error={errors.province}
          disabled={loadingProvinces}
          options={provinceOptions}
          placeholder={loadingProvinces ? 'Loading locations...' : 'Select province'}
        />
        <Select
          label="District"
          value={values.district}
          onChange={onChange('district')}
          error={errors.district}
          disabled={!values.province || loadingDistricts}
          options={districtOptions}
          placeholder={loadingDistricts ? 'Loading districts...' : 'Select district'}
        />
        <Select
          label="Municipality"
          value={values.municipality}
          onChange={onChange('municipality')}
          error={errors.municipality}
          disabled={!values.district || loadingMunicipalities}
          options={municipalityOptions}
          placeholder={loadingMunicipalities ? 'Loading municipalities...' : 'Select municipality'}
        />
        <Input
          label="Ward"
          required
          value={values.ward}
          onChange={onChange('ward')}
          error={errors.ward}
          placeholder="Enter ward number"
        />
      </div>
      <Input
        label="Address"
        required
        value={values.streetAddress}
        onChange={onChange('streetAddress')}
        error={errors.streetAddress}
        placeholder="Street address or nearby landmark"
      />
    </section>
  );
}

function Register() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [customerValues, setCustomerValues] = useState(defaultCustomerValues);
  const [providerValues, setProviderValues] = useState(defaultProviderValues);
  const [providerFiles, setProviderFiles] = useState({
    citizenshipFront: null,
    citizenshipBack: null,
  });
  const [providerStep, setProviderStep] = useState('details');
  const [customerErrors, setCustomerErrors] = useState({});
  const [providerErrors, setProviderErrors] = useState({});
  const [formError, setFormError] = useState('');

  const activeRole = safeRegisterRole(searchParams.get('role'));
  const activeAddressValues = activeRole === AUTH_ROLE.PROVIDER ? providerValues : customerValues;
  const { sendOtpMutation } = useRegister(activeRole);
  const categoriesQuery = useServiceCategories();
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(activeAddressValues.province);
  const municipalitiesQuery = useMunicipalities(activeAddressValues.province, activeAddressValues.district);

  const categoryOptions = useMemo(
    () => toCollection(categoriesQuery.data, ['categories', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [categoriesQuery.data]
  );
  const provinceOptions = useMemo(
    () => toCollection(provincesQuery.data, ['provinces', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [provincesQuery.data]
  );
  const districtOptions = useMemo(
    () => toCollection(districtsQuery.data, ['districts', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [districtsQuery.data]
  );
  const municipalityOptions = useMemo(
    () => toCollection(municipalitiesQuery.data, ['municipalities', 'items']).map(mapOption).filter((item) => item.value && item.label),
    [municipalitiesQuery.data]
  );

  useEffect(() => {
    if (isBootstrapping || !isAuthenticated) return;
    navigate(dashboardRouteByRole[user?.role] || ROUTES.home, { replace: true });
  }, [isAuthenticated, isBootstrapping, navigate, user?.role]);

  const setRole = (role) => {
    setFormError('');
    setProviderStep('details');
    setSearchParams(role === AUTH_ROLE.PROVIDER ? { role: AUTH_ROLE.PROVIDER } : {});
  };

  const updateCustomerField = (field) => (event) => {
    const nextValue = event.target.value;
    setCustomerValues((current) => {
      if (field === 'province') {
        return { ...current, province: nextValue, district: '', municipality: '' };
      }

      if (field === 'district') {
        return { ...current, district: nextValue, municipality: '' };
      }

      return { ...current, [field]: nextValue };
    });
    setCustomerErrors((current) => ({ ...current, [field]: '' }));
    if (field === 'province') {
      setCustomerErrors((current) => ({ ...current, district: '', municipality: '' }));
    }
    if (field === 'district') {
      setCustomerErrors((current) => ({ ...current, municipality: '' }));
    }
    setFormError('');
  };

  const updateProviderField = (field) => (event) => {
    const nextValue = event.target.value;
    setProviderValues((current) => {
      if (field === 'province') {
        return { ...current, province: nextValue, district: '', municipality: '' };
      }

      if (field === 'district') {
        return { ...current, district: nextValue, municipality: '' };
      }

      return { ...current, [field]: nextValue };
    });
    setProviderErrors((current) => ({ ...current, [field]: '' }));
    if (field === 'province') {
      setProviderErrors((current) => ({ ...current, district: '', municipality: '' }));
    }
    if (field === 'district') {
      setProviderErrors((current) => ({ ...current, municipality: '' }));
    }
    setFormError('');
  };

  const validateCustomer = () => {
    const errors = {};
    if (!customerValues.name.trim()) errors.name = 'Full name is required.';
    if (!customerValues.email.trim()) errors.email = 'Email address is required.';
    if (customerValues.email.trim() && !emailRegex.test(customerValues.email.trim())) errors.email = 'Please enter a valid email address.';
    if (!customerValues.phone.trim()) errors.phone = 'Phone number is required.';
    if (!customerValues.password) errors.password = 'Password is required.';
    if (customerValues.password && !strongPasswordRegex.test(customerValues.password)) {
      errors.password = 'Use 8+ chars with uppercase, lowercase, number, and special character.';
    }
    if (!customerValues.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    if (customerValues.password && customerValues.confirmPassword && customerValues.password !== customerValues.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!customerValues.province) errors.province = 'Province is required.';
    if (!customerValues.district) errors.district = 'District is required.';
    if (!customerValues.municipality) errors.municipality = 'Municipality is required.';
    if (!customerValues.ward.trim()) errors.ward = 'Ward is required.';
    if (!customerValues.streetAddress.trim()) errors.streetAddress = 'Address is required.';
    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProviderDetails = () => {
    const errors = {};
    if (!providerValues.name.trim()) errors.name = 'Full name is required.';
    if (!providerValues.email.trim()) errors.email = 'Email address is required.';
    if (providerValues.email.trim() && !emailRegex.test(providerValues.email.trim())) errors.email = 'Please enter a valid email address.';
    if (!providerValues.phone.trim()) errors.phone = 'Phone number is required.';
    if (!providerValues.password) errors.password = 'Password is required.';
    if (providerValues.password && !strongPasswordRegex.test(providerValues.password)) {
      errors.password = 'Use 8+ chars with uppercase, lowercase, number, and special character.';
    }
    if (!providerValues.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    if (providerValues.password && providerValues.confirmPassword && providerValues.password !== providerValues.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!providerValues.categoryId) errors.categoryId = 'Service category is required.';
    if (!providerValues.experienceYears && providerValues.experienceYears !== 0) errors.experienceYears = 'Experience is required.';
    if (!providerValues.province) errors.province = 'Province is required.';
    if (!providerValues.district) errors.district = 'District is required.';
    if (!providerValues.municipality) errors.municipality = 'Municipality is required.';
    if (!providerValues.ward.trim()) errors.ward = 'Ward is required.';
    if (!providerValues.streetAddress.trim()) errors.streetAddress = 'Address is required.';
    setProviderErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProviderDocuments = () => {
    const errors = {};
    if (!providerValues.citizenshipNumber.trim()) errors.citizenshipNumber = 'Citizenship number is required.';
    if (!providerFiles.citizenshipFront) errors.citizenshipFront = 'Citizenship front document is required.';
    if (!providerFiles.citizenshipBack) errors.citizenshipBack = 'Citizenship back document is required.';
    setProviderErrors((current) => ({ ...current, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const buildCustomerPayload = () => ({
    name: customerValues.name.trim(),
    email: customerValues.email.trim().toLowerCase(),
    phone: customerValues.phone.trim(),
    password: customerValues.password,
    province: customerValues.province,
    district: customerValues.district,
    municipality: customerValues.municipality,
    ward: customerValues.ward.trim(),
    streetAddress: customerValues.streetAddress.trim(),
  });

  const buildProviderPayload = () => ({
    name: providerValues.name.trim(),
    email: providerValues.email.trim().toLowerCase(),
    phone: providerValues.phone.trim(),
    password: providerValues.password,
    categoryId: providerValues.categoryId,
    experienceYears: providerValues.experienceYears,
    province: providerValues.province,
    district: providerValues.district,
    municipality: providerValues.municipality,
    ward: providerValues.ward.trim(),
    streetAddress: providerValues.streetAddress.trim(),
    bio: providerValues.bio.trim(),
    expertise: providerValues.expertise.trim(),
    citizenshipNumber: providerValues.citizenshipNumber.trim(),
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (activeRole === AUTH_ROLE.PROVIDER && providerStep === 'details') {
      if (validateProviderDetails()) {
        setProviderStep('documents');
      }
      return;
    }

    const valid = activeRole === AUTH_ROLE.PROVIDER ? validateProviderDocuments() : validateCustomer();
    if (!valid) return;

    const payload = activeRole === AUTH_ROLE.PROVIDER ? buildProviderPayload() : buildCustomerPayload();

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
      const message = getErrorMessage(error, 'Unable to create account right now. Please try again.');
      const normalized = message.toLowerCase();

      if (normalized.includes('email')) {
        if (activeRole === AUTH_ROLE.PROVIDER) {
          setProviderErrors((current) => ({ ...current, email: message }));
        } else {
          setCustomerErrors((current) => ({ ...current, email: message }));
        }
      } else if (normalized.includes('phone')) {
        if (activeRole === AUTH_ROLE.PROVIDER) {
          setProviderErrors((current) => ({ ...current, phone: message }));
        } else {
          setCustomerErrors((current) => ({ ...current, phone: message }));
        }
      }

      setFormError(message);
    }
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

  const currentValues = activeRole === AUTH_ROLE.PROVIDER ? providerValues : customerValues;
  const currentErrors = activeRole === AUTH_ROLE.PROVIDER ? providerErrors : customerErrors;
  const submitLabel = activeRole === AUTH_ROLE.PROVIDER ? (providerStep === 'documents' ? 'Send OTP and Continue' : 'Continue to Documents') : 'Create Customer Account';
  const submittingLabel = activeRole === AUTH_ROLE.PROVIDER ? 'Submitting application...' : 'Creating account...';

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,var(--sf-secondary-soft),transparent_30%),radial-gradient(circle_at_85%_5%,var(--sf-primary-soft),transparent_28%),var(--sf-bg)] px-4 py-8 text-[var(--sf-text-main)] sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link to={ROUTES.home} className="inline-flex items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--sf-secondary)]">
            <img src={logoUrl} alt="SewaFi" className="h-12 w-auto" />
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
                  {activeRole === AUTH_ROLE.PROVIDER ? <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" /> : <UserRound className="h-6 w-6" aria-hidden="true" />}
                </span>
                <h1 className="mt-5 font-display text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">
                  Create your account
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
                  Choose your account type and fill in the details below.
                </p>
              </div>

              <RegisterRoleTabs value={activeRole} onChange={setRole} />

              <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
                <FriendlyError message={formError} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    required
                    value={currentValues.name}
                    onChange={activeRole === AUTH_ROLE.PROVIDER ? updateProviderField('name') : updateCustomerField('name')}
                    error={currentErrors.name}
                    placeholder="Enter your full name"
                  />
                  <Input
                    label="Email Address"
                    required
                    type="email"
                    value={currentValues.email}
                    onChange={activeRole === AUTH_ROLE.PROVIDER ? updateProviderField('email') : updateCustomerField('email')}
                    error={currentErrors.email}
                    placeholder="Enter your email address"
                  />
                  <PhoneInput
                    label="Phone Number"
                    required
                    value={currentValues.phone}
                    onChange={activeRole === AUTH_ROLE.PROVIDER ? updateProviderField('phone') : updateCustomerField('phone')}
                    error={currentErrors.phone}
                  />
                  <div className="hidden sm:block" aria-hidden="true" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PasswordInput
                    id={`${activeRole}-password`}
                    label="Password"
                    value={currentValues.password}
                    onChange={activeRole === AUTH_ROLE.PROVIDER ? updateProviderField('password') : updateCustomerField('password')}
                    error={currentErrors.password}
                    disabled={sendOtpMutation.isPending}
                    autoComplete="new-password"
                    placeholder="Create a password"
                  />
                  <PasswordInput
                    id={`${activeRole}-confirm-password`}
                    name="confirmPassword"
                    label="Confirm Password"
                    value={currentValues.confirmPassword}
                    onChange={activeRole === AUTH_ROLE.PROVIDER ? updateProviderField('confirmPassword') : updateCustomerField('confirmPassword')}
                    error={currentErrors.confirmPassword}
                    disabled={sendOtpMutation.isPending}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                  />
                </div>

                {activeRole === AUTH_ROLE.CUSTOMER ? (
                  <AddressFields
                    values={customerValues}
                    errors={customerErrors}
                    onChange={updateCustomerField}
                    provinceOptions={provinceOptions}
                    districtOptions={districtOptions}
                    municipalityOptions={municipalityOptions}
                    loadingProvinces={provincesQuery.isLoading}
                    loadingDistricts={districtsQuery.isLoading}
                    loadingMunicipalities={municipalitiesQuery.isLoading}
                  />
                ) : null}

                {activeRole === AUTH_ROLE.PROVIDER ? (
                  <>
                    <ProviderVerificationNotice />

                    {providerStep === 'details' ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Select
                            label="Service Category"
                            value={providerValues.categoryId}
                            onChange={updateProviderField('categoryId')}
                            error={providerErrors.categoryId || (categoriesQuery.isError ? 'Unable to load service categories.' : '')}
                            disabled={categoriesQuery.isLoading || categoriesQuery.isError}
                            options={categoryOptions}
                            placeholder={categoriesQuery.isLoading ? 'Loading categories...' : categoryOptions.length ? 'Select a category' : 'Service categories unavailable'}
                          />
                          <Input
                            label="Experience"
                            required
                            type="number"
                            min="0"
                            value={providerValues.experienceYears}
                            onChange={updateProviderField('experienceYears')}
                            error={providerErrors.experienceYears}
                            placeholder="Years of experience"
                          />
                        </div>

                        <AddressFields
                          values={providerValues}
                          errors={providerErrors}
                          onChange={updateProviderField}
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

                        <Textarea
                          label="Professional Bio"
                          value={providerValues.bio}
                          onChange={updateProviderField('bio')}
                          error={providerErrors.bio}
                          placeholder="Tell customers about your experience and service quality."
                        />
                        <Textarea
                          label="Specialized Expertise"
                          hint="Optional specialties or service focus areas"
                          value={providerValues.expertise}
                          onChange={updateProviderField('expertise')}
                          error={providerErrors.expertise}
                          placeholder="Examples: leak detection, AC servicing, deep cleaning"
                        />
                      </>
                    ) : (
                      <section className="space-y-4">
                        <div>
                          <h2 className="text-base font-bold text-[var(--sf-text-main)]">Provider Documents</h2>
                          <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">Upload the verification documents required before provider approval.</p>
                        </div>
                        <Input
                          label="Citizenship Number"
                          required
                          value={providerValues.citizenshipNumber}
                          onChange={updateProviderField('citizenshipNumber')}
                          error={providerErrors.citizenshipNumber}
                          placeholder="Enter citizenship number"
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
                                  setProviderErrors((current) => ({ ...current, citizenshipFront: '' }));
                                }}
                              />
                              <label htmlFor="citizenship-front" className="flex cursor-pointer flex-col items-center gap-2 text-center">
                                <UploadCloud className="h-5 w-5 text-[var(--sf-secondary)]" aria-hidden="true" />
                                <span className="font-semibold text-[var(--sf-text-main)]">Choose front document</span>
                                <span className="text-xs text-[var(--sf-text-muted)]">{providerFiles.citizenshipFront?.name || 'PNG, JPG, or PDF'}</span>
                              </label>
                            </div>
                            {providerErrors.citizenshipFront ? <span className="text-xs text-[var(--sf-danger)]">{providerErrors.citizenshipFront}</span> : null}
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
                                  setProviderErrors((current) => ({ ...current, citizenshipBack: '' }));
                                }}
                              />
                              <label htmlFor="citizenship-back" className="flex cursor-pointer flex-col items-center gap-2 text-center">
                                <UploadCloud className="h-5 w-5 text-[var(--sf-secondary)]" aria-hidden="true" />
                                <span className="font-semibold text-[var(--sf-text-main)]">Choose back document</span>
                                <span className="text-xs text-[var(--sf-text-muted)]">{providerFiles.citizenshipBack?.name || 'PNG, JPG, or PDF'}</span>
                              </label>
                            </div>
                            {providerErrors.citizenshipBack ? <span className="text-xs text-[var(--sf-danger)]">{providerErrors.citizenshipBack}</span> : null}
                          </label>
                        </div>

                        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setProviderStep('details')}>
                          Back to provider details
                        </Button>
                      </section>
                    )}
                  </>
                ) : null}

                <Button
                  type="submit"
                  disabled={sendOtpMutation.isPending}
                  className="h-12 w-full rounded-xl bg-[var(--sf-secondary)] text-white hover:bg-[var(--sf-secondary)]/90"
                >
                  {sendOtpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {sendOtpMutation.isPending ? submittingLabel : submitLabel}
                </Button>

                {activeRole === AUTH_ROLE.PROVIDER && categoriesQuery.isError ? (
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-3 text-sm text-[var(--sf-text-muted)]">
                    <span>Unable to load service categories.</span>
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => categoriesQuery.refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : null}

                <div className="space-y-2 text-center text-sm text-[var(--sf-text-muted)]">
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
              </form>
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
