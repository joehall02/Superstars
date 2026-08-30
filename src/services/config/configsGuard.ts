import { DataLoadResource } from '../../enums/errors';
import { isRecord } from '../../helpers/typeGuards';
import { type AppConfig } from '../../types/config.types';
import { ConfigError, invalidShapeThrower } from '../loadErrors';

/**
 * Pragmatic top-level shape guard for the fetched config. It checks the structural
 * skeleton the app relies on — not every entry — so a malformed payload fails fast
 * with a {@link ConfigError} instead of surfacing as a confusing runtime error deep
 * inside a component.
 */
export const assertAppConfig = (config: {
	images: unknown;
	localisation: unknown;
	stats: unknown;
	layout: unknown;
}): AppConfig => {
	const invalid = invalidShapeThrower(DataLoadResource.Config, ConfigError);

	const { images, localisation, stats, layout } = config;

	if (!isRecord(images) || !isRecord(images.games) || !isRecord(images.players)) {
		invalid('missing images.games / images.players');
	}

	if (!isRecord(localisation) || !isRecord(localisation.games)) invalid('missing localisation.games');

	if (!isRecord(stats) || !isRecord(stats.statGroups) || !isRecord(stats.games) || !isRecord(stats.overall)) {
		invalid('missing stats.{statGroups,games,overall}');
	}

	if (!isRecord(layout) || !Array.isArray(layout.navLinks)) invalid('missing layout.navLinks');

	return config as AppConfig;
};
