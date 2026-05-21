export const defaultCenter = [27.7172, 85.324];

export const toLatLng = (value) => {
  if (!value) return defaultCenter;
  const latitude = Number(value.latitude ?? value.lat ?? defaultCenter[0]);
  const longitude = Number(value.longitude ?? value.lng ?? defaultCenter[1]);
  return [latitude, longitude];
};

export const buildDirectionsUrl = ({ latitude, longitude }) =>
  `https://www.openstreetmap.org/directions?to=${latitude}%2C${longitude}`;
