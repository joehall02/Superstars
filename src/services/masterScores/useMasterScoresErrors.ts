import { type QueryClient, useQuery } from '@tanstack/react-query';

import { MasterScoresError } from '../loadErrors';
import { fetchMasterScores } from './fetchMasterScores';
import { masterScoresKey } from './useMasterScores';

/**
 * Whether the master scores query has failed — the one `['masterScores']` fetch errored
 * or returned an invalid payload. Subscribing (so it reacts the moment the query errors);
 * drives the central error gate — a single check in the protected layout redirects to
 * `/error` for every data-backed page. The ErrorPage reads the details via {@link readMasterScoresError}.
 */
export const useHasMasterScoresError = (): boolean => {
	const { error } = useQuery({ queryKey: masterScoresKey, queryFn: fetchMasterScores });
	return error instanceof MasterScoresError;
};

/**
 * Reads the cached dataset error without subscribing (so it never re-triggers a fetch).
 * The routed Error Page uses this to render the failure details the gate redirected on.
 */
export const readMasterScoresError = (client: QueryClient): MasterScoresError | null => {
	const error = client.getQueryState(masterScoresKey)?.error;
	return error instanceof MasterScoresError ? error : null;
};
