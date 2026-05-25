const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const hasValidCoordinates = (lat, lng) => {
  const latitude = toFiniteNumber(lat);
  const longitude = toFiniteNumber(lng);

  if (latitude === null || longitude === null) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

export const getBookingCoordinates = (booking) => {
  if (!booking) return null;

  const candidates = [
    [booking?.addressLatitude, booking?.addressLongitude],
    [booking?.latitude, booking?.longitude],
    [booking?.location?.latitude, booking?.location?.longitude],
    [booking?.location?.lat, booking?.location?.lng],
  ];

  for (const [lat, lng] of candidates) {
    if (hasValidCoordinates(lat, lng)) {
      return { lat: Number(lat), lng: Number(lng) };
    }
  }

  return null;
};

export const buildBookingAddress = (booking) => {
  if (!booking) return '';

  const primaryAddress =
    booking?.addressStreet ||
    booking?.streetAddress ||
    booking?.address ||
    booking?.location?.address ||
    '';

  const parts = [
    primaryAddress,
    booking?.addressLandmark ? `Landmark: ${booking.addressLandmark}` : null,
    booking?.addressWard ? `Ward ${booking.addressWard}` : booking?.ward ? `Ward ${booking.ward}` : null,
    booking?.addressMunicipality || booking?.municipality,
    booking?.addressDistrict || booking?.district,
    booking?.addressProvince || booking?.province,
  ]
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter(Boolean);

  return parts.join(', ');
};

export const getBookingMapsAction = (booking) => {
  const coordinates = getBookingCoordinates(booking);
  if (coordinates) {
    return {
      mode: 'coordinates',
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${coordinates.lat},${coordinates.lng}`)}`,
      label: 'Open Directions',
    };
  }

  const address = buildBookingAddress(booking);
  if (address) {
    return {
      mode: 'address',
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      label: 'Search Address in Maps',
    };
  }

  return null;
};
