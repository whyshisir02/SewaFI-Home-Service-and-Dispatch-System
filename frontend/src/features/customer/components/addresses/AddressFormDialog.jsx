import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { Checkbox } from '../../../../components/ui/Input/Checkbox';
import { Input } from '../../../../components/ui/Input/Input';
import { Modal } from '../../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../../components/ui/Overlay/Drawer';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';
import { useDistricts, useMunicipalities, useProvinces } from '../../../location/hooks/useLocations';
import CurrentLocationButton from './CurrentLocationButton';
import LocationSelectGroup from './LocationSelectGroup';
import { toLocationOptions } from './addressUtils';

const emptyValues = {
  label: '',
  fullName: '',
  phone: '',
  province: '',
  district: '',
  municipality: '',
  ward: '',
  addressLine: '',
  landmark: '',
  latitude: '',
  longitude: '',
  isDefault: false,
};

const normalizeInitialValues = (initialValues = {}) => ({
  label: initialValues?.label || '',
  fullName: initialValues?.fullName || '',
  phone: initialValues?.phone || '',
  province: initialValues?.province || '',
  district: initialValues?.district || '',
  municipality: initialValues?.municipality || '',
  ward: initialValues?.ward || '',
  addressLine: initialValues?.addressLine || initialValues?.address || initialValues?.address || '',
  landmark: initialValues?.landmark || '',
  latitude: initialValues?.latitude != null ? String(initialValues.latitude) : '',
  longitude: initialValues?.longitude != null ? String(initialValues.longitude) : '',
  isDefault: Boolean(initialValues?.isDefault),
});

export function AddressFormDialog({
  open,
  mode = 'create',
  initialValues,
  loading,
  fieldSupport,
  onClose,
  onSubmit,
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [showReceiverDetails, setShowReceiverDetails] = useState(false);
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(values.province);
  const municipalitiesQuery = useMunicipalities(values.province, values.district);

  useEffect(() => {
    if (!open) return;
    setValues(normalizeInitialValues(initialValues));
    setErrors({});
    setGeoError('');
    setShowReceiverDetails(false);
  }, [initialValues, open]);

  const isEdit = mode === 'edit';

  const dialogTitle = useMemo(
    () => (isEdit ? 'Update Address' : 'Add Address'),
    [isEdit]
  );

  const onFieldChange = (field, nextValue) => {
    setValues((current) => {
      if (field === 'province') {
        return { ...current, province: nextValue, district: '', municipality: '' };
      }
      if (field === 'district') {
        return { ...current, district: nextValue, municipality: '' };
      }
      return { ...current, [field]: nextValue };
    });
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.province) nextErrors.province = 'Province is required.';
    if (!values.district) nextErrors.district = 'District is required.';
    if (!values.municipality) nextErrors.municipality = 'Municipality is required.';
    if (!values.addressLine.trim()) nextErrors.addressLine = 'Address line is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      province: values.province,
      district: values.district,
      municipality: values.municipality,
      addressLine: values.addressLine.trim(),
    };

    if (fieldSupport.label) payload.label = values.label.trim();
    if (fieldSupport.fullName) payload.fullName = values.fullName.trim();
    if (fieldSupport.phone) payload.phone = values.phone.trim();
    if (fieldSupport.ward) payload.ward = values.ward.trim();
    if (fieldSupport.landmark) payload.landmark = values.landmark.trim();

    if (fieldSupport.coordinates) {
      if (values.latitude) payload.latitude = Number(values.latitude);
      if (values.longitude) payload.longitude = Number(values.longitude);
    }

    if (fieldSupport.defaultFlag) payload.isDefault = Boolean(values.isDefault);

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGeoError('');
    if (!validate()) return;
    await onSubmit(buildPayload());
  };

  const formContent = (
    <form className="max-h-[72vh] space-y-4 overflow-y-auto pr-1" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        {fieldSupport.label ? (
          <Input
            label="Address Label"
            value={values.label}
            onChange={(event) => onFieldChange('label', event.target.value)}
            placeholder="Home, Office, Hostel..."
          />
        ) : null}

        {fieldSupport.defaultFlag ? (
          <div className="flex items-end">
            <div className="w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-3">
              <Checkbox
                label="Set as default address"
                checked={values.isDefault}
                onChange={(event) => onFieldChange('isDefault', event.target.checked)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <LocationSelectGroup
        values={values}
        errors={errors}
        provinceOptions={toLocationOptions(provincesQuery.data)}
        districtOptions={toLocationOptions(districtsQuery.data)}
        municipalityOptions={toLocationOptions(municipalitiesQuery.data)}
        loadingProvinces={provincesQuery.isLoading}
        loadingDistricts={districtsQuery.isLoading}
        loadingMunicipalities={municipalitiesQuery.isLoading}
        onChange={onFieldChange}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {fieldSupport.ward ? (
          <Input
            label="Ward"
            value={values.ward}
            onChange={(event) => onFieldChange('ward', event.target.value)}
            placeholder="Ward number"
          />
        ) : null}

        {fieldSupport.landmark ? (
          <Input
            label="Landmark"
            value={values.landmark}
            onChange={(event) => onFieldChange('landmark', event.target.value)}
            placeholder="Nearby landmark"
          />
        ) : null}
      </div>

      <Input
        label="Street / Tole / House Details"
        value={values.addressLine}
        onChange={(event) => onFieldChange('addressLine', event.target.value)}
        error={errors.addressLine}
        placeholder="Street / tole / house details"
      />

      {fieldSupport.coordinates ? (
        <div className="space-y-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[var(--sf-text-main)]">
                Exact Location
              </p>
              <p className="text-sm text-[var(--sf-text-muted)]">
                Use GPS to help providers reach the correct place.
              </p>
            </div>

            <CurrentLocationButton
              loading={geoLoading}
              setLoading={setGeoLoading}
              onError={setGeoError}
              onCoordinates={({ latitude, longitude }) => {
                onFieldChange('latitude', latitude);
                onFieldChange('longitude', longitude);
                setGeoError('');
              }}
            />
          </div>

          {values.latitude && values.longitude ? (
            <p className="text-sm text-emerald-500">
              Location captured successfully. GPS location is saved for this address.
            </p>
          ) : null}

          {geoError ? (
            <p className="text-sm text-[var(--sf-danger)]">{geoError}</p>
          ) : null}
        </div>
      ) : null}

      {fieldSupport.fullName || fieldSupport.phone ? (
        <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left font-semibold text-[var(--sf-text-main)]"
            onClick={() => setShowReceiverDetails((current) => !current)}
          >
            <span>Receiver Details</span>
            <span className="text-sm font-medium text-[var(--sf-text-muted)]">
              {showReceiverDetails ? 'Hide' : 'Optional'}
            </span>
          </button>

          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
            Use this only if someone else will receive the provider at this address.
          </p>

          {showReceiverDetails ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {fieldSupport.fullName ? (
                <Input
                  label="Full Name"
                  value={values.fullName}
                  onChange={(event) => onFieldChange('fullName', event.target.value)}
                  placeholder="Receiver full name"
                />
              ) : null}

              {fieldSupport.phone ? (
                <Input
                  label="Phone Number"
                  value={values.phone}
                  onChange={(event) => onFieldChange('phone', event.target.value)}
                  placeholder="Contact phone number"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="h-11 rounded-xl bg-[var(--sf-secondary)] text-white hover:brightness-95" loading={loading} disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Address' : 'Save Address'}
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Modal open={open} onClose={onClose} title={dialogTitle}>
        {formContent}
      </Modal>
    );
  }

  return (
    <Drawer open={open} onClose={onClose} title={dialogTitle}>
      {formContent}
    </Drawer>
  );
}

export default AddressFormDialog;
