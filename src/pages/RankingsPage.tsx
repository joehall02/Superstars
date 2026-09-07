import { Box, Typography } from '@mui/material';
import { useState } from 'react';

import { OverallLeaderboardTable } from '../components/table/OverallLeaderboardTable';
import { StatType } from '../enums/config';
import { PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';
import { useAllTimeRankings } from '../services/masterScores/useMasterScores';
import { useRankingsPageStyles } from './styles';

export const RankingsPage = () => {
	const { data: rankings = [], isLoading } = useAllTimeRankings();
	const page = usePageLocalisation(PageNames.Rankings);
	const { classes } = useRankingsPageStyles();
	// Selected player drives the ProfileCard slot below — wired now, consumed when the
	// ProfileCard lands (§4.1).
	const [, setSelectedPlayerId] = useState<string | undefined>();

	return (
		<Box>
			<Typography variant='h1'>{page?.title}</Typography>
			<Typography variant='h2'>All-time Standings</Typography>
			<Box className={classes.layout}>
				<Box className={classes.main}>
					<OverallLeaderboardTable
						type={StatType.AllTime}
						rows={rankings}
						isLoading={isLoading}
						onSelectPlayer={setSelectedPlayerId}
					/>
				</Box>
				<Box className={classes.aside}>{/* ProfileCard slot — §4.1 */}</Box>
			</Box>
		</Box>
	);
};
