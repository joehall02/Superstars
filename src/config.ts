import { ConfigFile, DataSource } from './enums/config';

export const DATA_SOURCE_URLS: Record<DataSource, string> = {
	[DataSource.Local]: '/data/master-scores.json',
	[DataSource.Api]: '/api/data',
};

/** Path prefix for the git-tracked config JSON served from `public/configs/` (dev + prod fallback). */
export const LOCAL_CONFIG_BASE = '/configs';

/** The config files fetched at startup, relative to the resolved config base. */
export const CONFIG_FILES = [ConfigFile.Images, ConfigFile.Localisation, ConfigFile.Stats, ConfigFile.Layout];

/**
 * Resolves the base URL the config files are fetched from:
 * - dev → the local copy served by Vite ({@link LOCAL_CONFIG_BASE})
 * - prod → the GCS public bucket ({@link LOCAL_CONFIG_BASE} appended to `VITE_GCS_PUBLIC_BASE_URL`)
 *
 * Falls back to {@link LOCAL_CONFIG_BASE} in prod when `VITE_GCS_PUBLIC_BASE_URL` is unset,
 * so the bundled copy still works.
 */
export const getConfigBaseUrl = (): string => {
	if (import.meta.env.DEV) return LOCAL_CONFIG_BASE;

	const base = import.meta.env.VITE_GCS_PUBLIC_BASE_URL;

	return base ? `${base}${LOCAL_CONFIG_BASE}` : LOCAL_CONFIG_BASE;
};

/** Absolute base URL for image/icon assets on the GCS public bucket (empty when unset — dev has no local copies). */
export const getPublicAssetBaseUrl = (): string => import.meta.env.VITE_GCS_PUBLIC_BASE_URL ?? '';
