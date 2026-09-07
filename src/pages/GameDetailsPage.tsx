import { Link, useParams } from 'react-router';

import { Page } from '../enums/pages';

export const GameDetailsPage = () => {
	const { gameId } = useParams();

	return (
		<main>
			<h1>Game: {gameId}</h1>
			<Link to={Page.Games}>Back to games</Link>
		</main>
	);
};
