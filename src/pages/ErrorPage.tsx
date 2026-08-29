import { Link } from 'react-router';

export const ErrorPage = () => (
	<main>
		<h1>Something went wrong</h1>
		<p>We couldn&apos;t load the data. Please try again.</p>
		<Link to='/rankings'>Back to rankings</Link>
	</main>
);
