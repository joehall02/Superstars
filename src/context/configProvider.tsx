import { Box, Typography } from '@mui/material';
import { type ReactNode, useMemo } from 'react';

import { Loading } from '../components/Loading';
import { getPublicAssetBaseUrl } from '../config';
import { createConfigService, useConfigQuery } from '../services/config';
import { useStyles } from '../styles';
import { ConfigContext } from './configContext';

/**
 * Fetches the config once (via React Query), builds the {@link ConfigService}, and
 * provides it to the tree. Sits above the router, so it renders a self-contained
 * loading/error fallback rather than redirecting to the routed Error Page (4.4).
 */
export const ConfigProvider = ({ children }: { children: ReactNode }) => {
	const { classes } = useStyles();
	const { data, isPending, isError } = useConfigQuery();

	const service = useMemo(() => (data ? createConfigService(data, getPublicAssetBaseUrl()) : null), [data]);

	if (isPending) return <Loading />;

	if (isError || !service) {
		return (
			<Box className={classes.centered}>
				<Typography role='alert'>Failed to load site configuration. Please try again later.</Typography>
			</Box>
		);
	}

	return <ConfigContext.Provider value={service}>{children}</ConfigContext.Provider>;
};
