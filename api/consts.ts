/**
 * Data changes at most yearly, so cache hard at the CDN edge (`s-maxage`), which a
 * redeploy/purge can bust. `max-age=0` forces browsers to revalidate every load so
 * they never serve a stale copy we can't control; `stale-while-revalidate` lets the
 * edge serve instantly while refreshing in the background.
 */
export const CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
