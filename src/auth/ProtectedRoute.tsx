import { Container } from '@mui/material';
import { Navigate, Outlet } from 'react-router';

import { Navbar } from '../components/Navbar';
import { Page } from '../enums/pages';
import { useIsAuthenticated } from '../hooks/auth';

/**
 * Layout route that gates its children behind authentication.
 *
 * Renders the shared {@link Navbar} plus the matched child route via `<Outlet />`
 * when authenticated, and redirects to `/login` otherwise. 
 */
export const ProtectedRoute = () => {
	const isAuthenticated = useIsAuthenticated();

	if (!isAuthenticated) {
		return <Navigate to={Page.Login} replace />;
	}

	return (
		<>
			<Navbar />
			<Container maxWidth='lg'>
				<Outlet />
			</Container>
		</>
	);
};
