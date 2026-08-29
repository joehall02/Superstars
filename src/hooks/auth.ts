/**
 * Auth gate for protected routes.
 *
 * Stub: always returns `true` for now so the routing structure is navigable.
 * TODO(auth): read localStorage / validate the site password here — this stays
 * the single source of truth when the real auth pass lands.
 */
export const useIsAuthenticated = (): boolean => true;
