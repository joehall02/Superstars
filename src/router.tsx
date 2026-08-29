import { createBrowserRouter, Navigate } from 'react-router';

import { ProtectedRoute } from './auth/ProtectedRoute';
import { ErrorPage } from './pages/ErrorPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { GamesPage } from './pages/GamesPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RankingsPage } from './pages/RankingsPage';

/**
 * App route table.
 *
 * Protected pages sit under a single pathless `<ProtectedRoute />` layout route
 * so the auth gate is declared once.
 */
export const router = createBrowserRouter([
	{
		path: '/',
		element: <Navigate to='/rankings' replace />,
	},
	{
		element: <ProtectedRoute />,
		children: [
			{ path: '/rankings', element: <RankingsPage /> },
			{ path: '/games', element: <GamesPage /> },
			{ path: '/games/:gameId', element: <GameDetailsPage /> },
		],
	},
	{ path: '/login', element: <LoginPage /> },
	{ path: '/error', element: <ErrorPage /> },
	{ path: '*', element: <NotFoundPage /> },
]);
