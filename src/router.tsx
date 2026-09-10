import { createBrowserRouter, Navigate } from 'react-router';

import { ProtectedRoute } from './auth/ProtectedRoute';
import { Page, PageNames } from './enums/pages';
import { ErrorPage } from './pages/ErrorPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { GamesPage } from './pages/GamesPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RankingsPage } from './pages/RankingsPage';
import { queryClient } from './queryClient';
import { fetchMasterScores } from './services/masterScores/fetchMasterScores';
import { masterScoresKey } from './services/masterScores/useMasterScores';

/**
 * Warms the dataset cache on entry to any protected route, so pages read it from
 * cache instead of each firing the fetch on mount. Never runs for routes, which
 * sits outside the protected layout — so an unauthenticated user never triggers it.
 *
 * Fire-and-forget: navigation isn't blocked; pages render immediately and read the
 * data via their hooks (with their own loading state). `staleTime`/`gcTime` are
 * `Infinity`, so `query()` returns the cached value on every later navigation and
 * the fetch runs exactly once per session.
 */
const masterScoresLoader  = () => {
	void queryClient.query({ queryKey: masterScoresKey, queryFn: fetchMasterScores }).catch(() => {});
	return null;
};

/**
 * App route table.
 *
 * Protected pages sit under a single pathless `<ProtectedRoute />` layout route
 * so the auth gate is declared once.
 */
export const router = createBrowserRouter([
	{
		path: '/',
		element: <Navigate to={Page.Rankings} replace />,
	},
	{
		element: <ProtectedRoute />,
		loader: masterScoresLoader,
		children: [
			{ path: Page.Rankings, element: <RankingsPage />, handle: { title: { source: 'page', page: PageNames.Rankings } } },
			{ path: Page.Games, element: <GamesPage />, handle: { title: { source: 'page', page: PageNames.Games } } },
			{ path: `${Page.Games}/:gameId`, element: <GameDetailsPage />, handle: { title: { source: 'gameParam' } } },
		],
	},
	{ path: Page.Login, element: <LoginPage /> },
	{ path: Page.Error, element: <ErrorPage /> },
	{ path: '*', element: <NotFoundPage /> },
]);
