import { makeStyles } from 'tss-react/mui';

import { FOOTER_HEIGHT } from '../theme/layout';

/** Component-local styles for `src/auth/`. */
export const useProtectedRouteStyles = makeStyles()((theme) => ({
	// Shared top/bottom breathing room for every page rendered via the `<Outlet />`.
	// Padding (not margin) so the space is inside the scroll area: it can't collapse
	// into the body, and the bottom room lets content scroll clear of the fixed
	// mobile Footer rather than hiding behind it.
	container: {
		paddingTop: theme.spacing(3),
		paddingBottom: theme.spacing(3),
		// Below `md` the fixed Footer overlays the bottom of the viewport, so add its
		// height to keep the last content reachable.
		[theme.breakpoints.down('md')]: {
			paddingBottom: `calc(${theme.spacing(4)} + ${FOOTER_HEIGHT}px)`,
		},
	},
}));
