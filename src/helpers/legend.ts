import { type Game } from '../../shared/types';
import { type LegendEntry, type StatLabels } from '../types/config.types';

/**
 * Builds legend rows from config {@link StatLabels}: each abbreviated label paired with its
 * full description (falling back to the abbreviation itself). Entries that decode to their
 * own abbreviation (e.g. "Played" → "Played") are dropped — there's nothing to decode.
 */
export const buildStatLegend = (labels: StatLabels, describe: (key: string) => string | undefined): LegendEntry[] =>
	Object.entries(labels)
		.map(([key, abbreviation]) => ({ abbreviation, description: describe(key) ?? abbreviation }))
		.filter((entry) => entry.description !== entry.abbreviation);

/**
 * Builds legend rows for the per-game rank columns: each game abbreviation (falling back to
 * its name) decoded to the full game name, with the game icon so the mobile icon-only header
 * is identifiable.
 */
export const buildGameLegend = (
	games: Game[],
	getAbbreviation: (id: string) => string | undefined,
	getIcon: (id: string) => string | undefined,
): LegendEntry[] =>
	games.map((game) => ({ abbreviation: getAbbreviation(game.id) ?? game.name, description: game.name, icon: getIcon(game.id) }));
