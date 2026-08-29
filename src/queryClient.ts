import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide React Query client.
 *
 * The Superstars dataset is a single JSON that changes roughly once per year, so there
 * is nothing to gain from refetching or expiring it during a session — the whole
 * thing is fetched once and kept.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Infinity,
			gcTime: Infinity,
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});
