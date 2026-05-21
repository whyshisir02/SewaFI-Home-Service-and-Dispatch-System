import { useState } from 'react';

export const useMapLocation = (initialValue = { latitude: 27.7172, longitude: 85.324 }) => {
  const [value, setValue] = useState(initialValue);
  return { value, setValue };
};
