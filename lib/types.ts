/**
 * Conversion-internal types — used by the converter (`convertMasterScores.ts`),
 * its helpers (`utils.ts`) and its layout constants (`consts.ts`),`.
 */

import { type GameKind } from '../shared/enums.js';
import { type BowlsYearStats, type ConversionError, type DartsYearStats, type HeadToHeadStats, type PointsYearStats } from '../shared/types.js';
import { type GameName } from './enums.js';

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
