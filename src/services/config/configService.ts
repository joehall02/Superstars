import { getPublicAssetBaseUrl } from '../../config';
import { type AppConfig, type ConfigService } from '../../types/config.types';

/**
 * Creates the config getter surface: a plain object of pure getters that read from the
 * loaded `config`. Image getters prepend the GCS public base URL, and every getter returns
 * `undefined`/empty for a missing id so a config gap never crashes a page.
 */
export const createConfigService = (config: AppConfig): ConfigService => {
	const assetBase = getPublicAssetBaseUrl();
	const toAssetUrl = (path: string | undefined): string | undefined =>
		path === undefined ? undefined : `${assetBase}${path}`;

	return {
		getGameImage: (gameId) => toAssetUrl(config.images.games[gameId]?.imageUrl),
		getGameIcon: (gameId) => toAssetUrl(config.images.games[gameId]?.iconUrl),
		getPlayerIcon: (playerId) => toAssetUrl(config.images.players[playerId]?.imageUrl),
		getGameLocalisation: (gameId) => config.localisation.games[gameId],
		getStatLabels: (gameId, type) => {
			const groupId = config.stats.games[gameId]?.[type];

			return groupId ? config.stats.statGroups[groupId] ?? {} : {};
		},
		getOverallStatLabels: (type) => config.stats.overall[type] ?? {},
		getNavLinks: () => config.layout.navLinks,
	};
};
