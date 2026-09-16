import { useCallback, useState } from 'react';

/**
 * Spinner state for pull-to-refresh that only reflects a refresh the person
 * asked for.
 *
 * Binding the spinner to the query fetching state would make it flash on every
 * background poll, which looks like the screen is glitching.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
