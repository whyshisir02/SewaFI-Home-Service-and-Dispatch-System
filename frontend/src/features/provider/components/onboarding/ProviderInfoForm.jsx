import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Select } from '../../../../components/ui/Input/Select';
import { Textarea } from '../../../../components/ui/Input/Textarea';
import { useNepalDistricts, useNepalMunicipalities, useNepalProvinces } from '../../../location/hooks/useNepalLocations';
import { useServicesByCategory } from '../../../services/hooks/useServices';

const toCategoryOptions = (payload) => {
  const categories = Array.isArray(payload?.categories)
    ? payload.categories
    : Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return categories
    .filter((item) => item?.isActive !== false)
    .map((item) => ({ value: item.id, label: item.name }));
};

const normalizeAreas = (areas) =>
  (Array.isArray(areas) ? areas : [])
    .map((area) => ({
      province: area?.province || '',
      district: area?.district || '',
      municipality: area?.municipality || '',
    }))
    .filter((area) => area.province || area.district || area.municipality);

const normalizeProviderServiceIds = (services) =>
  (Array.isArray(services) ? services : [])
    .map((item) => item?.serviceId || item?.service?.id || item?.id)
    .filter(Boolean)
    .map((id) => String(id));

export function ProviderInfoForm({
  profile,
  user,
  categoriesQuery,
  onSave,
  saving,
  editable,
}) {
  const [form, setForm] = useState({
    categoryId: '',
    serviceIds: [],
    experienceYears: '',
    bio: '',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    streetAddress: '',
  });
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    if (!profile && !user) return;
    setForm({
      categoryId: profile?.categoryId || profile?.category?.id || '',
      serviceIds: normalizeProviderServiceIds(profile?.services),
      experienceYears:
        profile?.experienceYears != null
          ? String(profile.experienceYears)
          : '',
      bio: profile?.bio || '',
      province: user?.province || '',
      district: user?.district || '',
      municipality: user?.municipality || '',
      ward: user?.ward || '',
      streetAddress: user?.streetAddress || '',
    });
    setServiceError('');
  }, [profile, user]);

  const categoryOptions = useMemo(() => toCategoryOptions(categoriesQuery.data), [categoriesQuery.data]);
  const servicesQuery = useServicesByCategory(form.categoryId, { page: 1, limit: 100 }, { enabled: Boolean(form.categoryId) });
  const serviceOptions = useMemo(() => {
    const services = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
    return services
      .filter((item) => item?.isActive !== false)
      .map((item) => ({
        id: String(item?.id || ''),
        name: item?.name || 'Service',
      }))
      .filter((item) => item.id);
  }, [servicesQuery.data]);
  const provincesQuery = useNepalProvinces();
  const districtsQuery = useNepalDistricts(form.province);
  const municipalitiesQuery = useNepalMunicipalities(form.province, form.district);

  const locationOptions = {
    provinces: (provincesQuery.data || []).map((value) => ({ value, label: value })),
    districts: (districtsQuery.data || []).map((value) => ({ value, label: value })),
    municipalities: (municipalitiesQuery.data || []).map((value) => ({ value, label: value })),
  };

  const handleChange = (key, value) => {
    if (key === 'categoryId') {
      setForm((prev) => ({ ...prev, [key]: value, serviceIds: [] }));
      setServiceError('');
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (serviceId) => {
    const id = String(serviceId || '').trim();
    if (!id) return;

    setForm((prev) => {
      const current = Array.isArray(prev.serviceIds) ? prev.serviceIds : [];
      const exists = current.includes(id);
      return {
        ...prev,
        serviceIds: exists ? current.filter((item) => item !== id) : [...current, id],
      };
    });
    setServiceError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!editable) return;
    if (!form.categoryId) {
      setServiceError('Service category is required before selecting services.');
      return;
    }

    if (!Array.isArray(form.serviceIds) || form.serviceIds.length === 0) {
      setServiceError('Please select at least one service you provide.');
      return;
    }

    const providerPayload = {};
    const userPayload = {};

    if (form.experienceYears !== '') providerPayload.experienceYears = Number(form.experienceYears);
    if (form.bio !== '') providerPayload.bio = form.bio.trim();

    const areas = normalizeAreas([{ province: form.province, district: form.district, municipality: form.municipality }]);
    if (areas.length) providerPayload.serviceAreas = areas;
    providerPayload.serviceIds = form.serviceIds;

    if (form.province !== '') userPayload.province = form.province;
    if (form.district !== '') userPayload.district = form.district;
    if (form.municipality !== '') userPayload.municipality = form.municipality;
    if (form.ward !== '') userPayload.ward = form.ward;
    if (form.streetAddress !== '') userPayload.streetAddress = form.streetAddress;

    onSave({ providerPayload, userPayload });
  };

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Provider Information</h3>

      {!editable ? (
        <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
          Provider profile editing is not available right now.
        </p>
      ) : null}

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Select
          label="Service Category"
          value={form.categoryId}
          options={categoryOptions}
          disabled
          placeholder={categoriesQuery.isLoading ? 'Loading categories...' : 'Not set'}
        />
        <Input
          label="Experience (Years)"
          type="number"
          min="0"
          step="1"
          value={form.experienceYears}
          onChange={(event) => handleChange('experienceYears', event.target.value)}
          disabled={!editable}
        />

        <div className="md:col-span-2">
          <Textarea
            label="Bio"
            value={form.bio}
            onChange={(event) => handleChange('bio', event.target.value)}
            placeholder="Describe your experience and service strengths..."
            disabled={!editable}
          />
        </div>

        <div className="md:col-span-2 space-y-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
          <p className="text-sm font-semibold text-[var(--sf-text-main)]">Services you provide</p>
          {!form.categoryId ? (
            <p className="text-sm text-[var(--sf-text-muted)]">Service category is required to choose services.</p>
          ) : servicesQuery.isLoading ? (
            <p className="text-sm text-[var(--sf-text-muted)]">Loading services...</p>
          ) : servicesQuery.isError ? (
            <p className="text-sm text-[var(--sf-danger)]">Unable to load services for this category.</p>
          ) : serviceOptions.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {serviceOptions.map((service) => {
                const checked = Array.isArray(form.serviceIds) && form.serviceIds.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                      checked
                        ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)]/50'
                        : 'border-[var(--sf-border)] bg-[var(--sf-surface)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--sf-border)] text-[var(--sf-secondary)] focus:ring-[var(--sf-secondary)]"
                      checked={checked}
                      onChange={() => toggleService(service.id)}
                      disabled={!editable}
                    />
                    <span className="font-medium text-[var(--sf-text-main)]">{service.name}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--sf-text-muted)]">No active services are available in this category yet.</p>
          )}
          {serviceError ? <p className="text-xs font-medium text-[var(--sf-danger)]">{serviceError}</p> : null}
        </div>

        <Select
          label="Province"
          value={form.province}
          options={locationOptions.provinces}
          onChange={(event) => handleChange('province', event.target.value)}
          disabled={!editable || provincesQuery.isLoading}
        />
        <Select
          label="District"
          value={form.district}
          options={locationOptions.districts}
          onChange={(event) => handleChange('district', event.target.value)}
          disabled={!editable || !form.province || districtsQuery.isLoading}
        />
        <Select
          label="Municipality"
          value={form.municipality}
          options={locationOptions.municipalities}
          onChange={(event) => handleChange('municipality', event.target.value)}
          disabled={!editable || !form.district || municipalitiesQuery.isLoading}
        />
        <Input
          label="Ward"
          value={form.ward}
          onChange={(event) => handleChange('ward', event.target.value)}
          disabled={!editable}
        />
        <div className="md:col-span-2">
          <Input
            label="Address / Working Area"
            value={form.streetAddress}
            onChange={(event) => handleChange('streetAddress', event.target.value)}
            disabled={!editable}
          />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" className="h-11 rounded-xl bg-[var(--sf-secondary)] text-white hover:brightness-95" disabled={!editable || saving}>
            {saving ? 'Saving...' : 'Save Provider Profile'}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default ProviderInfoForm;
