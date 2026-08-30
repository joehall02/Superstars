import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { type AppConfig } from '../../types/config.types';
import { fetchAppConfig } from './fetchConfig';

/** The config is fetched once under a single query key and cached for the app's lifetime. */
export const configKey = ['config'];

export const useConfigQuery = (): UseQueryResult<AppConfig> =>
	useQuery({ queryKey: configKey, queryFn: fetchAppConfig });
