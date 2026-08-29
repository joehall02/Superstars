/**
 * Generic helpers for the spreadsheet conversion: number rounding, column
 * arithmetic and the cell readers.
 */

import * as XLSX from 'xlsx';

import { invalidCellError } from '../shared/errors';
import { type ReadContext } from './types';

/**
 * Rounds away float noise in cached formula results (e.g. 8.8800000000000008).
 *
 * @param value - The number to round.
 * @param decimalPlaces - How many decimal places to keep.
 * @returns The rounded number.
 */
export const round = (value: number, decimalPlaces: number): number => {
	const factor = 10 ** decimalPlaces;
	return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * The column `offset` places to the right of `startCol` (e.g. 'D' + 3 → 'G').
 *
 * @param startCol - The starting column letters.
 * @param offset - How many columns to move right.
 * @returns The resulting column letters.
 */
export const columnOffset = (startCol: string, offset: number): string =>
	XLSX.utils.encode_col(XLSX.utils.decode_col(startCol) + offset);

/**
 * The cell's usable value, or null when the cell is absent, blank or an error
 * cell (#VALUE! etc.) — the single definition of "this cell holds nothing".
 *
 * @param sheet - The worksheet to read.
 * @param address - The cell address (e.g. "D7").
 * @returns The raw cell value, or null when there is none.
 */
const cellValue = (sheet: XLSX.WorkSheet, address: string): string | number | boolean | Date | null => {
	const cell = sheet[address] as XLSX.CellObject | undefined;
	if (cell === undefined || cell.t === 'e' || cell.v === undefined || cell.v === null || cell.v === '') {
		return null;
	}
	return cell.v;
};

/**
 * Coerces a cell value to a finite number: numbers pass through, numeric
 * strings are parsed, everything else is null.
 *
 * @param value - A raw cell value.
 * @returns The number, or null when the value isn't numeric.
 */
const toNumber = (value: string | number | boolean | Date | null): number | null => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value === 'string') {
		const parsed = Number(value.trim());
		return value.trim() !== '' && Number.isFinite(parsed) ? parsed : null;
	}
	return null;
};

/**
 * Strict numeric read for raw stat cells — a present but non-numeric value is
 * a data problem and is reported rather than silently zeroed.
 *
 * @param sheet - The worksheet to read.
 * @param sheetName - The sheet's name, used in the INVALID_CELL report.
 * @param address - The cell address (e.g. "D7").
 * @param ctx - Read context that accumulates INVALID_CELL errors.
 * @returns The number, or null when the cell is blank or invalid.
 */
export const readCellNumber = (
	sheet: XLSX.WorkSheet,
	sheetName: string,
	address: string,
	ctx: ReadContext,
): number | null => {
	const value = cellValue(sheet, address);
	if (value === null) return null;
	const parsed = toNumber(value);
	if (parsed === null) ctx.errors.push(invalidCellError(sheetName, address, value));
	return parsed;
};

/**
 * Lenient numeric read for the sheet's computed cells. Errors (#VALUE!) and
 * markers like "A" simply mean "no value here" — that is the sheet's way of
 * saying a player is absent, so it is never reported as a problem.
 *
 * @param sheet - The worksheet to read.
 * @param address - The cell address (e.g. "GK7").
 * @returns The number, or null when there isn't one.
 */
export const readComputedNumber = (sheet: XLSX.WorkSheet, address: string): number | null =>
	toNumber(cellValue(sheet, address));

/**
 * Reads a rank cell — either a number or an ordinal string like "4th".
 *
 * @param sheet - The worksheet to read.
 * @param address - The cell address (e.g. "K7").
 * @returns The numeric rank, or null when the cell holds no rank.
 */
export const readCellRank = (sheet: XLSX.WorkSheet, address: string): number | null => {
	const value = cellValue(sheet, address);
	if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
	if (typeof value === 'string') {
		const match = /^\s*(\d+)\s*(st|nd|rd|th)?\s*$/i.exec(value);
		return match ? Number(match[1]) : null;
	}
	return null;
};

/**
 * Reads a cell as trimmed text (used for the player roster).
 *
 * @param sheet - The worksheet to read.
 * @param address - The cell address (e.g. "A7").
 * @returns The trimmed text, or null when the cell is blank.
 */
export const readCellString = (sheet: XLSX.WorkSheet, address: string): string | null => {
	const value = cellValue(sheet, address);
	if (value === null) return null;
	const text = String(value).trim();
	return text === '' ? null : text;
};
