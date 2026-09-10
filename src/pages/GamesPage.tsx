import { Box } from '@mui/material';
import { useNavigate } from 'react-router';

import { GameBox } from '../components/GameBox';
import { Page } from '../enums/pages';
import { useAllGames } from '../services/masterScores/useMasterScores';
import { useGamesPageStyles } from './styles';

export const GamesPage = () => {
	const { data: games = [], isLoading } = useAllGames();
	const { classes } = useGamesPageStyles();
	const navigate = useNavigate();

	return (
		<Box className={classes.grid}>
			{isLoading
				? Array.from({ length: 6 }, (_, index) => <GameBox key={index} gameId='' name='' isLoading />)
				: games.map((game) => (
					<GameBox
						key={game.id}
						gameId={game.id}
						name={game.name}
						onClick={() => navigate(`${Page.Games}/${game.id}`)}
					/>
				))}
		</Box>
	);
};
