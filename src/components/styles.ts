import { makeStyles } from 'tss-react/mui';

/** Component-local styles for `src/components/`. */
export const useStyles = makeStyles()(() => ({}));

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
