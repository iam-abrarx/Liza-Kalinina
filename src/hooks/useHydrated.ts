import { useState, useEffect } from 'react';

/**
 * A hook to detect if the component has been hydrated on the client.
 * Use this to avoid hydration mismatches when using localStorage or window APIs.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  return hydrated;
}
