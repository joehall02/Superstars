/**
 * The Superstars data contract.
 *
 * This is the shape of the JSON the converter produces and the frontend consumes.
 */

import { type ConversionErrorCode } from './enums.js';

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
