import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, Typography } from '@mui/material';

import { useYearNavigatorStyles } from '../styles';

interface IYearNavigatorProps {
	year: number;
	onPrevious: () => void;
	onNext: () => void;
	canGoPrevious: boolean;
	canGoNext: boolean;
}

/**
 * Presentational year switcher: previous/next arrows either side of the current year.
 * Domain-agnostic — the owner supplies the year, handlers, and boundary flags — so it can
 * sit in any {@link Table} footer (Rankings per-year standings, Game Details per-year
 * leaderboard, …).
 */
export const YearNavigator = ({ year, onPrevious, onNext, canGoPrevious, canGoNext }: IYearNavigatorProps) => {
	const { classes } = useYearNavigatorStyles();

	return (
		<Box className={classes.bar}>
			<IconButton aria-label='Previous year' onClick={onPrevious} disabled={!canGoPrevious} size='small'>
				<ChevronLeftIcon />
			</IconButton>
			<Typography variant='subtitle1' className={classes.year}>{year}</Typography>
			<IconButton aria-label='Next year' onClick={onNext} disabled={!canGoNext} size='small'>
				<ChevronRightIcon />
			</IconButton>
		</Box>
	);
};
