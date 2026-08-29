import { Link, useParams } from 'react-router';

export const GameDetailsPage = () => {
	const { gameId } = useParams();

	return (
		<main>
			<h1>Game: {gameId}</h1>
			<Link to='/games'>Back to games</Link>
		</main>
	);
};
