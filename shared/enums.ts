/**
 * Shared enums that are part of the data contract — imported by the frontend
 * (`src/`), the converter (`lib/`) and the serverless function (`api/`).
 */

/**
 * How a game's ranking rows are shaped:
 * - HeadToHead: played/wins/goals (Air Hockey, Bar Footy)
 * - Bowls: played/wins/points yearly; head-to-head-shaped all-time
 * - AveragePoints: played/points yearly; played/averagePoints all-time (Ten Pin, Darts)
 * - TotalPoints: same shapes as AveragePoints (Cards)
 */
export enum GameKind {
	HeadToHead = 'headToHead',
	Bowls = 'bowls',
	AveragePoints = 'averagePoints',
	TotalPoints = 'totalPoints',
}

/** Machine-readable codes for conversion failures (factories live in `shared/errors.ts`). */
export enum ConversionErrorCode {
	CorruptWorkbook = 'CORRUPT_WORKBOOK',
	MissingSheet = 'MISSING_SHEET',
	NoPlayers = 'NO_PLAYERS',
	PlayerNameMismatch = 'PLAYER_NAME_MISMATCH',
	InvalidCell = 'INVALID_CELL',
}
