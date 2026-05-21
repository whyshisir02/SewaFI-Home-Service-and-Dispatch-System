import { useState } from 'react';

export const useGeolocation = () => {
  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported.' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null,
        }),
      () =>
        setState({
          latitude: null,
          longitude: null,
          loading: false,
          error: 'Unable to fetch your location.',
        }),
      { enableHighAccuracy: true }
    );
  };

  return { ...state, getCurrentLocation };
};
