import { useNavigate } from 'react-router';

import { Error } from '../components/Error';
import { Page, PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';

/**
 * Catch-all 404 for unknown routes (`*`). Renders the shared {@link Error} component (same
 * treatment as the Error page), with a link back to Rankings.
 */
export const NotFoundPage = () => {
	const navigate = useNavigate();
	const page = usePageLocalisation(PageNames.NotFound);

	return (
		<Error
			title={page?.title ?? '404 Page not found'}
			message={page?.message ?? 'The page you\'re looking for doesn\'t exist.'}
			actionLabel='Back to Rankings'
			onAction={() => navigate(Page.Rankings)}
		/>
	);
};
