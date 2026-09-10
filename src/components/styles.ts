import { alpha } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { FOOTER_HEIGHT } from '../theme/layout';

/** Component-local styles for `src/components/`. */
export const useStyles = makeStyles()(() => ({}));

export const usePageHeaderStyles = makeStyles()(() => ({
	title: {
		textDecoration: 'underline',
	},
}));

export const useLogoStyles = makeStyles<{ height: number }>()((_theme, { height }) => ({
	svg: {
		display: 'block',
		height,
		// Width tracks the viewBox aspect ratio (154.5 / 170.42).
		width: height * 0.9066,
	},
}));

export const useNavbarStyles = makeStyles()((theme) => ({
	// Equal-width left/right sides so the centre section lands on the page centre,
	// regardless of the logo vs. toggle widths.
	side: {
		display: 'flex',
		alignItems: 'center',
		flex: 1,
	},
	sideEnd: {
		justifyContent: 'flex-end',
	},
	logoLink: {
		display: 'flex',
		alignItems: 'center',
		textDecoration: 'none',
		padding: theme.spacing(1.5, 0),
	},
	linksContainer: {
		display: 'flex',
		alignItems: 'center',
		[theme.breakpoints.down('md')]: {
			display: 'none',
		},
	},
	divider: {
		borderColor: 'rgba(255, 255, 255, 0.35)',
		margin: `${theme.spacing(1)} 0`,
	},
	navLink: {
		display: 'inline-flex',
		flexDirection: 'column',
		alignItems: 'center',
		color: 'inherit',
		textDecoration: 'none',
		fontStyle: 'italic',
		fontSize: '1rem',
		fontWeight: 500,
		padding: `0 ${theme.spacing(2)}`,
		opacity: 0.85,
		transition: 'opacity 0.2s ease',
		'&:hover': {
			opacity: 1,
		},
		// Reserve the bold width up front (hidden copy of the label) so toggling the
		// active weight below never changes the element's width and shifts siblings.
		'&::after': {
			content: 'attr(data-label)',
			height: 0,
			fontWeight: 700,
			overflow: 'hidden',
			visibility: 'hidden',
			userSelect: 'none',
			pointerEvents: 'none',
		},
	},
	navLinkActive: {
		opacity: 1,
		fontWeight: 700,
	},
}));

export const useTableStyles = makeStyles<{ height: number }>()((theme, { height }) => ({
	root: {
		width: '100%',
	},
	container: {
		width: '100%',
		height,
		overflowY: 'auto',
		// Slim, muted scrollbar so it recedes rather than dominating the table edge.
		scrollbarWidth: 'thin',
		scrollbarColor: `${theme.palette.divider} transparent`,
		'&::-webkit-scrollbar': {
			width: 8,
		},
		'&::-webkit-scrollbar-track': {
			background: 'transparent',
		},
		'&::-webkit-scrollbar-thumb': {
			backgroundColor: theme.palette.divider,
			borderRadius: 8,
		},
		'&::-webkit-scrollbar-thumb:hover': {
			backgroundColor: theme.palette.action.disabled,
		},
	},
	// Shrinks cell text on narrow screens rather than forcing horizontal scroll first.
	table: {
		[theme.breakpoints.down('sm')]: {
			fontSize: '0.8125rem',
		},
	},
	// Fixed height so a missing player icon (shorter cell) doesn't shrink the row
	// relative to rows that have one.
	bodyRow: {
		height: theme.spacing(5),
	},
	clickableRow: {
		cursor: 'pointer',
	},
	// Full-width region below the scroll container — stays put while columns scroll.
	footer: {
		width: '100%',
		borderTop: `1px solid ${theme.palette.divider}`,
	},
}));

export const useTableHeaderStyles = makeStyles()((theme) => ({
	// Full-width title bar above the column headers — stays put while columns scroll.
	bar: {
		width: '100%',
		padding: theme.spacing(1, 2),
		textAlign: 'center',
		backgroundColor: theme.palette.primary.main,
		color: theme.palette.primary.contrastText,
	},
}));

export const useYearNavigatorStyles = makeStyles()((theme) => ({
	bar: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: theme.spacing(0.5, 1),
	},
	year: {
		fontWeight: 700,
	},
}));

export const usePlayerCellStyles = makeStyles()((theme) => ({
	cell: {
		display: 'flex',
		alignItems: 'center',
		gap: theme.spacing(1),
	},
	// Square (24px) icon; `cover` crops non-square sources rather than distorting them.
	icon: {
		width: theme.spacing(3),
		height: theme.spacing(3),
		objectFit: 'cover',
		display: 'block',
		flexShrink: 0,
	},
}));

export const usePlayersCellStyles = makeStyles()((theme) => ({
	stack: {
		display: 'flex',
		flexDirection: 'column',
		gap: theme.spacing(0.5),
	},
}));

export const useGameHeaderCellStyles = makeStyles()((theme) => ({
	cell: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: theme.spacing(1),
	},
	// SVG game icon; `contain` keeps the whole glyph visible without cropping.
	icon: {
		width: theme.spacing(3),
		height: theme.spacing(3),
		objectFit: 'contain',
		display: 'block',
		flexShrink: 0,
	},
	// Game abbreviation on desktop; icon-only below `md`.
	abbreviation: {
		[theme.breakpoints.down('md')]: {
			display: 'none',
		},
	},
}));

export const useProfileCardStyles = makeStyles()((theme) => ({
	card: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		gap: theme.spacing(2),
		padding: theme.spacing(2),
		backgroundColor: theme.palette.primary.main,
		color: theme.palette.primary.contrastText,
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		height: 56,
		gap: theme.spacing(2),
	},
	// Secondary text on the primary surface — dimmed contrastText, not the theme's
	// text.secondary (which is tuned for the paper background).
	muted: {
		color: alpha(theme.palette.primary.contrastText, 0.7),
	},
	// Divider needs to show on the primary fill; theme divider is too faint here.
	divider: {
		borderColor: alpha(theme.palette.primary.contrastText, 0.2),
	},
	// Larger sibling of the player-cell icon; `cover` crops non-square sources.
	avatar: {
		width: theme.spacing(7),
		height: theme.spacing(7),
		objectFit: 'cover',
		display: 'block',
		flexShrink: 0,
		borderRadius: '50%',
		border: `2px solid ${theme.palette.secondary.main}`,
	},
	// Loading placeholders on the primary fill — MUI's default tint is too faint here.
	skeleton: {
		backgroundColor: alpha(theme.palette.primary.contrastText, 0.15),
	},
	overall: {
		display: 'flex',
		alignItems: 'baseline',
		gap: theme.spacing(1),
	},
	gameList: {
		display: 'flex',
		flexDirection: 'column',
	},
	gameRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: theme.spacing(0.5, 0),
	},
	// Top-right dismiss button, only rendered in the mobile drawer.
	closeButton: {
		position: 'absolute',
		top: theme.spacing(1),
		right: theme.spacing(1),
		color: theme.palette.primary.contrastText,
	},
}));

export const useFooterStyles = makeStyles()((theme) => ({
	// Pinned to the bottom of the viewport and mobile-only — the Navbar links take
	// over from `md` up
	footer: {
		top: 'auto',
		bottom: 0,
		// Sit above the ProfileCard Drawer's Modal (z-index `modal`). Its full-viewport
		// fixed container would otherwise layer over the footer's band, and on iOS Safari
		// that steals the bottom safe-area colour 
		zIndex: theme.zIndex.modal + 1,
		boxShadow: 'none',
		[theme.breakpoints.up('md')]: {
			display: 'none',
		},
	},
	nav: {
		backgroundColor: 'transparent',
		height: FOOTER_HEIGHT,
	},
	navLink: {
		color: 'inherit',
		opacity: 0.7,
		transition: 'opacity 0.2s ease, color 0.2s ease',
		'&.Mui-selected': {
			opacity: 1,
			color: theme.palette.secondary.main,
		},
	},
}));
