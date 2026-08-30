import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { BookingField, fieldClass } from './BookingField';

const optionValue = (item) => item?.id || item?.name || item;
const optionLabel = (item) => item?.name || item?.label || item;

export function BookingLocationStep({
  values,
  errors,
  provinces = [],
  districts = [],
  municipalities = [],
  loadingProvinces,
  loadingDistricts,
  loadingMunicipalities,
  geoLoading,
  geoMessage,
  onChange,
  onBlur,
  onUseCurrentLocation,

  savedAddresses = [],
  addressesLoading = false,
  addressMode = 'manual',
  selectedAddressId = '',
  onAddressModeChange,
  onSelectedAddressChange,
}) {
    const hasSavedAddresses = savedAddresses.length > 0;

    const formatSavedAddress = (address) =>
      [
        address.addressLine || address.streetAddress || address.address,
        address.ward ? `Ward ${address.ward}` : null,
        address.municipality,
        address.district,
        address.province,
      ]
        .filter(Boolean)
        .join(', ');
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Step 3</p>
          <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Add Location</h2>
        </div>
      </div>

            {hasSavedAddresses ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onAddressModeChange?.('saved')}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  addressMode === 'saved'
                    ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] text-[var(--sf-text-main)]'
                    : 'border-[var(--sf-border)] bg-[var(--sf-bg)] text-[var(--sf-text-main)]'
                }`}
              >
                <p className="font-bold">Use saved address</p>
                <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
                  Choose from your saved service locations.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onAddressModeChange?.('manual')}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  addressMode === 'manual'
                    ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] text-[var(--sf-text-main)]'
                    : 'border-[var(--sf-border)] bg-[var(--sf-bg)] text-[var(--sf-text-main)]'
                }`}
              >
                <p className="font-bold">Enter new address</p>
                <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
                  Use a different address for this booking.
                </p>
              </button>
            </div>
          ) : null}

          {addressesLoading ? (
            <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4 text-sm font-semibold text-[var(--sf-text-muted)]">
              Loading saved addresses...
            </div>
          ) : null}

          {addressMode === 'saved' && hasSavedAddresses ? (
            <div className="mt-5 space-y-3">
              {savedAddresses.map((address) => (
                <label
                  key={address.id}
                  className={`block cursor-pointer rounded-2xl border p-4 transition ${
                    selectedAddressId === address.id
                      ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)]'
                      : 'border-[var(--sf-border)] bg-[var(--sf-bg)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="selectedAddressId"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => onSelectedAddressChange?.(address.id)}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[var(--sf-text-main)]">
                          {address.label || 'Saved Address'}
                        </p>

                        {address.isDefault ? (
                          <span className="rounded-full border border-[var(--sf-secondary)] px-2 py-0.5 text-xs font-bold text-[var(--sf-secondary)]">
                            Default
                          </span>
                        ) : null}

                        {address.latitude && address.longitude ? (
                          <span className="rounded-full border border-[var(--sf-border)] px-2 py-0.5 text-xs font-semibold text-[var(--sf-text-muted)]">
                            GPS saved
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">
                        {formatSavedAddress(address)}
                      </p>

                      {address.landmark ? (
                        <p className="mt-1 text-xs text-[var(--sf-text-muted)]">
                          Landmark: {address.landmark}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : null}

          {addressMode === 'manual' || !hasSavedAddresses ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <BookingField label="Province" required error={errors.province}>
                  <select
                    value={values.province}
                    onChange={(event) => onChange('province', event.target.value)}
                    onBlur={() => onBlur('province')}
                    className={fieldClass}
                    disabled={loadingProvinces}
                  >
                    <option value="">
                      {loadingProvinces ? 'Loading provinces...' : 'Select province'}
                    </option>
                    {provinces.map((item) => (
                      <option key={optionValue(item)} value={optionValue(item)}>
                        {optionLabel(item)}
                      </option>
                    ))}
                  </select>
                </BookingField>

                <BookingField label="District" required error={errors.district}>
                  <select
                    value={values.district}
                    onChange={(event) => onChange('district', event.target.value)}
                    onBlur={() => onBlur('district')}
                    className={fieldClass}
                    disabled={!values.province || loadingDistricts}
                  >
                    <option value="">
                      {loadingDistricts ? 'Loading districts...' : 'Select district'}
                    </option>
                    {districts.map((item) => (
                      <option key={optionValue(item)} value={optionValue(item)}>
                        {optionLabel(item)}
                      </option>
                    ))}
                  </select>
                </BookingField>

                <BookingField label="Municipality" required error={errors.municipality}>
                  <select
                    value={values.municipality}
                    onChange={(event) => onChange('municipality', event.target.value)}
                    onBlur={() => onBlur('municipality')}
                    className={fieldClass}
                    disabled={!values.district || loadingMunicipalities}
                  >
                    <option value="">
                      {loadingMunicipalities
                        ? 'Loading municipalities...'
                        : 'Select municipality'}
                    </option>
                    {municipalities.map((item) => (
                      <option key={optionValue(item)} value={optionValue(item)}>
                        {optionLabel(item)}
                      </option>
                    ))}
                  </select>
                </BookingField>

                <BookingField label="Ward" required error={errors.ward}>
                  <input
                    value={values.ward}
                    onChange={(event) => onChange('ward', event.target.value)}
                    onBlur={() => onBlur('ward')}
                    className={fieldClass}
                    placeholder="Ward number"
                  />
                </BookingField>

                <BookingField
                  label="Street Address"
                  required
                  error={errors.addressLine}
                  className="md:col-span-2"
                >
                  <input
                    value={values.addressLine}
                    onChange={(event) => onChange('addressLine', event.target.value)}
                    onBlur={() => onBlur('addressLine')}
                    className={fieldClass}
                    placeholder="House number, street, or nearby area"
                  />
                </BookingField>

                <BookingField label="Landmark" className="md:col-span-2">
                  <input
                    value={values.landmark}
                    onChange={(event) => onChange('landmark', event.target.value)}
                    className={fieldClass}
                    placeholder="Optional nearby landmark"
                  />
                </BookingField>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--sf-text-main)]">
                      Current GPS Location
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">
                      Use GPS to help providers reach the correct place.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={onUseCurrentLocation}
                    loading={geoLoading}
                    className="rounded-xl"
                  >
                    <LocateFixed className="h-4 w-4" aria-hidden="true" />
                    Use Current Location
                  </Button>
                </div>

                {values.latitude && values.longitude ? (
                  <p className="mt-3 rounded-xl bg-[var(--sf-secondary-soft)] px-3 py-2 text-sm font-bold text-[var(--sf-secondary)]">
                    Location captured. GPS location is saved for this booking.
                  </p>
                ) : null}

                {geoMessage || errors.location ? (
                  <p className="mt-3 text-sm font-semibold text-[var(--sf-danger)]" role="alert">
                    {geoMessage || errors.location}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
    </section>
  );
}

export default BookingLocationStep;
