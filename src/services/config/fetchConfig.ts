import { CONFIG_FILES, getConfigBaseUrl, LOCAL_CONFIG_BASE } from '../../config';
import { DataLoadResource } from '../../enums/errors';
import { type AppConfig } from '../../types/config.types';
import { jsonFetcher } from '../fetchJson';
import { ConfigError } from '../loadErrors';
import { assertAppConfig } from './configsGuard';

const fetchConfigJson = jsonFetcher(DataLoadResource.Config, ConfigError);

const fetchAppConfigFrom = async (base: string): Promise<AppConfig> => {
	const [images, localisation, stats, layout] = await Promise.all(
		CONFIG_FILES.map((file) => fetchConfigJson(`${base}/${file}`)),
	);

	return assertAppConfig({ images, localisation, stats, layout });
};

/**
 * React Query `queryFn` for the config layer. Fetches all four files once; in prod,
 * a failed GCS fetch falls back to the bundled local copy so a bucket outage doesn't
 * break the app. Any remaining failure throws a {@link ConfigError} for the Error Page.
 */
export const fetchAppConfig = async (): Promise<AppConfig> => {
	const base = getConfigBaseUrl();

	try {
		return await fetchAppConfigFrom(base);
	} catch (error) {
		if (base !== LOCAL_CONFIG_BASE) return fetchAppConfigFrom(LOCAL_CONFIG_BASE);

		throw error;
	}
};
