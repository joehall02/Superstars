import { type PageNames } from '../enums/pages';

/** Narrows an unknown value to a plain object, so its keys can be safely inspected. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

/**
 * How a route derives its page-header title: either static text from the
 * localisation config (`page`), or resolved at runtime from the `:gameId` URL
 * param via master-scores (`gameParam`).
 */
export type RouteTitle =
	| { source: 'page'; page: PageNames }
	| { source: 'gameParam' };

/** Per-route metadata read off a matched route's `handle`. */
export interface IRouteHandle {
	title: RouteTitle;
}

/** Narrows a route's `unknown` handle to {@link IRouteHandle}. */
export const isRouteHandle = (handle: unknown): handle is IRouteHandle =>
	isRecord(handle) && 'title' in handle;
