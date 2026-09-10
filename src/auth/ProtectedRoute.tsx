import { Box, Container } from '@mui/material';
import { Navigate, Outlet } from 'react-router';

import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { PageHeader } from '../components/PageHeader';
import { Page } from '../enums/pages';
import { useIsAuthenticated } from '../hooks/auth';
import { useRouteTitle } from '../hooks/route';
import { useProtectedRouteStyles } from './styles';

/**
 * Layout route that gates its children behind authentication.
 *
 * Renders the shared {@link Navbar} plus the matched child route via `<Outlet />`
 * when authenticated, and redirects to `/login` otherwise. The page-header title
 * (above the content border) is resolved from the route via {@link useRouteTitle},
 * so pages don't render their own header; routes without a title handle show none.
 */
export const ProtectedRoute = () => {
	const isAuthenticated = useIsAuthenticated();
	const { classes } = useProtectedRouteStyles();
	const heading = useRouteTitle();

	if (!isAuthenticated) {
		return <Navigate to={Page.Login} replace />;
	}

	return (
		<>
			<Navbar />
			<Container maxWidth='lg' className={classes.container}>
				{heading && <PageHeader title={heading} />}
				<Box className={classes.border}>
					<Outlet />
				</Box>
			</Container>
			<Footer />
		</>
	);
};
