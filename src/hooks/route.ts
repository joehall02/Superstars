import { useEffect } from 'react';
import { useLocation, useMatches } from 'react-router';

import { isRouteHandle } from '../helpers/typeGuards';
import { useGame } from '../services/masterScores/useMasterScores';
import { usePageLocalisation } from './config';

/**
 * Jumps the window back to the top whenever the path changes, so a new page always
 * opens at its start rather than inheriting the previous page's scroll position.
 */
export const useScrollToTop = (): void => {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo(0, 0);
	}, [pathname]);
};

/**
 * Resolves the current route's page-header title from the leaf match's `handle`.
 *
 * The `handle.title` declares the source: static localisation text (`page`), or the
 * game name resolved from the `:gameId` param via master-scores (`gameParam`). Both
 * lookups run unconditionally (hooks rules); the inapplicable one gets an empty key
 * and resolves to `undefined` without fetching anything real. Returns `undefined`
 * for routes without a title handle, so the caller can skip rendering a header.
 */
export const useRouteTitle = (): string | undefined => {
	const leaf = useMatches().at(-1);
	const handle = isRouteHandle(leaf?.handle) ? leaf.handle : undefined;
	const title = handle?.title;

	const page = usePageLocalisation(title?.source === 'page' ? title.page : '');
	const game = useGame(title?.source === 'gameParam' ? leaf?.params.gameId ?? '' : '');

	return title?.source === 'gameParam' ? game.data?.name : page?.title;
};
