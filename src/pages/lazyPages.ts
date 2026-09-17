import { lazy } from 'react';

// Pages are lazy-loaded so each becomes its own chunk, fetched on navigation
// rather than shipped in the initial bundle. `React.lazy` needs a default export,
// so each named page export is adapted here.
export const ErrorPage = lazy(() => import('./ErrorPage').then((m) => ({ default: m.ErrorPage })));
export const GameDetailsPage = lazy(() => import('./GameDetailsPage').then((m) => ({ default: m.GameDetailsPage })));
export const GamesPage = lazy(() => import('./GamesPage').then((m) => ({ default: m.GamesPage })));
export const LoginPage = lazy(() => import('./LoginPage').then((m) => ({ default: m.LoginPage })));
export const NotFoundPage = lazy(() => import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
export const RankingsPage = lazy(() => import('./RankingsPage').then((m) => ({ default: m.RankingsPage })));
