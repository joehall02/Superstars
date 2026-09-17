import { type ReactNode, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import { ProtectedRoute } from './auth/ProtectedRoute';
import { Loading } from './components/Loading';
import { Page, PageNames } from './enums/pages';
import { ErrorPage, GameDetailsPage, GamesPage, LoginPage, NotFoundPage, RankingsPage } from './pages/lazyPages';
import { queryClient } from './queryClient';
import { fetchMasterScores } from './services/masterScores/fetchMasterScores';
import { masterScoresKey } from './services/masterScores/useMasterScores';

const withSuspense = (element: ReactNode) => <Suspense fallback={<Loading />}>{element}</Suspense>;

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
			{ path: Page.Rankings, element: withSuspense(<RankingsPage />), handle: { title: { source: 'page', page: PageNames.Rankings } } },
			{ path: Page.Games, element: withSuspense(<GamesPage />), handle: { title: { source: 'page', page: PageNames.Games } } },
			{ path: `${Page.Games}/:gameId`, element: withSuspense(<GameDetailsPage />), handle: { title: { source: 'gameParam' } } },
		],
	},
	{ path: Page.Login, element: withSuspense(<LoginPage />) },
	{ path: Page.Error, element: withSuspense(<ErrorPage />) },
	{ path: '*', element: withSuspense(<NotFoundPage />) },
]);
