import { Box, Skeleton, Typography } from '@mui/material';
import { useParams } from 'react-router';

import { Header } from '../components/table/Header';
import { LeaderboardTable } from '../components/table/LeaderboardTable';
import { YearNavigator } from '../components/table/YearNavigator';
import { StatType } from '../enums/config';
import { PageNames } from '../enums/pages';
import { useGameImage, useGameLocalisation, usePageLocalisation } from '../hooks/config';
import { useCachedImage } from '../hooks/image';
import { useYearNavigation } from '../hooks/table';
import { useGame, useGameAllTimeRankings, useGameAvailableYears, useGameYearRankings } from '../services/masterScores/useMasterScores';
import { useGameDetailsPageStyles } from './styles';

export const GameDetailsPage = () => {
	const { gameId = '' } = useParams<{ gameId: string }>();
	const { classes } = useGameDetailsPageStyles();
	const page = usePageLocalisation(PageNames.Games);
	const localisation = useGameLocalisation(gameId);
	const imageUrl = useCachedImage(useGameImage(gameId));
	const { data: game } = useGame(gameId);

	// Prefix the game name to the all-time heading, e.g. "Darts All-time Leaderboard".
	const allTimeTitle = [game?.name, page?.allTimeLeaderboard].filter(Boolean).join(' ');

	const { data: allTimeRankings = [], isLoading: allTimeLoading } = useGameAllTimeRankings(gameId);

	// Per-year leaderboard: only the years this game has data for, defaulting to the latest
	// until the user picks one.
	const { data: availableYears = [] } = useGameAvailableYears(gameId);
	const { activeYear, yearNavigator } = useYearNavigation(availableYears);
	const { data: yearRankings = [], isLoading: yearLoading } = useGameYearRankings(gameId, activeYear ?? 0);

	return (
		<Box>
			<Box className={classes.section1}>
				<Box className={classes.column}>
					<Box className={classes.imagePanel}>
						{imageUrl
							? <img className={classes.image} src={imageUrl} alt='' />
							: <Skeleton variant='rectangular' height='100%' />}
					</Box>
				</Box>
				<Box className={classes.column}>
					<LeaderboardTable
						gameId={gameId}
						type={StatType.AllTime}
						rows={allTimeRankings}
						isLoading={allTimeLoading}
						ariaLabel={allTimeTitle}
						header={<Header title={allTimeTitle} />}
					/>
				</Box>
			</Box>
			<Box className={classes.section2}>
				<Box className={classes.column}>
					<LeaderboardTable
						gameId={gameId}
						type={StatType.ByYear}
						rows={yearRankings}
						isLoading={yearLoading}
						ariaLabel={page?.yearLeaderboard}
						header={<Header title={page?.yearLeaderboard} />}
						footer={activeYear !== undefined && <YearNavigator year={activeYear} {...yearNavigator} />}
					/>
				</Box>
				<Box className={classes.column}>
					<Box className={classes.summaryPanel}>
						<Box>
							<Header title={page?.summary} />
							<Typography className={classes.summaryBody}>{localisation?.summary}</Typography>
						</Box>
						<Box>
							<Header title={page?.rules} />
							<Typography className={classes.summaryBody}>{localisation?.rules}</Typography>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};
