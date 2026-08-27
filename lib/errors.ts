/**
 * Cnversion error factories, so every error object is built in one place.
 */

import { ConversionErrorCode } from '../shared/enums';
import { type ConversionError } from '../shared/types';

/**
 * The workbook buffer could not be parsed at all.
 *
 * @param cause - The underlying parse failure (Error or anything thrown).
 * @returns The CORRUPT_WORKBOOK conversion error.
 */
export const corruptWorkbookError = (cause: unknown): ConversionError => ({
	code: ConversionErrorCode.CorruptWorkbook,
	message: 'The spreadsheet could not be parsed — the file is missing or corrupt.',
	context: { cause: cause instanceof Error ? cause.message : String(cause) },
});

/**
 * A sheet the converter requires is absent from the workbook.
 *
 * @param sheetName - The missing sheet's name.
 * @returns The MISSING_SHEET conversion error.
 */
export const missingSheetError = (sheetName: string): ConversionError => ({
	code: ConversionErrorCode.MissingSheet,
	message: `Required sheet "${sheetName}" is missing from the workbook`,
	context: { sheetName },
});

/**
 * The player roster column contained no names at all.
 *
 * @param sheetName - The sheet the roster is read from.
 * @param firstRow - First worksheet row of the roster range.
 * @param lastRow - Last worksheet row of the roster range.
 * @returns The NO_PLAYERS conversion error.
 */
export const noPlayersError = (sheetName: string, firstRow: number, lastRow: number): ConversionError => ({
	code: ConversionErrorCode.NoPlayers,
	message: `No player names found in ${sheetName}!A${firstRow}:A${lastRow}`,
	context: { sheetName },
});

/**
 * A game sheet disagrees with the roster sheet about who sits in a row —
 * left uncaught, stats would silently be attributed to the wrong player.
 *
 * @param sheetName - The sheet with the differing name.
 * @param row - The worksheet row in question.
 * @param expected - The name on the roster sheet.
 * @param actual - The name found on this sheet (null when blank).
 * @param rosterSheetName - The sheet the roster was read from.
 * @returns The PLAYER_NAME_MISMATCH conversion error.
 */
export const playerNameMismatchError = (
	sheetName: string,
	row: number,
	expected: string,
	actual: string | null,
	rosterSheetName: string,
): ConversionError => ({
	code: ConversionErrorCode.PlayerNameMismatch,
	message: `Player row ${row} is "${expected}" on ${rosterSheetName} but "${actual ?? ''}" on ${sheetName}`,
	context: { sheetName, row, expected, actual },
});

/**
 * A raw stat cell held something that is not a number — reported rather than
 * silently zeroed, since that would misrepresent the spreadsheet.
 *
 * @param sheetName - The sheet containing the cell.
 * @param address - The cell address (e.g. "D7").
 * @param value - The value actually found in the cell.
 * @returns The INVALID_CELL conversion error.
 */
export const invalidCellError = (sheetName: string, address: string, value: unknown): ConversionError => ({
	code: ConversionErrorCode.InvalidCell,
	message: `Expected a number in ${sheetName}!${address} but found "${String(value)}"`,
	context: { sheetName, address, value },
});
