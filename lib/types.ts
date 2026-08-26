/**
 * Data types for the Superstars data layer.
 *
 * The JSON shape here is the contract with the frontend validation logic —
 * it mirrors `example-data-shape.jsonc` exactly. Ranking rows are FLAT
 * (stats sit alongside rank/playerId, not nested under a `stats` key).
 */

import { type ConversionErrorCode, type GameKind, type GameName } from './enums';

// ---------------------------------------------------------------------------
// Metadata & entities
// ---------------------------------------------------------------------------

export interface Metadata {
	lastUpdated: string;
	sourceFile: string;
	availableYears: number[];
	totalPlayers: number;
	totalGames: number;
}

export interface Player {
	id: string;
	name: string;
}

export interface Game {
	id: string;
	name: string;
}

export interface Entities {
	players: Record<string, Player>;
	games: Record<string, Game>;
}

// ---------------------------------------------------------------------------
// Overall rankings
// ---------------------------------------------------------------------------

/** All-time rank per game; null where the player has never played that game. */
export type GameRanks = Record<string, number | null>;

export interface OverallAllTimeRanking {
	rank: number;
	playerId: string;
	/** 1000 minus the sum of the player's all-time game ranks — higher is better. */
	score: number;
	gameRanks: GameRanks;
}

export interface OverallYearRanking {
	rank: number;
	playerId: string;
	/** Sum of the player's rank in every game played that year — lower is better. */
	totalGameRanks: number;
}

/** Id fields are arrays because joint places are possible under sum-of-ranks scoring. */
export interface YearChampion {
	year: number;
	playerIds: string[];
	runnerUpIds: string[];
	thirdIds: string[];
}

// ---------------------------------------------------------------------------
// Per-game ranking rows (flat stat shapes, varying by game)
// ---------------------------------------------------------------------------

/** Air Hockey / Bar Footy rows, and Bowls all-time rows. */
export interface HeadToHeadStats {
	played: number;
	wins: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDifference: number;
}

/** Bowls yearly rows. */
export interface BowlsYearStats {
	played: number;
	wins: number;
	points: number;
}

/** Ten Pin / Cards yearly rows. */
export interface PointsYearStats {
	played: number;
	points: number;
}

/** Darts yearly rows — the average decides the rank, so it is included. */
export interface DartsYearStats extends PointsYearStats {
	averagePoints: number;
}

/** Ten Pin / Darts / Cards all-time rows. */
export interface AveragePointsStats {
	played: number;
	averagePoints: number;
}

interface RankingRowBase {
	rank: number;
	playerId: string;
}

export type GameAllTimeRanking = RankingRowBase & (HeadToHeadStats | AveragePointsStats);

export type GameYearRanking = RankingRowBase &
    (HeadToHeadStats | BowlsYearStats | DartsYearStats | PointsYearStats);

export interface GameRankings {
	allTime: GameAllTimeRanking[];
	byYear: Record<string, GameYearRanking[]>;
}

// ---------------------------------------------------------------------------
// Root structure
// ---------------------------------------------------------------------------

export interface OverallRankings {
	allTime: OverallAllTimeRanking[];
	byYear: Record<string, OverallYearRanking[]>;
	champions: YearChampion[];
}

export interface Rankings {
	overall: OverallRankings;
	byGame: Record<string, GameRankings>;
}

export interface SuperstarsData {
	metadata: Metadata;
	entities: Entities;
	rankings: Rankings;
}

// ---------------------------------------------------------------------------
// Conversion errors
// (codes are the ConversionErrorCode enum in `enums.ts`; the factory functions
// that build these error objects live in `errors.ts`)
// ---------------------------------------------------------------------------

export interface ConversionError {
	code: ConversionErrorCode;
	message: string;
	/** Machine-readable details (sheet name, cell address, …) for the error screen. */
	context?: Record<string, unknown>;
}

/** Returned instead of SuperstarsData when the spreadsheet is missing/corrupt/malformed. */
export interface ConversionErrors {
	errors: ConversionError[];
}

export type ConversionResult = SuperstarsData | ConversionErrors;

export const isConversionErrors = (result: ConversionResult): result is ConversionErrors =>
	'errors' in result;

// ---------------------------------------------------------------------------
// Conversion internals (used by convertMasterScores / utils, not the frontend)
// ---------------------------------------------------------------------------

export interface GameDefinition {
	gameId: string;
	sheetName: GameName;
	kind: GameKind;
	/** Darts rows expose the per-year average (mirrors the sheet's hidden helper column). */
	includeYearAverage?: boolean;
}

/** Accumulates cell-level problems while a workbook is being read. */
export interface ReadContext {
	errors: ConversionError[];
}

/** The player roster, keyed by worksheet row (players sit on the same rows on every sheet). */
export interface PlayerRoster {
	/** Worksheet row → assigned player id (`p_1`, `p_2`, … in row order). */
	playerIdByRow: Map<number, string>;
	/** Worksheet row → display name as written in the roster column. */
	namesByRow: Map<number, string>;
}

export interface RawYearStats {
	played: number;
	wins: number;
	/** "F"/goals-for column on head-to-head sheets; points on points sheets. */
	primary: number;
	/** "Ag"/goals-against column; pre-2024 Bowls points live here. */
	secondary: number;
	/** The sheet's computed yearly rank; null when the sheet shows none. */
	rank: number | null;
}

/** rawStats[playerRow][year] — only present where the player played that year. */
export type RawGameStats = Map<number, Map<number, RawYearStats>>;

/** The flat stat portion of a yearly ranking row (everything except rank/playerId). */
export type YearStats = HeadToHeadStats | BowlsYearStats | DartsYearStats | PointsYearStats;

// ---------------------------------------------------------------------------
// Workbook layout (the shapes of the constants in `consts.ts`)
// ---------------------------------------------------------------------------

/** One year block on a game sheet: the season and the column it starts at. */
export interface YearBlock {
	readonly year: number;
	readonly startCol: string;
}

/** Column offsets within a game sheet's year block, relative to its start column. */
export interface YearBlockOffsets {
	readonly played: number;
	readonly wins: number;
	/** First score column: "F"/goals-for on head-to-head sheets, points on points sheets. */
	readonly primary: number;
	/** Second score column: "Ag"/goals-against; pre-2024 Bowls points live here. */
	readonly secondary: number;
	/** The sheet's computed yearly rank ("1st", "2nd", …). */
	readonly rank: number;
}

/** The columns of a game sheet's all-time "Running Totals" block. */
export interface AllTimeColumns {
	readonly played: string;
	readonly wins: string;
	/** Goals-for on head-to-head sheets; average points on points sheets. */
	readonly primary: string;
	readonly secondary: string;
	readonly difference: string;
	readonly rank: string;
}

/** The Overall sheet's hidden calculation columns. */
export interface OverallColumns {
	/** First of six consecutive columns holding the player's numeric all-time rank per game. */
	readonly gameRankStart: string;
	/** 1000 minus the sum of the game ranks (higher is better). */
	readonly score: string;
	/** Numeric all-time rank. */
	readonly rank: string;
	/** Season totals (sum of that year's game ranks; "A" marks an absent player). */
	readonly yearTotals: ReadonlyArray<string>;
	/** Numeric season ranks, aligned with yearTotals. */
	readonly yearRanks: ReadonlyArray<string>;
}
