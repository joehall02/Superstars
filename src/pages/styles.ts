import { makeStyles } from 'tss-react/mui';

import { FOOTER_HEIGHT } from '../theme/layout';

/** Component-local styles for `src/pages/`. */
export const useRankingsPageStyles = makeStyles()((theme) => ({
	standingsHeading: {
		padding: theme.spacing(1, 0),
	},
	// Separates the per-year standings section from the all-time section above it.
	yearSection: {
		marginTop: theme.spacing(4),
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
	// Bottom-anchored ProfileCard drawer on mobile: rounded top, capped height, and
	// lifted to sit above the fixed mobile Footer rather than behind it.
	drawerPaper: {
		bottom: FOOTER_HEIGHT,
		maxHeight: `calc(80vh - ${FOOTER_HEIGHT}px)`,
		borderTopLeftRadius: theme.spacing(1),
		borderTopRightRadius: theme.spacing(1),
		// The paper's elevation shadow spills below onto the Footer — drop it.
		boxShadow: 'none',
		'& > .MuiPaper-root': {
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: 0,
		},
	},
	// Stop the greyed overlay at the footer so the Footer bar stays uncovered.
	drawerBackdrop: {
		bottom: FOOTER_HEIGHT,
	},
}));
