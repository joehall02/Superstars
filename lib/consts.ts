/**
 * Workbook layout constants for the Master Scores spreadsheet.
 *
 * Everything here describes WHERE data lives in the workbook — sheet names,
 * player rows, year-block columns and the computed-rank/running-total blocks.
 */

import { GameKind } from '../shared/enums.js';
import { GameName } from './enums.js';
import { type AllTimeColumns, type GameDefinition, type OverallColumns, type YearBlock, type YearBlockOffsets } from './types.js';

/** Players occupy the same rows on every sheet. */
export const PLAYER_FIRST_ROW = 7;
export const PLAYER_LAST_ROW = 22;

/** Each year is a fixed block of columns; these are the block start columns.
 *  The same blocks exist on every game sheet. */
export const YEAR_BLOCKS: ReadonlyArray<YearBlock> = [
	{ year: 2020, startCol: 'D' },
	{ year: 2021, startCol: 'O' },
	{ year: 2022, startCol: 'Z' },
	{ year: 2023, startCol: 'AK' },
	{ year: 2024, startCol: 'AV' },
	{ year: 2025, startCol: 'BG' },
	{ year: 2026, startCol: 'BR' },
	{ year: 2027, startCol: 'CC' },
	{ year: 2028, startCol: 'CN' },
	{ year: 2029, startCol: 'CY' },
	{ year: 2030, startCol: 'DJ' },
];

/** Column offsets within a game sheet's year block (see YearBlockOffsets). */
export const OFFSET: YearBlockOffsets = { played: 0, wins: 1, primary: 3, secondary: 4, rank: 7 };

/** The game sheets' all-time "Running Totals" block. */
export const ALL_TIME_COLS: AllTimeColumns = {
	played: 'GO',
	wins: 'GP',
	primary: 'GR',
	secondary: 'GS',
	difference: 'GT',
	rank: 'GV',
};

/** The Overall sheet's hidden calculation columns. */
export const OVERALL_SHEET = 'Overall';
export const OVERALL_COLS: OverallColumns = {
	gameRankStart: 'GE',
	score: 'GK',
	rank: 'GL',
	yearTotals: ['KY', 'KZ', 'LA', 'LB', 'LC', 'LD', 'LE', 'LF', 'LG', 'LH', 'LI'],
	yearRanks: ['LO', 'LP', 'LQ', 'LR', 'LS', 'LT', 'LU', 'LV', 'LW', 'LX', 'LY'],
};

export const GAME_DEFINITIONS: ReadonlyArray<GameDefinition> = [
	{ gameId: 'g_1', sheetName: GameName.AirHockey, kind: GameKind.HeadToHead },
	{ gameId: 'g_2', sheetName: GameName.BarFooty, kind: GameKind.HeadToHead },
	{ gameId: 'g_3', sheetName: GameName.Bowls, kind: GameKind.Bowls },
	{ gameId: 'g_4', sheetName: GameName.TenPin, kind: GameKind.AveragePoints },
	{ gameId: 'g_5', sheetName: GameName.Darts, kind: GameKind.AveragePoints, includeYearAverage: true },
	{ gameId: 'g_6', sheetName: GameName.Cards, kind: GameKind.TotalPoints },
];

/** The Bowls sheet moved its points into the block's first score column in 2024
 *  (they lived in the second column before that). */
export const BOWLS_NEW_FORMAT_FROM = 2024;

export const SOURCE_FILE_NAME = 'Superstars - Master Scores.xlsx';
