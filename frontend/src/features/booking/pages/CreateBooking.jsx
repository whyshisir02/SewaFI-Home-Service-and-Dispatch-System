import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useCustomerAddresses } from '../../customer/hooks/useCustomerAddresses';
import { BookingStepper } from '../../../components/booking/BookingStepper';
import { BookingLocationStep } from '../../../components/booking/BookingLocationStep';
import { BookingSummaryCard } from '../../../components/booking/BookingSummaryCard';
import { DateTimeStep } from '../../../components/booking/DateTimeStep';
import { DispatchInfoCard } from '../../../components/booking/DispatchInfoCard';
import { ProblemDescriptionStep } from '../../../components/booking/ProblemDescriptionStep';
import { ServiceSelectionStep } from '../../../components/booking/ServiceSelectionStep';
import { Button } from '../../../components/ui/Button/Button';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { Container } from '../../../components/ui/Layout/Container';
import { ROUTES } from '../../../constants/routes.constant';
import { useBookingForm } from '../../../hooks/useBookingForm';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useDistricts, useMunicipalities, useProvinces } from '../../location/hooks/useLocations';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';
import { useServiceDetails, useServices } from '../../services/hooks/useServices';
import { useCreateBooking } from '../hooks/useCreateBooking';

const today = () => new Date().toISOString().slice(0, 10);

const isConcreteServiceId = (value) => Boolean(value && value !== 'new' && value !== ':serviceId');

function CreateBooking() {
  const navigate = useNavigate();
  const { serviceId: routeServiceId } = useParams();
  const [searchParams] = useSearchParams();
  const queryServiceId = searchParams.get('serviceId') || '';
  const queryLocation = searchParams.get('location') || '';
  const queryDate = searchParams.get('date') || '';
  const prefillServiceId = queryServiceId || (isConcreteServiceId(routeServiceId) ? routeServiceId : '');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const form = useBookingForm({
    serviceId: prefillServiceId,
    addressLine: queryLocation,
    preferredDate: queryDate,
  });

  const servicesQuery = useServices();
  const categoriesQuery = useServiceCategories();
  const detailQuery = useServiceDetails(prefillServiceId || undefined);
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(form.values.province);
  const municipalitiesQuery = useMunicipalities(form.values.province, form.values.district);
  const createBookingMutation = useCreateBooking();
  const addressesQuery = useCustomerAddresses();

  const savedAddresses = useMemo(
    () => addressesQuery.data?.items || [],
    [addressesQuery.data?.items]
  );

  const defaultAddress = useMemo(
    () => savedAddresses.find((address) => address.isDefault) || null,
    [savedAddresses]
  );

  // const [addressMode, setAddressMode] = useState('manual');
  const [addressMode, setAddressMode] = useState('saved');
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const services = useMemo(() => servicesQuery.data || [], [servicesQuery.data]);
  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);
  const detailService = detailQuery.data?.service || detailQuery.data;
  const selectedService = useMemo(
    () => services.find((service) => service.id === form.values.serviceId) || (detailService?.id === form.values.serviceId ? detailService : null),
    [detailService, form.values.serviceId, services]
  );
  const selectedCategory = categories.find((category) => category.id === (form.values.categoryId || selectedService?.categoryId));
  const invalidPrefill = Boolean(prefillServiceId && detailQuery.isError);

  useEffect(() => {
    if (selectedService?.categoryId && form.values.categoryId !== selectedService.categoryId) {
      form.setValues((current) => ({ ...current, categoryId: selectedService.categoryId }));
    }
  }, [form, selectedService]);

  useEffect(() => {
  if (addressesQuery.isLoading) return;
  if (!savedAddresses.length) return;
  if (selectedAddressId) return;

  setSelectedAddressId(defaultAddress?.id || savedAddresses[0]?.id || '');
}, [addressesQuery.isLoading, defaultAddress?.id, savedAddresses, selectedAddressId]);

  const completedSteps = useMemo(() => {
    const completed = [];
    if (form.values.serviceId) completed.push(0);
    if (form.values.description.trim().length >= 10) completed.push(1);
    const hasSavedAddress =
      savedAddresses.length > 0 &&
      addressMode === 'saved' &&
      Boolean(selectedAddressId);

    const hasManualAddress =
      (addressMode === 'manual' || savedAddresses.length === 0) &&
      Boolean(form.values.province) &&
      Boolean(form.values.district) &&
      Boolean(form.values.municipality) &&
      Boolean(form.values.addressLine);

    if (hasSavedAddress || hasManualAddress) completed.push(2);
    if (
        form.values.preferredDate &&
        form.values.preferredStartTime &&
        form.values.preferredEndTime &&
        !form.allErrors.preferredStartTime &&
        !form.allErrors.preferredEndTime
      ) {
        completed.push(3);
      }

      if (
        form.values.serviceId &&
        form.values.description.trim().length >= 10 &&
        (hasSavedAddress || hasManualAddress) &&
        form.values.preferredDate &&
        form.values.preferredStartTime &&
        form.values.preferredEndTime &&
        !form.allErrors.preferredStartTime &&
        !form.allErrors.preferredEndTime
      ) {
        completed.push(4);
      }
    return completed;
  }, [addressMode,form.allErrors.preferredStartTime,form.allErrors.preferredEndTime,form.values,selectedAddressId,]);

  const handleUseCurrentLocation = () => {
    setGeoMessage('');
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported in this browser. Please use a supported browser or device.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setField('latitude', String(position.coords.latitude));
        form.setField('longitude', String(position.coords.longitude));
        setGeoLoading(false);
        setGeoMessage('');
      },
      () => {
        setGeoLoading(false);
        setGeoMessage('Could not access your location. Please enter address manually and allow location access for dispatch.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleConfirm = async () => {
  setSubmitError('');
  form.markSubmitAttempted();

  const hasSavedAddress =
    savedAddresses.length > 0 &&
    addressMode === 'saved' &&
    Boolean(selectedAddressId);

  const hasManualAddress =
    (addressMode === 'manual' || savedAddresses.length === 0) &&
    Boolean(form.values.province) &&
    Boolean(form.values.district) &&
    Boolean(form.values.municipality) &&
    Boolean(form.values.addressLine);

  if (!form.values.serviceId) {
    setSubmitError('Please select a service before confirming.');
    return;
  }

  if (form.values.description.trim().length < 10) {
    setSubmitError('Please describe the problem in at least 10 characters.');
    return;
  }

  if (!hasSavedAddress && !hasManualAddress) {
    setSubmitError('Please select a saved address or enter a new service address.');
    return;
  }

  if (
    !form.values.preferredDate ||
    !form.values.preferredStartTime ||
    !form.values.preferredEndTime ||
    form.allErrors.preferredStartTime ||
    form.allErrors.preferredEndTime
  ) {
    setSubmitError('Please choose a valid preferred arrival window.');
    return;
  }

  try {
    const payload = form.buildPayload();

    if (hasSavedAddress) {
      delete payload.province;
      delete payload.district;
      delete payload.municipality;
      delete payload.ward;
      delete payload.address;
      delete payload.addressLine;
      delete payload.streetAddress;
      delete payload.landmark;
      delete payload.latitude;
      delete payload.longitude;

      payload.addressId = selectedAddressId;
    } else {
      payload.streetAddress = form.values.addressLine;
    }

    const booking = await createBookingMutation.mutateAsync(payload);
    const bookingId = booking?.id || booking?.booking?.id || booking?.data?.id;

    if (bookingId) {
      navigate(ROUTES.customer.bookingDetails.replace(':id', bookingId));
    } else {
      navigate(ROUTES.customer.bookings);
    }
  } catch (error) {
    setSubmitError(getErrorMessage(error, 'Unable to create booking. Please check your details and try again.'));
  }
};

  if (servicesQuery.isLoading) {
    return (
      <Container className="space-y-6 py-10">
        <Skeleton className="h-14 w-2/3 rounded-2xl" />
        <Skeleton className="h-20 rounded-[28px]" />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-[640px] rounded-[28px]" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </Container>
    );
  }

  if (servicesQuery.isError) {
    return (
      <Container className="py-12">
        <EmptyState
          title="Unable to load services"
          description="We could not load services for booking right now."
          actionLabel="Retry"
          onAction={() => servicesQuery.refetch()}
        />
      </Container>
    );
  }

  if (!services.length) {
    return (
      <Container className="py-12">
        <EmptyState title="No services available" description="No services are available right now." />
        <div className="mt-6 text-center">
          <Button as={Link} to={ROUTES.services} variant="outline" className="rounded-xl">
            Back to Services
          </Button>
        </div>
      </Container>
    );
  }

  const hasSavedAddress =
    savedAddresses.length > 0 &&
    addressMode === 'saved' &&
    Boolean(selectedAddressId);

  const hasManualAddress =
    (addressMode === 'manual' || savedAddresses.length === 0) &&
    Boolean(form.values.province) &&
    Boolean(form.values.district) &&
    Boolean(form.values.municipality) &&
    Boolean(form.values.addressLine);

  const canConfirmBooking =
  Boolean(form.values.serviceId) &&
  form.values.description.trim().length >= 10 &&
  (hasSavedAddress || hasManualAddress) &&
  Boolean(form.values.preferredDate) &&
  Boolean(form.values.preferredStartTime) &&
  Boolean(form.values.preferredEndTime) &&
  !form.allErrors.preferredStartTime &&
  !form.allErrors.preferredEndTime;

  return (
    <div className="bg-[var(--sf-bg)]">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <header className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">Automatic dispatch booking</p>
          <h1 className="mt-3 font-display text-[32px] font-extrabold leading-[42px] text-[var(--sf-text-main)] sm:text-[46px] sm:leading-[56px]">
            Book a trusted home service
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-[var(--sf-text-muted)] sm:text-lg">
            Confirm your service, address, GPS location, and preferred window. SewaFi will dispatch eligible nearby providers after booking.
          </p>
        </header>

        <BookingStepper completed={completedSteps} />

        {invalidPrefill ? (
          <div className="flex gap-3 rounded-2xl border border-[var(--sf-warning)] bg-[var(--sf-accent-soft)] p-4 text-sm font-semibold text-[var(--sf-text-main)]">
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--sf-warning)]" aria-hidden="true" />
            Selected service could not be loaded. Please choose another service.
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
            <ServiceSelectionStep
              categories={categories}
              services={services}
              selectedService={selectedService}
              values={form.values}
              errors={form.errors}
              loading={servicesQuery.isLoading || categoriesQuery.isLoading}
              serviceWarning={invalidPrefill ? 'Selected service could not be loaded. Please choose another service.' : ''}
              onChange={form.setField}
              onBlur={form.markTouched}
            />

            <ProblemDescriptionStep values={form.values} errors={form.errors} onChange={form.setField} onBlur={form.markTouched} />

            <BookingLocationStep
              values={form.values}
              errors={form.errors}
              provinces={provincesQuery.data || []}
              districts={districtsQuery.data || []}
              municipalities={municipalitiesQuery.data || []}
              loadingProvinces={provincesQuery.isLoading}
              loadingDistricts={districtsQuery.isLoading}
              loadingMunicipalities={municipalitiesQuery.isLoading}
              geoLoading={geoLoading}
              geoMessage={geoMessage}
              onChange={form.setField}
              onBlur={form.markTouched}
              onUseCurrentLocation={handleUseCurrentLocation}
              savedAddresses={savedAddresses}
              addressesLoading={addressesQuery.isLoading}
              addressMode={addressMode}
              selectedAddressId={selectedAddressId}
              onAddressModeChange={setAddressMode}
              onSelectedAddressChange={setSelectedAddressId}
            />

            <DateTimeStep values={form.values} errors={form.errors} minDate={today()} onChange={form.setField} onBlur={form.markTouched} />

            <DispatchInfoCard />
          </form>

          <BookingSummaryCard
            values={form.values}
            selectedService={selectedService}
            selectedCategory={selectedCategory}
            isValid={canConfirmBooking}
            isSubmitting={createBookingMutation.isPending}
            submitError={submitError}
            onConfirm={handleConfirm}
          />
        </div>
      </Container>
    </div>
  );
}

export default CreateBooking;
