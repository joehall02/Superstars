import { type ConversionResult, isConversionErrors, type SuperstarsData } from '../../../shared/types';
import { DATA_SOURCE_URLS,DataSource } from '../../config';
import { dataFetchError } from './dataLoadErrors';
import { assertSuperstarsData, MasterScoresError } from './masterScoresGuard';

/**
 * Resolves where the dataset is fetched from:
 * - `api`   → Vercel serverless function (`/api/data`)
 * - `local` → the pre-generated JSON served from `public/` (dev + Docker)
 *
 * Defaults to `local` when `VITE_DATA_SOURCE` is unset.
 */
export const getDataSourceUrl = (): string =>
	DATA_SOURCE_URLS[import.meta.env.VITE_DATA_SOURCE ?? DataSource.Local];

/**
 * React Query `queryFn` for the whole dataset. Fetches once, then validates:
 * a non-OK response, a `ConversionErrors` payload, or a malformed shape all throw
 * a {@link MasterScoresError}, which lands in React Query's `error` state for the
 * Error Page to consume.
 */
export const fetchMasterScores = async (): Promise<SuperstarsData> => {
	const url = getDataSourceUrl();

	let response: Response;
	try {
		response = await fetch(url);
	} catch (cause) {
		throw new MasterScoresError([dataFetchError(url, cause instanceof Error ? cause.message : String(cause))]);
	}

	if (!response.ok) {
		throw new MasterScoresError([dataFetchError(url, `${response.status} ${response.statusText}`)]);
	}

	const json: ConversionResult = await response.json();

	// The converter emits `{ errors: [...] }` instead of data when the spreadsheet
	// is missing/corrupt; surface those before shape-checking.
	if (isConversionErrors(json)) {
		throw new MasterScoresError(json.errors);
	}

	return assertSuperstarsData(json);
};
