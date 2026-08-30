import { useMemo, useState } from 'react';

const initialValues = {
  serviceId: '',
  categoryId: '',
  description: '',
  province: '',
  district: '',
  municipality: '',
  ward: '',
  addressLine: '',
  landmark: '',
  latitude: '',
  longitude: '',
  preferredDate: '',
  preferredStartTime: '',
  preferredEndTime: '',
  specialInstructions: '',
};

const combineDateTime = (date, time) => {
  if (!date || !time) return '';
  return new Date(`${date}T${time}:00`).toISOString();
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function useBookingForm(defaultValues = {}) {
  const [values, setValues] = useState({ ...initialValues, ...defaultValues });
  const [touched, setTouched] = useState({});

  const setField = (field, value) => {
    setValues((current) => {
      const next = { ...current, [field]: value };

      if (field === 'categoryId') {
        next.serviceId = '';
      }

      if (field === 'province') {
        next.district = '';
        next.municipality = '';
        next.ward = '';
      }

      if (field === 'district') {
        next.municipality = '';
        next.ward = '';
      }

      if (field === 'municipality') {
        next.ward = '';
      }

      return next;
    });
  };

  const markTouched = (field) =>
    setTouched((current) => ({ ...current, [field]: true }));

  const errors = useMemo(() => {
    const next = {};

    if (!values.serviceId) {
      next.serviceId = 'Service is required.';
    }

    if (!values.description.trim() || values.description.trim().length < 10) {
      next.description = 'Please describe the problem in at least 10 characters.';
    }

    if (!values.province) {
      next.province = 'Province is required.';
    }

    if (!values.district) {
      next.district = 'District is required.';
    }

    if (!values.municipality) {
      next.municipality = 'Municipality is required.';
    }

    // Ward is helpful in Nepal, but do not block booking only because of ward.
    // Keep it optional because some users may not know it immediately.

    if (!values.addressLine.trim()) {
      next.addressLine = 'Address is required.';
    }

    // GPS is useful, but it should not fully block booking.
    // If user provides one coordinate, require both.
    if (
      (values.latitude && !values.longitude) ||
      (!values.latitude && values.longitude)
    ) {
      next.location = 'Both latitude and longitude are required when using GPS.';
    }

    if (!values.preferredDate) {
      next.preferredDate = 'Preferred date is required.';
    }

    if (!values.preferredStartTime) {
      next.preferredStartTime = 'Start time is required.';
    }

    if (!values.preferredEndTime) {
      next.preferredEndTime = 'End time is required.';
    }

    const scheduledStartTime = combineDateTime(
      values.preferredDate,
      values.preferredStartTime
    );

    const scheduledEndTime = combineDateTime(
      values.preferredDate,
      values.preferredEndTime
    );

    if (scheduledStartTime && new Date(scheduledStartTime) <= new Date()) {
      next.preferredStartTime = 'Start time must be in the future.';
    }

    if (scheduledStartTime && scheduledEndTime) {
      const start = new Date(scheduledStartTime);
      const end = new Date(scheduledEndTime);

      if (end <= start) {
        next.preferredEndTime = 'End time must be after start time.';
      }
    }

    return next;
  }, [values]);

  const visibleErrors = useMemo(() => {
    const next = {};

    Object.entries(errors).forEach(([key, message]) => {
      if (touched[key] || touched.submit) {
        next[key] = message;
      }
    });

    return next;
  }, [errors, touched]);

  const isValid = Object.keys(errors).length === 0;

  const buildPayload = () => {
    const address = [
      values.addressLine.trim(),
      values.ward.trim() ? `Ward ${values.ward.trim()}` : null,
      values.municipality,
      values.district,
      values.province,
    ]
      .filter(Boolean)
      .join(', ');

    const notes = [
      values.description.trim(),
      values.landmark.trim() ? `Landmark: ${values.landmark.trim()}` : null,
      values.specialInstructions.trim()
        ? `Special instructions: ${values.specialInstructions.trim()}`
        : null,
      'Dispatch mode: AUTOMATIC',
    ]
      .filter(Boolean)
      .join(' | ');

    return {
      serviceId: values.serviceId,

      // Old backend compatibility field
      address,

      // New backend/manual address fields
      streetAddress: values.addressLine.trim(),
      ward: values.ward.trim() || null,
      landmark: values.landmark.trim() || null,
      province: values.province,
      district: values.district,
      municipality: values.municipality,

      // Time window
      scheduledTime: combineDateTime(
        values.preferredDate,
        values.preferredStartTime
      ),
      scheduledEndTime: combineDateTime(
        values.preferredDate,
        values.preferredEndTime
      ),
      preferredDate: values.preferredDate,
      preferredStartTime: values.preferredStartTime,
      preferredEndTime: values.preferredEndTime,

      notes,

      latitude: toNullableNumber(values.latitude),
      longitude: toNullableNumber(values.longitude),
    };
  };

  return {
    values,
    errors: visibleErrors,
    allErrors: errors,
    isValid,
    setField,
    setValues,
    markTouched,
    markSubmitAttempted: () =>
      setTouched((current) => ({ ...current, submit: true })),
    buildPayload,
  };
}

export default useBookingForm;