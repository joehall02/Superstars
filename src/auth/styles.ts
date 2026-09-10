import { alpha } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { FOOTER_HEIGHT } from '../theme/layout';

/** Component-local styles for `src/auth/`. */
export const useProtectedRouteStyles = makeStyles()((theme) => ({
	root: {
		display: 'flex',
		flexDirection: 'column',
		minHeight: '100dvh',
		// Faint translucent `primary` wash tints the whole page behind the content panel
		backgroundColor: alpha(theme.palette.primary.main, 0.08),
	},
	// Shared top/bottom breathing room for every page rendered via the `<Outlet />`.
	// Padding (not margin) so the space is inside the scroll area: it can't collapse
	// into the body, and the bottom room lets content scroll clear of the fixed
	// mobile Footer rather than hiding behind it. `flexGrow` fills the remaining
	// viewport height below the Navbar so the panel can reach the bottom.
	container: {
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		paddingTop: theme.spacing(3),
		paddingBottom: 0,
		// Below `md`: go edge-to-edge horizontally (drop the Container gutters).
		[theme.breakpoints.down('md')]: {
			paddingLeft: 0,
			paddingRight: 0,
		},
	},
	// Content panel wrapping every page's content. Sits below the PageHeader, which
	// the layout renders above it (outside the panel). 
	border: {
		flexGrow: 1,
		backgroundColor: theme.palette.background.paper,
		border: `3px solid ${theme.palette.secondary.main}`,
		borderBottom: 'none',
		borderTopLeftRadius: theme.shape.borderRadius,
		borderTopRightRadius: theme.shape.borderRadius,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		padding: theme.spacing(4),
		// Edge-to-edge on mobile
		[theme.breakpoints.down('md')]: {
			borderLeft: 'none',
			borderRight: 'none',
			borderTopLeftRadius: 0,
			borderTopRightRadius: 0,
			paddingBottom: `calc(${theme.spacing(4)} + ${FOOTER_HEIGHT}px)`,
		},
	},
}));
