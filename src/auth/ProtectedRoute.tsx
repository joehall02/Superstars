import { Box, Container } from '@mui/material';
import { Navigate, Outlet } from 'react-router';

import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { PageHeader } from '../components/PageHeader';
import { SiteFooter } from '../components/SiteFooter';
import { Page } from '../enums/pages';
import { useIsAuthenticated } from '../hooks/auth';
import { useRouteTitle, useScrollToTop } from '../hooks/route';
import { useHasMasterScoresError } from '../services/masterScores/useMasterScoresErrors';
import { useProtectedRouteStyles } from './styles';

/**
 * Layout route that gates its children behind authentication.
 *
 * Renders the shared {@link Navbar} plus the matched child route via `<Outlet />`
 * when authenticated, and redirects to `/login` otherwise. The page-header title
 * (above the content border) is resolved from the route via {@link useRouteTitle},
 * so pages don't render their own header; routes without a title handle show none.
 *
 * Also the central data-load error gate: the shared `['masterScores']` fetch is
 * observed once here, so a failure redirects every data-backed page to `/error` rather
 * than each page handling it — mirroring the config provider's central error handling.
 */
export const ProtectedRoute = () => {
	const isAuthenticated = useIsAuthenticated();
	const hasDataError = useHasMasterScoresError();
	const { classes } = useProtectedRouteStyles();
	const { title, iconUrl } = useRouteTitle();

	useScrollToTop();

	if (!isAuthenticated) {
		return <Navigate to={Page.Login} replace />;
	}

	if (hasDataError) {
		return <Navigate to={Page.Error} replace />;
	}

	return (
		<Box className={classes.root}>
			<Navbar />
			<Container maxWidth='lg' className={classes.container}>
				{title && <PageHeader title={title} iconUrl={iconUrl} />}
				<Box className={classes.border}>
					<Box className={classes.content}>
						<Outlet />
					</Box>
					<SiteFooter />
				</Box>
			</Container>
			<Footer />
		</Box>
	);
};
