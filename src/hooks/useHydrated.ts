import { useState, useEffect } from 'react';

/**
 * A hook to detect if the component has been hydrated on the client.
 * Use this to avoid hydration mismatches when using localStorage or window APIs.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
