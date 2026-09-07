import { Link } from 'react-router';

import { Page } from '../enums/pages';

export const NotFoundPage = () => (
	<main>
		<h1>404 — Page Not Found</h1>
		<p>The page you are looking for does not exist.</p>
		<Link to={Page.Rankings}>Back to rankings</Link>
	</main>
);
