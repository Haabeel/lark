import { useEffect, useState } from "react";

/**
 * Debounce a value by the specified delay in milliseconds.
 * Returns the debounced value.
 */
export function useDebounce<T>({
  value,
  delay = 300,
}: {
  value: T;
  delay?: number;
}): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
