import { alpha } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { cardSurface, imageTile, imageTileImage, imageTileOverlay, primarySurface } from '../styles';
import { FOOTER_HEIGHT } from '../theme/layout';

/** Component-local styles for `src/components/`. */
export const useStyles = makeStyles()(() => ({}));

export const usePageHeaderStyles = makeStyles<{ iconUrl?: string }>()((theme, { iconUrl }) => ({
	root: {
		display: 'flex',
		alignItems: 'center',
		gap: theme.spacing(2),
		marginBottom: theme.spacing(3),
		[theme.breakpoints.down('md')]: {
			gap: theme.spacing(1.25),
			paddingLeft: theme.spacing(2),
		},
	},
	// External monochrome-black SVG masked so its fill takes an exact theme colour (its own
	// fill isn't reachable): title blue in light mode, white in dark.
	icon: {
		height: theme.spacing(6),
		width: theme.spacing(6),
		flexShrink: 0,
		backgroundColor: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
		maskImage: iconUrl ? `url(${iconUrl})` : undefined,
		maskRepeat: 'no-repeat',
		maskPosition: 'center',
		maskSize: 'contain',
		WebkitMaskImage: iconUrl ? `url(${iconUrl})` : undefined,
		WebkitMaskRepeat: 'no-repeat',
		WebkitMaskPosition: 'center',
		WebkitMaskSize: 'contain',
		[theme.breakpoints.down('md')]: {
			height: theme.spacing(4.5),
			width: theme.spacing(4.5),
		},
	},
	title: {
		color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
		lineHeight: 1,
		paddingLeft: theme.spacing(2),
		borderLeft: `${theme.spacing(1.75)} solid ${theme.palette.secondary.main}`,
		[theme.breakpoints.down('md')]: {
			paddingLeft: theme.spacing(1.25),
			borderLeftWidth: theme.spacing(0.5),
		},
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
	// Solid primary fill (shared with Footer/Header/ProfileCard) so the sticky bar and the
	// safe area above it read as one colour on iOS Safari.
	bar: primarySurface(theme),
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

export const useTableStyles = makeStyles<{ height: number | 'auto' }>()((theme, { height }) => ({
	root: {
		width: '100%',
		...cardSurface(theme),
		borderRadius: 0,
	},
	container: {
		width: '100%',
		height,
		overflowY: 'auto',
		// Secondary-colour spine down the body's left edge — starts below the Header bar (its
		// own element above) and is clipped to the card's rounded bottom-left corner.
		borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.secondary.main}`,
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
		// Continue the container's left spine through the footer so it runs unbroken to the bottom.
		borderLeft: `${theme.spacing(0.5)} solid ${theme.palette.secondary.main}`,
	},
}));

export const useTableHeaderStyles = makeStyles()((theme) => ({
	// Full-width title bar above the column headers — stays put while columns scroll.
	bar: {
		width: '100%',
		padding: theme.spacing(1, 2),
		textAlign: 'center',
		...primarySurface(theme),
	},
	title: {
		fontWeight: 700,
		fontStyle: 'italic',
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
	// Icons are external monochrome-black SVGs, so recolour via filter (their fill isn't reachable): invert to white in dark mode.
	icon: {
		width: theme.spacing(3),
		height: theme.spacing(3),
		objectFit: 'contain',
		display: 'block',
		flexShrink: 0,
		filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
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
		...primarySurface(theme),
		borderRadius: 0,
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		height: 56,
		gap: theme.spacing(2),
	},
	name: {
		fontWeight: 700,
	},
	// Secondary text on the primary surface — dimmed contrastText, not the theme's
	// text.secondary (which is tuned for the paper background).
	muted: {
		color: alpha(theme.palette.primary.contrastText, 0.7),
	},
	divider: {
		borderColor: theme.palette.secondary.main,
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
		alignItems: 'center',
		gap: theme.spacing(1),
		// Collapse each variant's leading so the differing subtitle1/body2 line-heights
		// don't leave the smaller score sitting off-centre against the rank.
		'& > *': {
			lineHeight: 1,
		},
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

export const useGameBoxStyles = makeStyles()((theme) => ({
	card: {
		...imageTile(theme),
		cursor: 'pointer',
		borderRadius: 0,
	},
	image: imageTileImage,
	overlay: imageTileOverlay(theme),
	// Game name anchored to the top, above the overlay.
	name: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		padding: theme.spacing(1.5, 2),
		color: theme.palette.common.white,
		fontWeight: 700,
		fontStyle: 'italic',
	},
	// Loading placeholder matching the tile's footprint (stands alone in the grid cell,
	// so it carries its own aspect ratio rather than absolute-filling the card).
	skeleton: {
		width: '100%',
		height: '100%',
		aspectRatio: '4 / 3',
	},
}));

export const useFooterStyles = makeStyles()((theme) => ({
	// Pinned to the bottom of the viewport and mobile-only — the Navbar links take
	// over from `md` up
	footer: {
		top: 'auto',
		bottom: 0,
		// Solid primary fill (shared with Navbar/Header/ProfileCard) so the fixed bar and the
		// safe area below it read as one colour on iOS Safari.
		...primarySurface(theme),
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
