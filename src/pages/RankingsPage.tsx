import { Box, Typography } from '@mui/material';

import { LeaderboardTable } from '../components/table/LeaderboardTable';
import { StatType } from '../enums/config';
import { useGameAllTimeRankings } from '../services/masterScores/useMasterScores';

// TEMP: example wiring of LeaderboardTable to real master-scores data (Air Hockey, g_1).
// Remove once the Rankings page sections (§4.1) are built.
const EXAMPLE_GAME_ID = 'g_1';

export const RankingsPage = () => {
	const { data: rankings = [], isLoading } = useGameAllTimeRankings(EXAMPLE_GAME_ID);

	return (
		<Box>
			<Typography variant='h1'>Rankings</Typography>
			<LeaderboardTable
				gameId={EXAMPLE_GAME_ID}
				type={StatType.AllTime}
				rows={rankings}
				isLoading={isLoading}
				// eslint-disable-next-line no-console
				onSelectPlayer={(playerId) => console.log('selected player', playerId)}
			/>
		</Box>
	);
};
