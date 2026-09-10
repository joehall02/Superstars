import { Link } from 'react-router';

import { Page } from '../enums/pages';

export const GameDetailsPage = () => (
	<main>
		<Link to={Page.Games}>Back to games</Link>
	</main>
);
