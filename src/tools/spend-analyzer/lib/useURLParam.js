import { useState, useEffect } from 'react';

export function useURLParam(key, defaultValue = '') {
  const [value, setValue] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? defaultValue;
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (value === defaultValue || value === '' || value == null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
    window.history.replaceState(null, '', url.toString());
  }, [key, value, defaultValue]);

  return [value, setValue];
}
