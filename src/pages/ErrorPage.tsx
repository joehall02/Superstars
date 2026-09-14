import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';

import { Error } from '../components/Error';
import { Page, PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';
import { masterScoresKey } from '../services/masterScores/useMasterScores';
import { readMasterScoresError } from '../services/masterScores/useMasterScoresErrors';

/**
 * Shown when the master scores dataset fetch fails or returns an invalid shape — the protected
 * layout's error gate redirects here. Renders the failure's machine-readable details (converter
 * `ConversionError`s or a frontend `DataLoadError`) via the shared {@link Error} component, with a
 * retry that clears the cached error and re-attempts the load.
 */
export const ErrorPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const page = usePageLocalisation(PageNames.Error);

	const error = readMasterScoresError(queryClient);

	// Clear the cached failure so the next mount refetches, then head to Rankings. If the
	// data is still broken the gate lands us back here; if it recovers, Rankings renders.
	const handleRetry = () => {
		void queryClient.resetQueries({ queryKey: masterScoresKey });
		navigate(Page.Rankings);
	};

	// No active error — a manual refresh or direct visit to /error wipes the in-memory query
	// cache, so there's nothing to show here. Bounce to Rankings and let the gate re-evaluate:
	// if the data is still broken it redirects back here with the error populated.
	if (!error) {
		return <Navigate to={Page.Rankings} replace />;
	}

	return (
		<Error
			title={page?.title ?? 'Something went wrong'}
			message={page?.message ?? 'We couldn\'t load the Superstars data. Please try again.'}
			details={error.errors}
			actionLabel='Try again'
			onAction={handleRetry}
		/>
	);
};
