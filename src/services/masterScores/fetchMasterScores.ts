import { type ConversionResult, isConversionErrors, type SuperstarsData } from '../../../shared/types';
import { DATA_SOURCE_URLS } from '../../config';
import { DataSource } from '../../enums/config';
import { DataLoadResource } from '../../enums/errors';
import { jsonFetcher } from '../fetchJson';
import { MasterScoresError } from '../loadErrors';
import { assertSuperstarsData } from './masterScoresGuard';

/**
 * Resolves where the dataset is fetched from:
 * - `api`   → Vercel serverless function (`/api/convert-data`)
 * - `local` → the pre-generated JSON served from `public/` (dev + Docker)
 *
 * Defaults to `local` when `VITE_DATA_SOURCE` is unset.
 */
export const getDataSourceUrl = (): string =>
	DATA_SOURCE_URLS[import.meta.env.VITE_DATA_SOURCE ?? DataSource.Local];

const fetchScoresJson = jsonFetcher<ConversionResult>(DataLoadResource.SuperstarsData, MasterScoresError);

/**
 * React Query `queryFn` for the whole dataset. Fetches once, then validates:
 * a non-OK response, a `ConversionErrors` payload, or a malformed shape all throw
 * a {@link MasterScoresError}, which lands in React Query's `error` state for the
 * Error Page to consume.
 */
export const fetchMasterScores = async (): Promise<SuperstarsData> => {
	const json = await fetchScoresJson(getDataSourceUrl());

	// The converter emits `{ errors: [...] }` instead of data when the spreadsheet
	// is missing/corrupt; surface those before shape-checking.
	if (isConversionErrors(json)) {
		throw new MasterScoresError(json.errors);
	}

	return assertSuperstarsData(json);
};
