import { Link } from 'react-router';

import { PageHeader } from '../components/PageHeader';
import { Page, PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';

export const GamesPage = () => {
	const page = usePageLocalisation(PageNames.Games);

	return (
		<main>
			<PageHeader title={page?.title} />
			<Link to={Page.Rankings}>Back to rankings</Link>
		</main>
	);
};
