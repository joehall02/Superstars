import { makeStyles } from 'tss-react/mui';

import { cardSurface, imageTile, imageTileImage, imageTileOverlay } from '../styles';
import { FOOTER_HEIGHT } from '../theme/layout';

/** Component-local styles for `src/pages/`. */
export const useGamesPageStyles = makeStyles()((theme) => ({
	// Responsive grid, capped at 3 columns: 3 on desktop, 2 on tablet, 1 on mobile.
	grid: {
		display: 'grid',
		gap: theme.spacing(3),
		gridTemplateColumns: 'repeat(3, 1fr)',
		[theme.breakpoints.down('lg')]: {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		[theme.breakpoints.down('sm')]: {
			gridTemplateColumns: '1fr',
		},
	},
}));

export const useRankingsPageStyles = makeStyles()((theme) => ({
	// Separates the year section from the all-time section above it, and lays its two
	// tables (standings + champions) side by side at equal width on desktop, stacked on mobile.
	yearSection: {
		marginTop: theme.spacing(4),
		display: 'flex',
		alignItems: 'flex-start',
		gap: theme.spacing(3),
		[theme.breakpoints.down('md')]: {
			flexDirection: 'column',
			alignItems: 'stretch',
		},
	},
	// Each year-section table takes an equal half of the row (minWidth:0 prevents overflow).
	yearColumn: {
		flex: 1,
		minWidth: 0,
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

export const useGameDetailsPageStyles = makeStyles()((theme) => ({
	// Section 1 (image + all-time leaderboard) and Section 2 (per-year leaderboard +
	// summary/rules) both lay their two halves side by side on desktop and stack on mobile.
	// DOM order puts the image / per-year table first so each lands on top when stacked.
	section1: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: theme.spacing(3),
		[theme.breakpoints.down('md')]: {
			flexDirection: 'column',
			alignItems: 'stretch',
		},
	},
	section2: {
		marginTop: theme.spacing(4),
		display: 'flex',
		alignItems: 'flex-start',
		gap: theme.spacing(3),
		[theme.breakpoints.down('md')]: {
			flexDirection: 'column',
			alignItems: 'stretch',
		},
	},
	// Equal halves (minWidth:0 prevents the table from overflowing its column).
	column: {
		flex: 1,
		minWidth: 0,
	},
	// Game image: the same 4:3 framed tile as the Games grid, grey wash and hover zoom included.
	imagePanel: {
		...imageTile(theme),
		borderRadius: 0,
	},
	image: imageTileImage,
	// Grey wash over the image, matching the Games grid tiles.
	overlay: imageTileOverlay(theme),
	// Summary/Rules: stacked Header-bar + body blocks, matching the table cards beside them.
	summaryPanel: {
		display: 'flex',
		flexDirection: 'column',
		gap: theme.spacing(3),
	},
	// Each block is a framed paper card — same treatment as the tables — with the primary
	// Header bar clipped to the top corners, so they read as finished panels rather than
	// loose text on the page.
	summaryCard: cardSurface(theme),
	summaryBody: {
		padding: theme.spacing(2, 2.5),
		lineHeight: 1.7,
		borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.secondary.main}`,
		color: theme.palette.text.secondary,
	},
}));
