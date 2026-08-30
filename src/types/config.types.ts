/** Presentational reference data loaded from the config files — shapes mirror `public/configs/*.json`. */

import { type StatType } from '../enums/config';

// ---------------------------------------------------------------------------
// Images (`images.json`)
// ---------------------------------------------------------------------------

/** `images.json` — image/icon paths relative to the GCS public bucket base URL. */
export interface ImagesConfig {
	games: Record<string, { imageUrl: string; iconUrl: string }>;
	players: Record<string, { imageUrl: string }>;
}

// ---------------------------------------------------------------------------
// Localisation (`localisation.json`)
// ---------------------------------------------------------------------------

/** A game's summary and rules text. */
export interface GameLocalisation {
	summary: string;
	rules: string;
}

/** `localisation.json` — per-game text content. */
export interface LocalisationConfig {
	games: Record<string, GameLocalisation>;
}

// ---------------------------------------------------------------------------
// Stats (`stats.json`)
// ---------------------------------------------------------------------------

/** Maps a stat property name to its display label; iteration order drives table column order. */
export type StatLabels = Record<string, string>;

/** `stats.json` — reusable stat groups, per-game references, and overall-ranking labels. */
export interface StatsConfig {
	statGroups: Record<string, StatLabels>;
	games: Record<string, Record<StatType, string>>;
	overall: Record<StatType, StatLabels>;
}

// ---------------------------------------------------------------------------
// Layout (`layout.json`)
// ---------------------------------------------------------------------------

/** A single navigation entry driving both Navbar and Footer. */
export interface NavLink {
	id: string;
	label: string;
	path: string;
	icon: string;
}

/** `layout.json` — ordered navigation links. */
export interface LayoutConfig {
	navLinks: NavLink[];
}

// ---------------------------------------------------------------------------
// Combined config & service surface
// ---------------------------------------------------------------------------

/** The combined result of fetching all four config files. */
export interface AppConfig {
	images: ImagesConfig;
	localisation: LocalisationConfig;
	stats: StatsConfig;
	layout: LayoutConfig;
}

/**
 * Getter surface over the loaded config. Image getters return fully-qualified URLs
 * (GCS base + relative path); the rest return the raw config slice. Missing ids
 * resolve to `undefined`/empty rather than throwing.
 */
export interface ConfigService {
	getGameImage: (gameId: string) => string | undefined;
	getGameIcon: (gameId: string) => string | undefined;
	getPlayerIcon: (playerId: string) => string | undefined;
	getGameLocalisation: (gameId: string) => GameLocalisation | undefined;
	getStatLabels: (gameId: string, type: StatType) => StatLabels;
	getOverallStatLabels: (type: StatType) => StatLabels;
	getNavLinks: () => NavLink[];
}
