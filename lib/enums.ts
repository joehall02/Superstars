/**
 * Shared enums for the Superstars data layer.
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

/** The six games — values are the exact sheet names in the Master Scores workbook. */
export enum GameName {
	AirHockey = 'Air Hockey',
	BarFooty = 'Bar Footy',
	Bowls = 'Bowls',
	TenPin = 'Ten Pin',
	Darts = 'Darts',
	Cards = 'Cards',
}

/** Machine-readable codes for conversion failures (factories live in `errors.ts`). */
export enum ConversionErrorCode {
	CorruptWorkbook = 'CORRUPT_WORKBOOK',
	MissingSheet = 'MISSING_SHEET',
	NoPlayers = 'NO_PLAYERS',
	PlayerNameMismatch = 'PLAYER_NAME_MISMATCH',
	InvalidCell = 'INVALID_CELL',
}
