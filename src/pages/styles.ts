import { makeStyles } from 'tss-react/mui';

/** Component-local styles for `src/pages/`. */
export const useRankingsPageStyles = makeStyles()((theme) => ({
	standingsHeading: {
		padding: theme.spacing(1, 0),
	},
	layout: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: theme.spacing(3),
		[theme.breakpoints.down('md')]: {
			flexDirection: 'column',
			alignItems: 'stretch',
		},
	},
	main: {
		flex: 1,
		minWidth: 0,
	},
	// ProfileCard slot — hidden on mobile, where it becomes an overlay instead (§4.1).
	aside: {
		width: theme.spacing(40),
		flexShrink: 0,
		[theme.breakpoints.down('md')]: {
			display: 'none',
		},
	},
}));
