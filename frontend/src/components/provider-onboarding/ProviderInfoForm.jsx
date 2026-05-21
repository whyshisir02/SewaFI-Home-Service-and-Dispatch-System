import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';
import { Select } from '../ui/Input/Select';
import { Textarea } from '../ui/Input/Textarea';
import { useNepalDistricts, useNepalMunicipalities, useNepalProvinces } from '../../hooks/useNepalLocations';

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
    experienceYears: '',
    bio: '',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    streetAddress: '',
  });

  useEffect(() => {
    if (!profile && !user) return;
    setForm({
      categoryId: profile?.categoryId || profile?.category?.id || '',
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
  }, [profile, user]);

  const categoryOptions = useMemo(() => toCategoryOptions(categoriesQuery.data), [categoriesQuery.data]);
  const provincesQuery = useNepalProvinces();
  const districtsQuery = useNepalDistricts(form.province);
  const municipalitiesQuery = useNepalMunicipalities(form.province, form.district);

  const locationOptions = {
    provinces: (provincesQuery.data || []).map((value) => ({ value, label: value })),
    districts: (districtsQuery.data || []).map((value) => ({ value, label: value })),
    municipalities: (municipalitiesQuery.data || []).map((value) => ({ value, label: value })),
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!editable) return;

    const providerPayload = {};
    const userPayload = {};

    if (form.experienceYears !== '') providerPayload.experienceYears = Number(form.experienceYears);
    if (form.bio !== '') providerPayload.bio = form.bio.trim();

    const areas = normalizeAreas([{ province: form.province, district: form.district, municipality: form.municipality }]);
    if (areas.length) providerPayload.serviceAreas = areas;

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
