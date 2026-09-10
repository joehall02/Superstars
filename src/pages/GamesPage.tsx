import { Link } from 'react-router';

import { Page } from '../enums/pages';

export const GamesPage = () => (
	<main>
		<Link to={Page.Rankings}>Back to rankings</Link>
	</main>
);
