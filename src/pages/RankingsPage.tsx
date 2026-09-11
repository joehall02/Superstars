import { Box, Drawer } from '@mui/material';
import { useState } from 'react';

import { ProfileCard } from '../components/ProfileCard';
import { Header } from '../components/table/Header';
import { OverallLeaderboardTable } from '../components/table/OverallLeaderboardTable';
import { YearChampionTable } from '../components/table/YearChampionTable';
import { YearNavigator } from '../components/table/YearNavigator';
import { StatType } from '../enums/config';
import { PageNames } from '../enums/pages';
import { usePageLocalisation } from '../hooks/config';
import { useYearNavigation } from '../hooks/table';
import { useScreenDetection } from '../hooks/theme';
import { useAllTimeRankings, useAllYearChampions, useAvailableYears, useYearRankings } from '../services/masterScores/useMasterScores';
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

	// Section 2: per-year standings. Defaults to the latest year until the user picks one
	// via the switcher.
	const { data: years = [] } = useAvailableYears();
	const { activeYear, yearNavigator } = useYearNavigation(years);
	const { data: yearRankings = [], isLoading: yearLoading } = useYearRankings(activeYear ?? 0);

	// Champions table lists every year at once, so it's independent of the active year.
	const { data: champions = [], isLoading: championsLoading } = useAllYearChampions();

	return (
		<Box>
			<Box className={classes.layout}>
				<Box className={classes.main}>
					<OverallLeaderboardTable
						type={StatType.AllTime}
						rows={rankings}
						isLoading={isLoading}
						onSelectPlayer={setManualSelection}
						ariaLabel={page?.allTimeStandings}
						header={<Header title={page?.allTimeStandings} />}
						height={isMobile ? 400 : 500}
					/>
				</Box>
				<Box className={classes.aside}>
					{!isMobile && selectedPlayerId && <ProfileCard playerId={selectedPlayerId} />}
				</Box>
			</Box>
			<Box className={classes.yearSection}>
				<Box className={classes.yearColumn}>
					<OverallLeaderboardTable
						type={StatType.ByYear}
						rows={yearRankings}
						isLoading={yearLoading}
						ariaLabel={page?.yearStandings}
						header={<Header title={page?.yearStandings} />}
						footer={activeYear !== undefined && <YearNavigator year={activeYear} {...yearNavigator} />}
					/>
				</Box>
				<Box className={classes.yearColumn}>
					<YearChampionTable
						champions={champions}
						isLoading={championsLoading}
						ariaLabel={page?.yearChampions}
						header={<Header title={page?.yearChampions} />}
					/>
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
