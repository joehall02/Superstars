import { type ReactNode, useMemo } from 'react';

import { Error } from '../components/Error';
import { Loading } from '../components/Loading';
import { getPublicAssetBaseUrl } from '../config';
import { createConfigService, useConfigQuery } from '../services/config';
import { ConfigContext } from './configContext';

/**
 * Fetches the config once (via React Query), builds the {@link ConfigService}, and
 * provides it to the tree. Sits above the router, so it renders a self-contained
 * loading/error fallback rather than redirecting to the routed Error Page (4.4).
 */
export const ConfigProvider = ({ children }: { children: ReactNode }) => {
	const { data, isPending, isError } = useConfigQuery();

	const service = useMemo(() => (data ? createConfigService(data, getPublicAssetBaseUrl()) : null), [data]);

	if (isPending) return <Loading />;

	if (isError || !service) return <Error message='Failed to load site configuration. Please try again later.' />;

	return <ConfigContext.Provider value={service}>{children}</ConfigContext.Provider>;
};
