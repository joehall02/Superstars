import { Navigate, Outlet } from 'react-router';

import { useIsAuthenticated } from './useAuth';

/**
 * Layout route that gates its children behind authentication.
 *
 * Renders the matched child route via `<Outlet />` when authenticated, and
 * redirects to `/login` otherwise.
 */
export const ProtectedRoute = () => {
	const isAuthenticated = useIsAuthenticated();

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	return <Outlet />;
};
