import { useQuery } from '@tanstack/react-query';

/** Fetches an image once and returns a blob object URL that never re-hits the network. */
const fetchImageObjectUrl = async (url: string): Promise<string> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to load image: ${response.status}`);
	}

	return URL.createObjectURL(await response.blob());
};

/**
 * Caches an image across the app via React Query so a given URL is fetched only once per
 * session. Returns a blob object URL (or `undefined` while loading / on failure). Because
 * it's keyed on the URL, a table icon and the profile card that show the same player share
 * a single request instead of each hitting the network.
 */
export const useCachedImage = (url: string | undefined): string | undefined => {
	const { data } = useQuery({
		queryKey: ['image', url],
		queryFn: async () => {
			if (!url) {
				throw new Error('Image URL is required');
			}

			return fetchImageObjectUrl(url);
		},
		enabled: Boolean(url),
		staleTime: Infinity,
		gcTime: Infinity,
	});

	return data;
};
