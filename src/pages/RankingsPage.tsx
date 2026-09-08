import { Box, Drawer, Typography } from '@mui/material';
import { useState } from 'react';

import { PageHeader } from '../components/PageHeader';
import { ProfileCard } from '../components/ProfileCard';
import { OverallLeaderboardTable } from '../components/table/OverallLeaderboardTable';
import { StatType } from '../enums/config';
import { PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';
import { useScreenDetection } from '../hooks/theme';
import { useAllTimeRankings } from '../services/masterScores/useMasterScores';
import { useRankingsPageStyles } from './styles';

export const RankingsPage = () => {
	const { data: rankings = [], isLoading } = useAllTimeRankings();
	const page = usePageLocalisation(PageNames.Rankings);
	const { classes } = useRankingsPageStyles();
	const { isMobile } = useScreenDetection();

	// Only the user's explicit pick is stored; the default selection is derived below.
	const [manualSelection, setManualSelection] = useState<string | undefined>();

	// Rank-1 player, derived from the data rather than the table's visual order, so
	// re-sorting a column never changes which player the view defaults to.
	const defaultPlayerId = rankings.find((row) => row.rank === 1)?.playerId;

	// Reset the manual pick whenever we cross the breakpoint, so each view falls back to its
	// default (desktop → rank-1, mobile → closed).
	const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
	if (prevIsMobile !== isMobile) {
		setPrevIsMobile(isMobile);
		setManualSelection(undefined);
	}

	// Desktop always shows a profile (the rank-1 default until the user picks another);
	// mobile stays closed until an explicit pick.
	const selectedPlayerId = isMobile ? manualSelection : manualSelection ?? defaultPlayerId;

	const closeProfile = () => setManualSelection(undefined);

	return (
		<Box>
			<PageHeader title={page?.title} />
			<Typography variant='h3' className={classes.standingsHeading}>{page?.allTimeStandings}</Typography>
			<Box className={classes.layout}>
				<Box className={classes.main}>
					<OverallLeaderboardTable
						type={StatType.AllTime}
						rows={rankings}
						isLoading={isLoading}
						onSelectPlayer={setManualSelection}
						ariaLabel={page?.allTimeStandings}
					/>
				</Box>
				<Box className={classes.aside}>
					{!isMobile && selectedPlayerId && <ProfileCard playerId={selectedPlayerId} />}
				</Box>
			</Box>
			<Drawer
				anchor='bottom'
				open={isMobile && Boolean(selectedPlayerId)}
				onClose={closeProfile}
				keepMounted
				slotProps={{ paper: { className: classes.drawerPaper }, backdrop: { className: classes.drawerBackdrop } }}
			>
				{selectedPlayerId && <ProfileCard playerId={selectedPlayerId} onClose={closeProfile} />}
			</Drawer>
		</Box>
	);
};
