export const getCurrentPosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options,
    });
  });

export const formatGeolocationError = (error) => {
  if (!error || typeof error.code !== 'number') {
    return 'We could not fetch your current location.';
  }

  switch (error.code) {
    case 1:
      return 'Location permission was denied. Please allow access to continue.';
    case 2:
      return 'Your location could not be determined right now. Please try again.';
    case 3:
      return 'Location request timed out. Please try again.';
    default:
      return 'We could not fetch your current location.';
  }
};
