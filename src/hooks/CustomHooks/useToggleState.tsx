import { useState } from 'react';

export const useToggleState = (initialValue = false): [boolean, () => void] => {
  const [value, setValue] = useState(initialValue);
  return [value, () => setValue(!value)];
};
